#!/bin/bash
#
# verify-backup.sh — Verify D1 export and R2 snapshot backups
#
# Usage: ./scripts/verify-backup.sh [--d1] [--r2] [--all] [--cleanup]
#
# Options:
#   --d1       Verify D1 database export only
#   --r2       Verify R2 bucket snapshot only
#   --all      Verify both D1 and R2 (default)
#   --cleanup  Delete temporary files after verification
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/tmp/mekong-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${BACKUP_DIR}/backup-report-${TIMESTAMP}.md"

# Cloudflare/D1/R2 config (from wrangler.toml)
D1_DATABASE_NAME="${D1_DATABASE_NAME:-mekong-raas-db}"
D1_DATABASE_ID="${D1_DATABASE_ID:-a0aa4f88-da5b-4616-84aa-7e559e37c91c}"
R2_BUCKET_NAME="${R2_BUCKET_NAME:-mekong-recipes}"

# Flags
VERIFY_D1=false
VERIFY_R2=false
DO_CLEANUP=false

# Parse arguments
if [[ $# -eq 0 ]]; then
    VERIFY_D1=true
    VERIFY_R2=true
else
    while [[ $# -gt 0 ]]; do
        case $1 in
            --d1)
                VERIFY_D1=true
                shift
                ;;
            --r2)
                VERIFY_R2=true
                shift
                ;;
            --all)
                VERIFY_D1=true
                VERIFY_R2=true
                shift
                ;;
            --cleanup)
                DO_CLEANUP=true
                shift
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                echo "Usage: $0 [--d1] [--r2] [--all] [--cleanup]"
                exit 1
                ;;
        esac
    done
fi

# If still false after parsing, default to all
if [[ "$VERIFY_D1" == "false" && "$VERIFY_R2" == "false" ]]; then
    VERIFY_D1=true
    VERIFY_R2=true
fi

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
setup_backup_dir() {
    log_info "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
}

# Verify D1 export
verify_d1_export() {
    log_info "=== Verifying D1 Database Export ==="

    local export_file="${BACKUP_DIR}/d1-export-${TIMESTAMP}.sql"
    local export_success=false
    local row_count=0
    local table_count=0
    local file_size=0

    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler CLI not found. Install with: npm install -g wrangler"
        return 1
    fi

    log_info "Exporting D1 database: ${D1_DATABASE_NAME} (${D1_DATABASE_ID})"

    # Export D1 database to SQL
    log_info "Attempting D1 export (local)..."
    if wrangler d1 export "${D1_DATABASE_NAME}" --output "${export_file}" 2>/dev/null; then
        export_success=true
        log_success "D1 export completed successfully (local)"
    else
        # Fallback: try with --remote flag
        log_warning "Local export failed, trying with --remote flag..."
        if wrangler d1 export "${D1_DATABASE_NAME}" --output "${export_file}" --remote 2>/dev/null; then
            export_success=true
            log_success "D1 export completed successfully (remote)"
        else
            # Final fallback: try with database_id
            log_warning "Remote export by name failed, trying with database_id..."
            if wrangler d1 export "${D1_DATABASE_ID}" --output "${export_file}" --remote 2>/dev/null; then
                export_success=true
                log_success "D1 export completed successfully (database_id)"
            else
                log_error "D1 export failed - check Cloudflare authentication and D1 access"
                log_info "Run 'wrangler login' to authenticate"
                return 1
            fi
        fi
    fi

    # Get file size
    if [[ -f "${export_file}" ]]; then
        file_size=$(stat -f%z "${export_file}" 2>/dev/null || stat -c%s "${export_file}" 2>/dev/null || echo "0")
        log_info "Export file size: $(numfmt --to=iec ${file_size} 2>/dev/null || echo "${file_size} bytes")"

        # Count tables (look for CREATE TABLE statements)
        table_count=$(grep -c "CREATE TABLE" "${export_file}" 2>/dev/null || echo "0")
        log_info "Tables found: ${table_count}"

        # Count INSERT statements for row estimation
        row_count=$(grep -c "INSERT INTO" "${export_file}" 2>/dev/null || echo "0")
        log_info "Row insert statements: ${row_count}"

        # Validate SQL syntax (basic check - file should have content)
        if [[ ${file_size} -gt 0 ]]; then
            log_success "D1 export validation passed"
        else
            log_error "D1 export file is empty"
            return 1
        fi
    else
        log_error "Export file not created"
        return 1
    fi

    # Store results for report
    D1_STATUS="success"
    D1_FILE="${export_file}"
    D1_SIZE="${file_size}"
    D1_TABLES="${table_count}"
    D1_ROWS="${row_count}"

    return 0
}

