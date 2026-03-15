from __future__ import annotations

import argparse
from collections import defaultdict
from copy import deepcopy
import itertools
from pathlib import Path
import re
from typing import Any

from tree_schema import save_json, load_json, validate_tree


def _sanitize_id(raw: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]+", "_", raw)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned or "node"


def _node_type(node: dict[str, Any]) -> str:
    data = node.get("data") if isinstance(node.get("data"), dict) else {}
    ntype = str(data.get("type") or "").strip().lower()
    if ntype:
        return ntype

    raw = str(node.get("type") or "").strip().lower()
    if raw.endswith("node"):
        raw = raw[:-4]
    return raw or "dialogue"


def _map_text(node: dict[str, Any]) -> tuple[str, str, str]:
    node_id = str(node.get("id", "node"))
    data = node.get("data") if isinstance(node.get("data"), dict) else {}
    ntype = _node_type(node)
    label = str(data.get("label") or node_id)
    speaker = str(data.get("speaker") or "")

    if ntype == "dialogue":
        text_en = str(data.get("text") or label)
        text_ko = str(data.get("textKo") or text_en)
        return speaker or "Narrator", text_ko, text_en

    if ntype == "choice":
        text_ko = f"[선택] {label}"
        text_en = f"[Choice] {label}"
        return speaker or "System", text_ko, text_en

    if ntype == "result":
        on_success = data.get("onSuccess") if isinstance(data.get("onSuccess"), dict) else {}
        text_en = str(on_success.get("text") or data.get("label") or node_id)
        text_ko = str(on_success.get("textKo") or text_en)
        return speaker or "Result", text_ko, text_en

    if ntype == "trigger":
        min_day = data.get("minDay")
        max_day = data.get("maxDay")
        probability = data.get("probability")
        day_text = f"day {min_day}" if max_day in (None, "", min_day) else f"day {min_day}~{max_day}"
        text_en = f"Trigger {label}: {day_text}, probability {probability}"
        text_ko = f"트리거 {label}: {day_text}, 확률 {probability}"
        return speaker or "Trigger", text_ko, text_en

    if ntype == "branch":
        text_en = f"Branch check: {label}"
        text_ko = f"분기 체크: {label}"
        return speaker or "Branch", text_ko, text_en

    text_en = str(data.get("text") or label)
    text_ko = str(data.get("textKo") or text_en)
    return speaker or "Narrator", text_ko, text_en


