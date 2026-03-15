from __future__ import annotations

import argparse
from pathlib import Path

from tree_schema import load_json, validate_tree, summarize_tree


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate single-tree UGC JSON")
    parser.add_argument("source", type=Path, help="Path to story_tree.json")
    args = parser.parse_args()

    payload = load_json(args.source)
    result = validate_tree(payload)
    summary = summarize_tree(payload)

    print("[tree] summary")
    for key, value in summary.items():
        print(f"  - {key}: {value}")

    if result.warnings:
        print("[tree] warnings")
        for warning in result.warnings:
            print(f"  - {warning}")

    if result.errors:
        print("[tree] errors")
        for error in result.errors:
            print(f"  - {error}")
        return 1

    print("[tree] validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