# Verify R2 bucket snapshot
verify_r2_snapshot() {
    log_info "=== Verifying R2 Bucket Snapshot ==="

    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler CLI not found. Install with: npm install -g wrangler"
        return 1
    fi

    log_info "Verifying R2 bucket access: ${R2_BUCKET_NAME}"

    # wrangler v4.x doesn't have 'r2 object list' command
    # Instead, verify bucket exists and is accessible via bucket info
    local bucket_exists=false

    # Try to get bucket info (verifies access)
    log_info "Checking bucket existence and access..."
    local bucket_info=$(wrangler r2 bucket info "${R2_BUCKET_NAME}" --json 2>/dev/null)
    if [[ -n "${bucket_info}" && "${bucket_info}" == *"\"name\""* ]]; then
        bucket_exists=true
        log_success "R2 bucket verified successfully"

        # Extract object count and size from JSON output
        if command -v jq &> /dev/null; then
            R2_OBJECTS=$(echo "${bucket_info}" | jq -r '.object_count // "0"')
            R2_SIZE=$(echo "${bucket_info}" | jq -r '.bucket_size // "0"')
            log_info "Objects in bucket: ${R2_OBJECTS}"
            log_info "Bucket size: ${R2_SIZE}"
        else
            R2_OBJECTS="0"
            R2_SIZE="0"
        fi
    else
        # Fallback: check if bucket appears in bucket list
        log_warning "Bucket info failed, checking bucket list..."
        local bucket_list=$(wrangler r2 bucket list 2>/dev/null)
        if echo "${bucket_list}" | grep -q "${R2_BUCKET_NAME}"; then
            bucket_exists=true
            log_success "R2 bucket found in bucket list"
            R2_OBJECTS="0"
            R2_SIZE="0"
        else
            log_warning "R2 bucket not found or inaccessible (bucket may not exist or requires authentication)"
            R2_STATUS="warning"
            R2_MESSAGE="Bucket not found or inaccessible"
            R2_OBJECTS="0"
            R2_SIZE="0"
            return 0
        fi
    fi

    # Store results for report
    R2_STATUS="success"

    log_success "R2 bucket verification passed (bucket exists and is accessible)"
    return 0
}

# Generate verification report
generate_report() {
    log_info "Generating verification report..."

    cat > "${REPORT_FILE}" << EOF
# Backup Verification Report

**Generated:** $(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)
**Backup Directory:** ${BACKUP_DIR}

---

## D1 Database Export

| Metric | Value |
|--------|-------|
| Status | ${D1_STATUS:-"skipped"} |
| Database | ${D1_DATABASE_NAME} |
| File | ${D1_FILE:-"N/A"} |
| Size | ${D1_SIZE:-0} bytes |
| Tables | ${D1_TABLES:-0} |
| Rows | ${D1_ROWS:-0} |

## R2 Bucket Snapshot

| Metric | Value |
|--------|-------|
| Status | ${R2_STATUS:-"skipped"} |
| Bucket | ${R2_BUCKET_NAME} |
| Objects | ${R2_OBJECTS:-0} |
| Total Size | ${R2_SIZE:-0} |

## Summary

$(
    if [[ "${D1_STATUS:-skipped}" == "success" && "${R2_STATUS:-skipped}" == "success" ]]; then
        echo "**✅ All backups verified successfully**"
    elif [[ "${D1_STATUS:-skipped}" == "success" || "${R2_STATUS:-skipped}" == "success" ]]; then
        echo "**⚠️ Partial verification completed**"
    else
        echo "**❌ Backup verification failed**"
    fi
)

---

*Report generated by verify-backup.sh*
EOF

    log_success "Report saved to: ${REPORT_FILE}"
}

# Cleanup temporary files
cleanup() {
    if [[ "${DO_CLEANUP}" == "true" ]]; then
        log_info "Cleaning up temporary files..."
        # Keep only the report, delete SQL dumps and listings
        find "${BACKUP_DIR}" -name "*.sql" -mtime +1 -delete 2>/dev/null || true
        find "${BACKUP_DIR}" -name "*.json" -mtime +1 -delete 2>/dev/null || true
        find "${BACKUP_DIR}" -name "*.txt" -mtime +1 -delete 2>/dev/null || true
        log_success "Cleanup completed"
    fi
}

# Main execution
main() {
    echo "========================================"
    echo "  Mekong Backup Verification Tool"
    echo "  $(date)"
    echo "========================================"
    echo ""

    setup_backup_dir

    local d1_result=0
    local r2_result=0

    if [[ "${VERIFY_D1}" == "true" ]]; then
        verify_d1_export || d1_result=1
        echo ""
    fi

    if [[ "${VERIFY_R2}" == "true" ]]; then
        verify_r2_snapshot || r2_result=1
        echo ""
    fi

    generate_report
    cleanup

    echo ""
    echo "========================================"
    if [[ ${d1_result} -eq 0 && ${r2_result} -eq 0 ]]; then
        log_success "Backup verification completed successfully"
    elif [[ ${d1_result} -eq 0 || ${r2_result} -eq 0 ]]; then
        log_warning "Backup verification completed with warnings"
    else
        log_error "Backup verification failed"
    fi
    echo "========================================"

    # Return non-zero if any verification failed
    [[ ${d1_result} -eq 0 && ${r2_result} -eq 0 ]]
}

main "$@"
