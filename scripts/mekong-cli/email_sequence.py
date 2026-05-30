#!/usr/bin/env python3
"""
📧 Email Sequence CLI tool
=========================
Usage:
    python3 scripts/email_sequence.py setup
"""

import sys
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from core.growth.email_sequence import EmailSequenceBuilder, SequenceType


def setup_sequences():
    """Setup email sequences and configurations."""
    print("📧 Setting up Binh Pháp Customer Funnel Email Sequences...")
    
    # 1. Create config directory
    config_dir = PROJECT_ROOT / "config" / "email_sequences"
    config_dir.mkdir(parents=True, exist_ok=True)
    
    # 2. Write sequence map JSON
    config_file = config_dir / "post_purchase.json"
    sequence_map = {
        "day_0": "welcome",
        "day_3": "tutorial",
        "day_7": "community",
        "day_14": "upsell",
        "day_30": "feedback"
    }
    
    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(sequence_map, f, indent=2)
        
    print(f"   ✅ Created configuration: {config_file.relative_to(PROJECT_ROOT)}")
    
    # 3. Print demo view of sequences
    builder = EmailSequenceBuilder("AgencyOS Platform", "Developer Tooling")
    print("\n" + builder.format_sequence_view(SequenceType.WELCOME))
    print(builder.format_sequence_view(SequenceType.ONBOARDING))


def main():
    if len(sys.argv) < 2 or sys.argv[1] != "setup":
        print("Usage: python3 scripts/email_sequence.py setup")
        sys.exit(1)
        
    setup_sequences()


if __name__ == "__main__":
    main()