def _extract_project(raw: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if isinstance(raw.get("project"), dict):
        project = raw["project"]
    else:
        project = raw

    nodes = project.get("nodes") if isinstance(project.get("nodes"), list) else []
    edges = project.get("edges") if isinstance(project.get("edges"), list) else []
    return nodes, edges


def _outgoing_sorted(edges: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)

    def handle_index(handle: Any) -> int:
        if not isinstance(handle, str):
            return 100000
        if handle.startswith("choice-"):
            tail = handle.split("-", 1)[1]
            if tail.isdigit():
                return int(tail)
        if handle == "true":
            return 0
        if handle == "false":
            return 1
        return 100000

    for edge in edges:
        source = str(edge.get("source") or "").strip()
        if not source:
            continue
        grouped[source].append(edge)

    for source, source_edges in grouped.items():
        source_edges.sort(
            key=lambda e: (
                handle_index(e.get("sourceHandle")),
                str(e.get("sourceHandle") or ""),
                str(e.get("target") or ""),
            )
        )
        grouped[source] = source_edges

    return grouped


def _pick_start(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> str:
    if not nodes:
        return ""

    incoming_count: dict[str, int] = defaultdict(int)
    for edge in edges:
        target = str(edge.get("target") or "").strip()
        if target:
            incoming_count[target] += 1

    trigger_candidates: list[tuple[int, str]] = []
    for node in nodes:
        nid = str(node.get("id") or "")
        data = node.get("data") if isinstance(node.get("data"), dict) else {}
        if _node_type(node) == "trigger":
            min_day = data.get("minDay")
            day_key = int(min_day) if isinstance(min_day, int) else 999999
            trigger_candidates.append((day_key, nid))

    if trigger_candidates:
        trigger_candidates.sort(key=lambda x: (x[0], x[1]))
        return trigger_candidates[0][1]

    roots = [str(node.get("id") or "") for node in nodes if incoming_count[str(node.get("id") or "")] == 0]
    roots = sorted([rid for rid in roots if rid])
    if roots:
        return roots[0]

    fallback = str(nodes[0].get("id") or "")
    return fallback


def convert_to_tree(raw: dict[str, Any], max_depth: int = 48) -> tuple[dict[str, Any], list[str]]:
    nodes, edges = _extract_project(raw)
    nodes_by_id: dict[str, dict[str, Any]] = {}
    for node in nodes:
        nid = str(node.get("id") or "").strip()
        if nid:
            nodes_by_id[nid] = node

    outgoing = _outgoing_sorted(edges)
    start_old_id = _pick_start(nodes, edges)
    warnings: list[str] = []

    if not start_old_id:
        payload = {
            "version": 1,
            "meta": {
                "title": "Converted UGC Tree",
                "author": "converter",
                "default_language": "ko",
                "start_node_id": "root",
            },
            "nodes": [
                {
                    "id": "root",
                    "speaker": "System",
                    "text": {
                        "ko": "변환할 노드를 찾지 못했습니다.",
                        "en": "No nodes found for conversion.",
                    },
                }
            ],
        }
        return payload, ["no start node detected"]

    counter = itertools.count(1)
    converted_nodes: list[dict[str, Any]] = []

    def emit(old_id: str, trail: tuple[str, ...], depth: int) -> str:
        old = nodes_by_id.get(old_id)
        if old is None:
            phantom_id = f"missing_{next(counter)}"
            converted_nodes.append(
                {
                    "id": phantom_id,
                    "speaker": "System",
                    "text": {
                        "ko": f"누락된 노드: {old_id}",
                        "en": f"Missing node: {old_id}",
                    },
                }
            )
            warnings.append(f"missing target node referenced: {old_id}")
            return phantom_id

        new_id = f"{_sanitize_id(old_id)}_{next(counter)}"
        speaker, text_ko, text_en = _map_text(old)
        node_out: dict[str, Any] = {
            "id": new_id,
            "speaker": speaker,
            "text": {
                "ko": text_ko,
                "en": text_en,
            },
            "source_node_id": old_id,
        }

        converted_nodes.append(node_out)

        if depth >= max_depth:
            warnings.append(f"max depth reached at {old_id}")
            return new_id

        if old_id in trail:
            warnings.append(f"cycle cut at {old_id}")
            return new_id

        local_trail = trail + (old_id,)
        local_outgoing = outgoing.get(old_id, [])
        ntype = _node_type(old)

        if ntype == "choice":
            data = old.get("data") if isinstance(old.get("data"), dict) else {}
            raw_choices = data.get("choices") if isinstance(data.get("choices"), list) else []
            out_choices: list[dict[str, Any]] = []

            for idx, raw_choice in enumerate(raw_choices):
                raw_choice = raw_choice if isinstance(raw_choice, dict) else {}
                cid = str(raw_choice.get("id") or f"choice_{idx}")
                text_en_choice = str(raw_choice.get("text") or f"Choice {idx + 1}")
                text_ko_choice = str(raw_choice.get("textKo") or text_en_choice)

                target = ""
                expected = f"choice-{idx}"
                for edge in local_outgoing:
                    if str(edge.get("sourceHandle") or "") == expected:
                        target = str(edge.get("target") or "").strip()
                        break

                if not target and idx < len(local_outgoing):
                    target = str(local_outgoing[idx].get("target") or "").strip()

                next_new = None
                if target:
                    next_new = emit(target, local_trail, depth + 1)

                choice_payload: dict[str, Any] = {
                    "id": cid,
                    "text": {
                        "ko": text_ko_choice,
                        "en": text_en_choice,
                    },
                }
                if next_new:
                    choice_payload["next"] = next_new
                out_choices.append(choice_payload)

            if out_choices:
                node_out["choices"] = out_choices
            return new_id

        if ntype == "branch":
            out_choices = []
            for edge in local_outgoing:
                handle = str(edge.get("sourceHandle") or "").strip() or "path"
                target = str(edge.get("target") or "").strip()
                if not target:
                    continue
                next_new = emit(target, local_trail, depth + 1)
                out_choices.append(
                    {
                        "id": f"{handle}_{len(out_choices)}",
                        "text": {
                            "ko": f"조건 {handle}",
                            "en": f"Condition {handle}",
                        },
                        "next": next_new,
                    }
                )
            if out_choices:
                node_out["choices"] = out_choices
            return new_id

        if local_outgoing:
            target = str(local_outgoing[0].get("target") or "").strip()
            if target:
                node_out["next"] = emit(target, local_trail, depth + 1)

        return new_id

    start_new_id = emit(start_old_id, tuple(), 0)

    payload = {
        "version": 1,
        "meta": {
            "title": "Converted UGC Tree",
            "author": "reactflow-converter",
            "default_language": "ko",
            "start_node_id": start_new_id,
            "source_start_node_id": start_old_id,
        },
        "nodes": converted_nodes,
    }

    return payload, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert legacy ReactFlow project JSON to single-tree JSON")
    parser.add_argument("--input", required=True, type=Path, help="ReactFlow export JSON")
    parser.add_argument("--output", required=True, type=Path, help="Output tree JSON")
    parser.add_argument("--max-depth", type=int, default=48, help="Hard depth cap when unfolding graph")
    args = parser.parse_args()

    raw = load_json(args.input)
    payload, warnings = convert_to_tree(raw, max_depth=args.max_depth)

    validation = validate_tree(payload)
    if validation.errors:
        print("[convert] produced invalid tree")
        for error in validation.errors:
            print(f"  - {error}")
        return 1

    save_json(args.output, payload)

    print("[convert] completed")
    print(f"  - input: {args.input}")
    print(f"  - output: {args.output}")
    print(f"  - node_count: {len(payload.get('nodes', []))}")

    for warning in warnings:
        print(f"  - warning: {warning}")
    for warning in validation.warnings:
        print(f"  - validation_warning: {warning}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
