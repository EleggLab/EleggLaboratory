from __future__ import annotations

import argparse
from pathlib import Path

from tree_schema import load_json, save_json, summarize_tree, validate_tree


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate and package tree JSON for Ren'Py runtime")
    parser.add_argument("--source", type=Path, required=True, help="Source tree JSON")
    parser.add_argument("--target", type=Path, required=True, help="Target JSON under project/game")
    parser.add_argument("--strict", action="store_true", help="Fail on warnings")
    args = parser.parse_args()

    payload = load_json(args.source)
    result = validate_tree(payload)

    if result.errors:
        print("[build] validation failed")
        for error in result.errors:
            print(f"  - {error}")
        return 1

    if result.warnings:
        print("[build] warnings")
        for warning in result.warnings:
            print(f"  - {warning}")
        if args.strict:
            print("[build] strict mode enabled: fail on warnings")
            return 1

    save_json(args.target, payload)

    summary = summarize_tree(payload)
    print("[build] packaged tree for Ren'Py")
    print(f"  - source: {args.source}")
    print(f"  - target: {args.target}")
    print(f"  - nodes: {summary['node_count']}")
    print(f"  - choices: {summary['choice_node_count']}")
    print(f"  - leaves: {summary['leaf_node_count']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
