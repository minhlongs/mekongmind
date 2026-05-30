#!/usr/bin/env bash
# build.sh — Build mekong_safety dylib and copy artifacts
#
# Usage:
#   ./rust_safety/build.sh
#   ./rust_safety/build.sh --release   (default)
#   ./rust_safety/build.sh --debug
#
# Output:
#   rust_safety/target/release/libmekong_safety.dylib  (macOS)
#   rust_safety/target/release/libmekong_safety.so     (Linux)
#   Copied to: internal/ffi/lib/
#   Header at: rust_safety/include/mekong_safety.h

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUST_DIR="${SCRIPT_DIR}"
FFI_LIB_DIR="${REPO_ROOT}/internal/ffi/lib"

PROFILE="release"
if [[ "${1:-}" == "--debug" ]]; then
    PROFILE="debug"
fi

echo "[build.sh] Building mekong_safety (profile=${PROFILE})..."
cd "${RUST_DIR}"

if [[ "${PROFILE}" == "release" ]]; then
    cargo build --release
    BUILD_DIR="${RUST_DIR}/target/release"
else
    cargo build
    BUILD_DIR="${RUST_DIR}/target/debug"
fi

# Detect platform dylib extension
if [[ "$(uname)" == "Darwin" ]]; then
    DYLIB_NAME="libmekong_safety.dylib"
else
    DYLIB_NAME="libmekong_safety.so"
fi

DYLIB_SRC="${BUILD_DIR}/${DYLIB_NAME}"
if [[ ! -f "${DYLIB_SRC}" ]]; then
    echo "[build.sh] ERROR: ${DYLIB_SRC} not found after cargo build"
    exit 1
fi

# Copy dylib to Go FFI lib dir
mkdir -p "${FFI_LIB_DIR}"
cp "${DYLIB_SRC}" "${FFI_LIB_DIR}/${DYLIB_NAME}"
echo "[build.sh] Copied ${DYLIB_NAME} → internal/ffi/lib/"

# Patch LC_ID_DYLIB so the binary references @rpath/libmekong_safety.dylib instead
# of the absolute Rust build path. This enables LC_RPATH search at runtime without
# manual install_name_tool on the installed binary.
if [[ "$(uname)" == "Darwin" ]]; then
    install_name_tool -id "@rpath/libmekong_safety.dylib" "${FFI_LIB_DIR}/${DYLIB_NAME}"
    echo "[build.sh] Patched LC_ID_DYLIB → @rpath/libmekong_safety.dylib"
fi

# Also copy staticlib for environments that prefer static linking
STATICLIB="${BUILD_DIR}/libmekong_safety.a"
if [[ -f "${STATICLIB}" ]]; then
    cp "${STATICLIB}" "${FFI_LIB_DIR}/libmekong_safety.a"
    echo "[build.sh] Copied libmekong_safety.a → internal/ffi/lib/"
fi

# Copy generated header
HEADER_SRC="${RUST_DIR}/include/mekong_safety.h"
if [[ -f "${HEADER_SRC}" ]]; then
    cp "${HEADER_SRC}" "${FFI_LIB_DIR}/mekong_safety.h"
    echo "[build.sh] Copied mekong_safety.h → internal/ffi/lib/"
fi

echo "[build.sh] Done. internal/ffi/lib/ contents:"
ls -lh "${FFI_LIB_DIR}/"
