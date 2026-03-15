from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import json
from typing import Any


@dataclass
class ValidationResult:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return len(self.errors) == 0


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8-sig") as f:
        return json.load(f)


def save_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _as_node_list(raw_nodes: Any) -> list[dict[str, Any]]:
    if isinstance(raw_nodes, list):
        return [x for x in raw_nodes if isinstance(x, dict)]
    if isinstance(raw_nodes, dict):
        out: list[dict[str, Any]] = []
        for key, value in raw_nodes.items():
            if isinstance(value, dict):
                node = dict(value)
                node.setdefault("id", str(key))
                out.append(node)
        return out
    return []


def collect_edges(nodes: list[dict[str, Any]]) -> list[tuple[str, str, str]]:
    edges: list[tuple[str, str, str]] = []
    for node in nodes:
        source = str(node.get("id", "")).strip()
        if not source:
            continue

        next_id = node.get("next")
        if isinstance(next_id, str) and next_id.strip():
            edges.append((source, next_id.strip(), "next"))

        choices = node.get("choices")
        if isinstance(choices, list):
            for idx, choice in enumerate(choices):
                if not isinstance(choice, dict):
                    continue
                target = choice.get("next")
                if isinstance(target, str) and target.strip():
                    choice_id = str(choice.get("id", f"choice_{idx}"))
                    edges.append((source, target.strip(), f"choice:{choice_id}"))

    return edges


def validate_tree(payload: dict[str, Any]) -> ValidationResult:
    result = ValidationResult()

    if not isinstance(payload, dict):
        result.errors.append("payload must be an object")
        return result

    meta = payload.get("meta")
    if not isinstance(meta, dict):
        result.errors.append("meta must be an object")
        return result

    start_id = str(meta.get("start_node_id", "")).strip()
    if not start_id:
        result.errors.append("meta.start_node_id is required")

    nodes = _as_node_list(payload.get("nodes"))
    if not nodes:
        result.errors.append("nodes must contain at least one node")
        return result

    node_ids: set[str] = set()
    id_to_node: dict[str, dict[str, Any]] = {}

    for idx, node in enumerate(nodes):
        node_id = str(node.get("id", "")).strip()
        if not node_id:
            result.errors.append(f"node[{idx}] missing id")
            continue

        if node_id in node_ids:
            result.errors.append(f"duplicate node id: {node_id}")
            continue

        node_ids.add(node_id)
        id_to_node[node_id] = node

        text = node.get("text")
        if not isinstance(text, dict):
            result.warnings.append(f"node {node_id} missing text bundle")
        else:
            if not text.get("ko"):
                result.warnings.append(f"node {node_id} missing text.ko")
            if not text.get("en"):
                result.warnings.append(f"node {node_id} missing text.en")

        choices = node.get("choices")
        if choices is not None and not isinstance(choices, list):
            result.errors.append(f"node {node_id} choices must be a list")

    if start_id and start_id not in node_ids:
        result.errors.append(f"meta.start_node_id not found: {start_id}")

    edges = collect_edges(nodes)
    indegree: dict[str, int] = {nid: 0 for nid in node_ids}
    adjacency: dict[str, list[str]] = {nid: [] for nid in node_ids}

    for source, target, edge_type in edges:
        if target not in node_ids:
            result.errors.append(f"edge target missing: {source} -> {target} ({edge_type})")
            continue

        indegree[target] += 1
        adjacency[source].append(target)

    if start_id:
        for nid in sorted(node_ids):
            if nid == start_id:
                continue
            degree = indegree[nid]
            if degree == 0:
                result.warnings.append(f"orphan node (no parent): {nid}")
            elif degree > 1:
                result.errors.append(f"not a tree: node {nid} has {degree} parents")

    if start_id and start_id in node_ids:
        visiting: set[str] = set()
        visited: set[str] = set()

        def dfs(nid: str) -> None:
            if nid in visiting:
                result.errors.append(f"cycle detected at node: {nid}")
                return
            if nid in visited:
                return

            visiting.add(nid)
            for child in adjacency.get(nid, []):
                dfs(child)
            visiting.remove(nid)
            visited.add(nid)

        dfs(start_id)

        unreachable = sorted(node_ids - visited)
        for nid in unreachable:
            result.warnings.append(f"unreachable node: {nid}")

    return result


def summarize_tree(payload: dict[str, Any]) -> dict[str, int]:
    nodes = _as_node_list(payload.get("nodes"))
    edges = collect_edges(nodes)
    choice_nodes = 0
    leaf_nodes = 0

    for node in nodes:
        choices = node.get("choices")
        if isinstance(choices, list) and len(choices) > 0:
            choice_nodes += 1

        next_id = node.get("next")
        has_next = isinstance(next_id, str) and next_id.strip() != ""
        has_choice = isinstance(choices, list) and len(choices) > 0
        if not has_next and not has_choice:
            leaf_nodes += 1

    return {
        "node_count": len(nodes),
        "edge_count": len(edges),
        "choice_node_count": choice_nodes,
        "leaf_node_count": leaf_nodes,
    }
