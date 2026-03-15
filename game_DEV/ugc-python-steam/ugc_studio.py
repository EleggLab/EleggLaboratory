from __future__ import annotations

import base64
import io
import json
import random
import uuid
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk
from tkinter.scrolledtext import ScrolledText

from PIL import Image, ImageTk


APP_DIR = Path(__file__).resolve().parent

UI_ASSET_PATHS = {
    "home_bg": APP_DIR / "assets" / "ui" / "home_bg.jpg",
    "story_bg": APP_DIR / "assets" / "ui" / "story_bg.jpg",
    "dialogue_container": APP_DIR / "assets" / "ui" / "dialogue_container.png",
    "reply_btn": APP_DIR / "assets" / "ui" / "reply_btn.png",
    "reply_btn_pressed": APP_DIR / "assets" / "ui" / "reply_btn_pressed.png",
    "next_btn": APP_DIR / "assets" / "ui" / "next_btn.png",
    "next_btn_pressed": APP_DIR / "assets" / "ui" / "next_btn_pressed.png",
}


def deep_copy(value):
    return json.loads(json.dumps(value))


def default_project():
    return {
        "meta": {"title": "Steam UGC Project", "author": "", "version": "1.0.0"},
        "nodes": [
            {
                "id": "day1-trigger",
                "type": "triggerNode",
                "position": {"x": 80, "y": 120},
                "data": {
                    "type": "trigger",
                    "label": "Day 1",
                    "minDay": 1,
                    "maxDay": 1,
                    "probability": 1.0,
                    "requiredFlags": [],
                    "requiredItems": [],
                },
            },
            {
                "id": "intro-dialogue",
                "type": "dialogueNode",
                "position": {"x": 300, "y": 120},
                "data": {
                    "type": "dialogue",
                    "label": "Intro",
                    "text": "A new request has arrived. What should we do?",
                    "textKo": "새로운 요청이 도착했다. 어떻게 할까?",
                    "characterId": "char-manager",
                    "backgroundId": "bg-home",
                },
            },
            {
                "id": "intro-choice",
                "type": "choiceNode",
                "position": {"x": 540, "y": 120},
                "data": {
                    "type": "choice",
                    "label": "Decision",
                    "choices": [
                        {"id": "intro-c1", "text": "Accept request", "textKo": "요청 수락", "requiredItem": None},
                        {"id": "intro-c2", "text": "Decline request", "textKo": "요청 거절", "requiredItem": None},
                    ],
                },
            },
            {
                "id": "result-accept",
                "type": "resultNode",
                "position": {"x": 780, "y": 60},
                "data": {
                    "type": "result",
                    "label": "Accept",
                    "successChance": 0.8,
                    "onSuccess": {
                        "text": "The mission starts. Team morale rises.",
                        "textKo": "미션이 시작되고 팀 사기가 오른다.",
                        "flagChanges": [{"flagId": "request_accepted", "value": True}],
                    },
                    "onFailure": {
                        "text": "The mission starts, but there is immediate trouble.",
                        "textKo": "미션은 시작됐지만 초반부터 문제가 생긴다.",
                        "flagChanges": [{"flagId": "request_accepted", "value": True}],
                    },
                },
            },
            {
                "id": "result-decline",
                "type": "resultNode",
                "position": {"x": 780, "y": 190},
                "data": {
                    "type": "result",
                    "label": "Decline",
                    "successChance": 1.0,
                    "onSuccess": {
                        "text": "You stay safe, but lose an opportunity.",
                        "textKo": "안전하게 남았지만 기회를 놓친다.",
                        "flagChanges": [{"flagId": "request_accepted", "value": False}],
                    },
                    "onFailure": {"text": "", "textKo": "", "flagChanges": []},
                },
            },
            {
                "id": "ending-dialogue",
                "type": "dialogueNode",
                "position": {"x": 1020, "y": 120},
                "data": {
                    "type": "dialogue",
                    "label": "Ending",
                    "text": "Day complete. Prepare for the next event.",
                    "textKo": "하루가 끝났다. 다음 이벤트를 준비하자.",
                    "characterId": "char-manager",
                    "backgroundId": "bg-story",
                },
            },
        ],
        "edges": [
            {"id": "e-1", "source": "day1-trigger", "target": "intro-dialogue", "type": "smoothstep"},
            {"id": "e-2", "source": "intro-dialogue", "target": "intro-choice", "type": "smoothstep"},
            {
                "id": "e-3",
                "source": "intro-choice",
                "sourceHandle": "choice-0",
                "target": "result-accept",
                "type": "smoothstep",
            },
            {
                "id": "e-4",
                "source": "intro-choice",
                "sourceHandle": "choice-1",
                "target": "result-decline",
                "type": "smoothstep",
            },
            {"id": "e-5", "source": "result-accept", "target": "ending-dialogue", "type": "smoothstep"},
            {"id": "e-6", "source": "result-decline", "target": "ending-dialogue", "type": "smoothstep"},
        ],
        "flags": [
            {"id": "request_accepted", "name": "Request Accepted", "defaultValue": False},
        ],
        "customStats": [],
        "layoutSettings": {},
        "globalStats": {},
        "recipes": [],
        "assets": {
            "backgrounds": [
                {"id": "bg-home", "name": "Home", "image": "assets/ui/home_bg.jpg"},
                {"id": "bg-story", "name": "Story", "image": "assets/ui/story_bg.jpg"},
            ],
            "characters": [
                {"id": "char-manager", "name": "Manager"},
            ],
            "items": [],
        },
    }


def default_node(node_type: str, node_id: str):
    node_type = node_type.strip().lower()
    base = {"id": node_id, "position": {"x": 100, "y": 100}}

    if node_type == "trigger":
        base["type"] = "triggerNode"
        base["data"] = {
            "type": "trigger",
            "label": "Trigger",
            "minDay": 1,
            "maxDay": None,
            "probability": 1.0,
            "requiredFlags": [],
            "requiredItems": [],
        }
        return base

    if node_type == "choice":
        base["type"] = "choiceNode"
        base["data"] = {
            "type": "choice",
            "label": "Choice",
            "choices": [
                {"id": f"{node_id}-c1", "text": "Option 1", "textKo": "선택지 1", "requiredItem": None},
                {"id": f"{node_id}-c2", "text": "Option 2", "textKo": "선택지 2", "requiredItem": None},
            ],
        }
        return base

    if node_type == "result":
        base["type"] = "resultNode"
        base["data"] = {
            "type": "result",
            "label": "Result",
            "successChance": 1.0,
            "onSuccess": {"text": "Success", "textKo": "성공", "flagChanges": []},
            "onFailure": {"text": "Failure", "textKo": "실패", "flagChanges": []},
        }
        return base

    if node_type == "branch":
        base["type"] = "branchNode"
        base["data"] = {
            "type": "branch",
            "label": "Branch",
            "conditions": [{"id": f"{node_id}-cond-1", "type": "flag", "flagId": "", "value": True}],
        }
        return base

    if node_type == "flag":
        base["type"] = "flagNode"
        base["data"] = {
            "type": "flag",
            "label": "Flag Set",
            "flagId": "",
            "value": True,
            "text": "Flag updated.",
            "textKo": "플래그가 변경되었다.",
        }
        return base

    base["type"] = "dialogueNode"
    base["data"] = {
        "type": "dialogue",
        "label": "Dialogue",
        "text": "Dialogue text",
        "textKo": "대사 텍스트",
        "characterId": None,
        "backgroundId": "bg-story",
    }
    return base


def normalize_project(payload: dict):
    if "project" in payload and isinstance(payload["project"], dict):
        project = deep_copy(payload["project"])
        if "assets" in payload and "assets" not in project:
            project["assets"] = deep_copy(payload["assets"])
    else:
        project = deep_copy(payload)

    result = default_project()
    for key in [
        "meta",
        "nodes",
        "edges",
        "flags",
        "customStats",
        "layoutSettings",
        "globalStats",
        "recipes",
        "assets",
    ]:
        if key in project:
            result[key] = project[key]

    if not isinstance(result.get("meta"), dict):
        result["meta"] = default_project()["meta"]

    for key in ["nodes", "edges", "flags", "customStats", "recipes"]:
        if not isinstance(result.get(key), list):
            result[key] = []

    if not isinstance(result.get("assets"), dict):
        result["assets"] = {}
    if not isinstance(result["assets"].get("backgrounds"), list) or len(result["assets"]["backgrounds"]) == 0:
        result["assets"]["backgrounds"] = default_project()["assets"]["backgrounds"]
    if not isinstance(result["assets"].get("characters"), list):
        result["assets"]["characters"] = []
    if not isinstance(result["assets"].get("items"), list):
        result["assets"]["items"] = []

    return result


class UGCStudioApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Python Steam UGC Studio")
        self.geometry("1480x920")
        self.minsize(1180, 760)

        self.project = default_project()
        self.project_path: Path | None = None
        self.project_dir: Path = APP_DIR

        self.selected_node_id: str | None = None
        self.node_ids_in_list: list[str] = []
        self.out_edge_ids_in_list: list[str] = []

        self.image_source_cache: dict[str, Image.Image] = {}
        self.ui_base_images: dict[str, Image.Image] = {}
        self.ui_photo_cache: dict[tuple[str, int, int], ImageTk.PhotoImage] = {}

        self.canvas_bg_photo: ImageTk.PhotoImage | None = None
        self.canvas_bg_item: int | None = None
        self.dialogue_panel_photo: ImageTk.PhotoImage | None = None
        self.next_button_photo: ImageTk.PhotoImage | None = None
        self.choice_button_photo: ImageTk.PhotoImage | None = None

        self.play_mode = "idle"
        self.current_node_id: str | None = None
        self.pending_result_next_id: str | None = None
        self.current_background_ref: str | None = None
        self.trigger_cursor = 0
        self.visited_triggers: set[str] = set()
        self.runtime_flags: dict[str, bool] = {}

        self._build_ui()
        self._load_static_ui_images()
        self._refresh_project_views()

    def _build_ui(self):
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)

        self.notebook = ttk.Notebook(self)
        self.notebook.grid(row=0, column=0, sticky="nsew")

        self.editor_tab = ttk.Frame(self.notebook)
        self.play_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.editor_tab, text="Editor")
        self.notebook.add(self.play_tab, text="Playtest")

        self._build_editor_tab()
        self._build_playtest_tab()

    def _build_editor_tab(self):
        self.editor_tab.columnconfigure(0, weight=1)
        self.editor_tab.rowconfigure(1, weight=1)

        header = ttk.Frame(self.editor_tab, padding=(10, 8))
        header.grid(row=0, column=0, sticky="ew")
        header.columnconfigure(5, weight=1)

        self.meta_title_var = tk.StringVar()
        self.meta_author_var = tk.StringVar()
        self.meta_version_var = tk.StringVar()
        self.meta_title_var.trace_add("write", self._on_meta_changed)
        self.meta_author_var.trace_add("write", self._on_meta_changed)
        self.meta_version_var.trace_add("write", self._on_meta_changed)

        ttk.Label(header, text="Title").grid(row=0, column=0, sticky="w")
        ttk.Entry(header, textvariable=self.meta_title_var, width=28).grid(row=0, column=1, sticky="w", padx=(6, 14))

        ttk.Label(header, text="Author").grid(row=0, column=2, sticky="w")
        ttk.Entry(header, textvariable=self.meta_author_var, width=20).grid(row=0, column=3, sticky="w", padx=(6, 14))

        ttk.Label(header, text="Version").grid(row=0, column=4, sticky="w")
        ttk.Entry(header, textvariable=self.meta_version_var, width=10).grid(row=0, column=5, sticky="w")

        buttons = ttk.Frame(header)
        buttons.grid(row=0, column=6, sticky="e")
        ttk.Button(buttons, text="New", command=self._new_project).pack(side="left", padx=(0, 4))
        ttk.Button(buttons, text="Load JSON", command=self._load_project_dialog).pack(side="left", padx=4)
        ttk.Button(buttons, text="Save", command=self._save_project).pack(side="left", padx=4)
        ttk.Button(buttons, text="Save As", command=self._save_project_as).pack(side="left", padx=4)

        content = ttk.Panedwindow(self.editor_tab, orient="horizontal")
        content.grid(row=1, column=0, sticky="nsew", padx=8, pady=(0, 8))

        left = ttk.Frame(content, padding=8)
        right = ttk.Frame(content, padding=8)
        content.add(left, weight=1)
        content.add(right, weight=3)

        left.columnconfigure(0, weight=1)
        left.rowconfigure(1, weight=1)
        ttk.Label(left, text="Nodes").grid(row=0, column=0, sticky="w")

        node_list_frame = ttk.Frame(left)
        node_list_frame.grid(row=1, column=0, sticky="nsew")
        node_list_frame.columnconfigure(0, weight=1)
        node_list_frame.rowconfigure(0, weight=1)

        self.node_listbox = tk.Listbox(node_list_frame, exportselection=False)
        self.node_listbox.grid(row=0, column=0, sticky="nsew")
        node_scroll = ttk.Scrollbar(node_list_frame, orient="vertical", command=self.node_listbox.yview)
        node_scroll.grid(row=0, column=1, sticky="ns")
        self.node_listbox.config(yscrollcommand=node_scroll.set)
        self.node_listbox.bind("<<ListboxSelect>>", self._on_node_selected)

        node_actions = ttk.Frame(left)
        node_actions.grid(row=2, column=0, sticky="ew", pady=(8, 0))
        ttk.Button(node_actions, text="Add Node", command=self._add_node).pack(side="left")
        ttk.Button(node_actions, text="Delete Node", command=self._delete_selected_node).pack(side="left", padx=6)
        ttk.Button(node_actions, text="Refresh", command=self._refresh_project_views).pack(side="left", padx=6)
        ttk.Button(node_actions, text="Add Flag Def", command=self._add_flag_definition).pack(side="left", padx=6)

        right.columnconfigure(0, weight=1)
        right.rowconfigure(0, weight=1)

        self.editor_notebook = ttk.Notebook(right)
        self.editor_notebook.grid(row=0, column=0, sticky="nsew")

        graph_tab = ttk.Frame(self.editor_notebook, padding=6)
        inspector_tab = ttk.Frame(self.editor_notebook, padding=6)
        self.editor_notebook.add(graph_tab, text="Node Graph")
        self.editor_notebook.add(inspector_tab, text="Inspector")

        graph_tab.columnconfigure(0, weight=1)
        graph_tab.rowconfigure(1, weight=1)

        graph_controls = ttk.Frame(graph_tab)
        graph_controls.grid(row=0, column=0, sticky="ew", pady=(0, 6))
        graph_controls.columnconfigure(8, weight=1)

        self.graph_add_type_var = tk.StringVar(value="dialogue")
        self.graph_connect_handle_var = tk.StringVar()
        self.graph_connect_mode_var = tk.BooleanVar(value=False)
        self.graph_connect_info_var = tk.StringVar(value="Connect mode: off")

        ttk.Label(graph_controls, text="Node Type").grid(row=0, column=0, sticky="w")
        self.graph_add_type_combo = ttk.Combobox(
            graph_controls,
            textvariable=self.graph_add_type_var,
            width=10,
            state="readonly",
            values=("trigger", "dialogue", "choice", "result", "branch", "flag"),
        )
        self.graph_add_type_combo.grid(row=0, column=1, sticky="w", padx=(6, 8))
        ttk.Button(graph_controls, text="Add At View", command=self._add_node_from_graph).grid(row=0, column=2, sticky="w")

        ttk.Checkbutton(
            graph_controls,
            text="Connect",
            variable=self.graph_connect_mode_var,
            command=self._on_graph_connect_mode_changed,
        ).grid(row=0, column=3, sticky="w", padx=(12, 6))

        ttk.Label(graph_controls, text="Handle").grid(row=0, column=4, sticky="w")
        ttk.Entry(graph_controls, textvariable=self.graph_connect_handle_var, width=12).grid(
            row=0, column=5, sticky="w", padx=(6, 8)
        )
        ttk.Button(graph_controls, text="Reset Source", command=self._reset_graph_connect_source).grid(
            row=0, column=6, sticky="w", padx=(0, 8)
        )
        ttk.Label(graph_controls, textvariable=self.graph_connect_info_var).grid(row=0, column=8, sticky="e")

        graph_canvas_frame = ttk.Frame(graph_tab)
        graph_canvas_frame.grid(row=1, column=0, sticky="nsew")
        graph_canvas_frame.columnconfigure(0, weight=1)
        graph_canvas_frame.rowconfigure(0, weight=1)

        self.graph_canvas = tk.Canvas(graph_canvas_frame, bg="#10161f", highlightthickness=0)
        self.graph_canvas.grid(row=0, column=0, sticky="nsew")

        graph_vbar = ttk.Scrollbar(graph_canvas_frame, orient="vertical", command=self.graph_canvas.yview)
        graph_vbar.grid(row=0, column=1, sticky="ns")
        graph_hbar = ttk.Scrollbar(graph_canvas_frame, orient="horizontal", command=self.graph_canvas.xview)
        graph_hbar.grid(row=1, column=0, sticky="ew")
        self.graph_canvas.configure(xscrollcommand=graph_hbar.set, yscrollcommand=graph_vbar.set)
        self.graph_canvas.configure(scrollregion=(0, 0, 2600, 1800))

        self.graph_canvas.bind("<ButtonPress-1>", self._on_graph_press)
        self.graph_canvas.bind("<B1-Motion>", self._on_graph_drag)
        self.graph_canvas.bind("<ButtonRelease-1>", self._on_graph_release)
        self.graph_canvas.bind("<Double-Button-1>", self._on_graph_double_click)

        self.graph_drag_node_id = None
        self.graph_drag_offset = (0, 0)
        self.graph_connect_source_id = None
        self.graph_node_items = {}
        self._suppress_node_select_event = False

        inspector_tab.columnconfigure(0, weight=1)
        inspector_tab.rowconfigure(2, weight=1)
        inspector_tab.rowconfigure(5, weight=1)

        self.selected_node_var = tk.StringVar(value="Selected: (none)")
        ttk.Label(inspector_tab, textvariable=self.selected_node_var).grid(row=0, column=0, sticky="w")

        quick_panel = ttk.LabelFrame(inspector_tab, text="Quick Node Edit", padding=8)
        quick_panel.grid(row=1, column=0, sticky="ew", pady=(6, 6))
        quick_panel.columnconfigure(1, weight=1)
        self._build_quick_editor(quick_panel)

        self.node_json_editor = ScrolledText(inspector_tab, height=14, wrap="none")
        self.node_json_editor.grid(row=2, column=0, sticky="nsew", pady=(6, 6))

        node_editor_actions = ttk.Frame(inspector_tab)
        node_editor_actions.grid(row=3, column=0, sticky="ew")
        ttk.Button(node_editor_actions, text="Apply Quick Edit", command=self._apply_quick_edit).pack(side="left")
        ttk.Button(node_editor_actions, text="Apply Node JSON", command=self._apply_node_json).pack(side="left", padx=6)
        ttk.Button(node_editor_actions, text="Format JSON", command=self._format_node_json).pack(side="left", padx=6)

        ttk.Separator(inspector_tab).grid(row=4, column=0, sticky="ew", pady=8)

        edge_panel = ttk.LabelFrame(inspector_tab, text="Outgoing Edges", padding=8)
        edge_panel.grid(row=5, column=0, sticky="nsew")
        edge_panel.columnconfigure(0, weight=1)
        edge_panel.rowconfigure(1, weight=1)

        edge_add = ttk.Frame(edge_panel)
        edge_add.grid(row=0, column=0, sticky="ew")
        edge_add.columnconfigure(1, weight=1)

        ttk.Label(edge_add, text="Target").grid(row=0, column=0, sticky="w")
        self.edge_target_var = tk.StringVar()
        self.edge_target_combo = ttk.Combobox(edge_add, textvariable=self.edge_target_var, state="readonly")
        self.edge_target_combo.grid(row=0, column=1, sticky="ew", padx=(6, 8))

        ttk.Label(edge_add, text="Source Handle").grid(row=0, column=2, sticky="w")
        self.edge_handle_var = tk.StringVar()
        ttk.Entry(edge_add, textvariable=self.edge_handle_var, width=16).grid(row=0, column=3, sticky="w", padx=(6, 8))
        ttk.Button(edge_add, text="Add Edge", command=self._add_edge).grid(row=0, column=4, sticky="w")

        edge_list_frame = ttk.Frame(edge_panel)
        edge_list_frame.grid(row=1, column=0, sticky="nsew", pady=(8, 0))
        edge_list_frame.columnconfigure(0, weight=1)
        edge_list_frame.rowconfigure(0, weight=1)

        self.edge_listbox = tk.Listbox(edge_list_frame, exportselection=False)
        self.edge_listbox.grid(row=0, column=0, sticky="nsew")
        edge_scroll = ttk.Scrollbar(edge_list_frame, orient="vertical", command=self.edge_listbox.yview)
        edge_scroll.grid(row=0, column=1, sticky="ns")
        self.edge_listbox.config(yscrollcommand=edge_scroll.set)

        edge_actions = ttk.Frame(edge_panel)
        edge_actions.grid(row=2, column=0, sticky="ew", pady=(8, 0))
        ttk.Button(edge_actions, text="Delete Edge", command=self._delete_selected_edge).pack(side="left")

    def _build_quick_editor(self, parent):
        self.quick_node_type_var = tk.StringVar(value="Type: (none)")
        self.quick_label_var = tk.StringVar()
        self.quick_trigger_min_var = tk.StringVar()
        self.quick_trigger_max_var = tk.StringVar()
        self.quick_trigger_prob_var = tk.StringVar()
        self.quick_dialogue_text_var = tk.StringVar()
        self.quick_dialogue_text_ko_var = tk.StringVar()
        self.quick_dialogue_char_var = tk.StringVar()
        self.quick_dialogue_bg_var = tk.StringVar()
        self.quick_choice_prompt_var = tk.StringVar()
        self.quick_result_chance_var = tk.StringVar()
        self.quick_result_success_var = tk.StringVar()
        self.quick_result_failure_var = tk.StringVar()
        self.quick_flag_node_id_var = tk.StringVar()
        self.quick_flag_node_value_var = tk.BooleanVar(value=True)
        self.quick_flag_node_text_var = tk.StringVar()
        self.quick_flag_node_text_ko_var = tk.StringVar()

        ttk.Label(parent, textvariable=self.quick_node_type_var).grid(row=0, column=0, sticky="w")
        ttk.Label(parent, text="Label").grid(row=0, column=1, sticky="w", padx=(12, 0))
        ttk.Entry(parent, textvariable=self.quick_label_var).grid(row=0, column=2, sticky="ew", padx=(6, 0))

        parent.columnconfigure(2, weight=1)

        self.quick_notebook = ttk.Notebook(parent)
        self.quick_notebook.grid(row=1, column=0, columnspan=3, sticky="ew", pady=(8, 0))

        self.quick_trigger_tab = ttk.Frame(self.quick_notebook, padding=6)
        self.quick_dialogue_tab = ttk.Frame(self.quick_notebook, padding=6)
        self.quick_choice_tab = ttk.Frame(self.quick_notebook, padding=6)
        self.quick_result_tab = ttk.Frame(self.quick_notebook, padding=6)
        self.quick_branch_tab = ttk.Frame(self.quick_notebook, padding=6)
        self.quick_flag_tab = ttk.Frame(self.quick_notebook, padding=6)

        self.quick_notebook.add(self.quick_trigger_tab, text="Trigger")
        self.quick_notebook.add(self.quick_dialogue_tab, text="Dialogue")
        self.quick_notebook.add(self.quick_choice_tab, text="Choice")
        self.quick_notebook.add(self.quick_result_tab, text="Result")
        self.quick_notebook.add(self.quick_branch_tab, text="Branch")
        self.quick_notebook.add(self.quick_flag_tab, text="Flag")

        self.quick_trigger_tab.columnconfigure(5, weight=1)
        ttk.Label(self.quick_trigger_tab, text="Min Day").grid(row=0, column=0, sticky="w")
        ttk.Entry(self.quick_trigger_tab, textvariable=self.quick_trigger_min_var, width=8).grid(
            row=0, column=1, sticky="w", padx=(6, 16)
        )
        ttk.Label(self.quick_trigger_tab, text="Max Day").grid(row=0, column=2, sticky="w")
        ttk.Entry(self.quick_trigger_tab, textvariable=self.quick_trigger_max_var, width=8).grid(
            row=0, column=3, sticky="w", padx=(6, 16)
        )
        ttk.Label(self.quick_trigger_tab, text="Probability").grid(row=0, column=4, sticky="w")
        ttk.Entry(self.quick_trigger_tab, textvariable=self.quick_trigger_prob_var, width=8).grid(
            row=0, column=5, sticky="w", padx=(6, 0)
        )

        self.quick_dialogue_tab.columnconfigure(1, weight=1)
        ttk.Label(self.quick_dialogue_tab, text="Text").grid(row=0, column=0, sticky="w")
        ttk.Entry(self.quick_dialogue_tab, textvariable=self.quick_dialogue_text_var).grid(
            row=0, column=1, sticky="ew", padx=(6, 0)
        )
        ttk.Label(self.quick_dialogue_tab, text="TextKo").grid(row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(self.quick_dialogue_tab, textvariable=self.quick_dialogue_text_ko_var).grid(
            row=1, column=1, sticky="ew", padx=(6, 0), pady=(6, 0)
        )
        ttk.Label(self.quick_dialogue_tab, text="CharacterId").grid(row=2, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(self.quick_dialogue_tab, textvariable=self.quick_dialogue_char_var).grid(
            row=2, column=1, sticky="ew", padx=(6, 0), pady=(6, 0)
        )
        ttk.Label(self.quick_dialogue_tab, text="BackgroundId").grid(row=3, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(self.quick_dialogue_tab, textvariable=self.quick_dialogue_bg_var).grid(
            row=3, column=1, sticky="ew", padx=(6, 0), pady=(6, 0)
        )

        self.quick_choice_tab.columnconfigure(1, weight=1)
        ttk.Label(self.quick_choice_tab, text="Prompt").grid(row=0, column=0, sticky="w")
        ttk.Entry(self.quick_choice_tab, textvariable=self.quick_choice_prompt_var).grid(
            row=0, column=1, sticky="ew", padx=(6, 0)
        )
        ttk.Label(self.quick_choice_tab, text="Choices").grid(row=1, column=0, sticky="nw", pady=(6, 0))
        self.quick_choice_lines = ScrolledText(self.quick_choice_tab, height=5, wrap="none")
        self.quick_choice_lines.grid(row=1, column=1, sticky="ew", padx=(6, 0), pady=(6, 0))
        ttk.Label(self.quick_choice_tab, text="format: text|textKo|requiredItem").grid(
            row=2, column=1, sticky="w", pady=(4, 0)
        )

        self.quick_result_tab.columnconfigure(1, weight=1)
        ttk.Label(self.quick_result_tab, text="Success Chance").grid(row=0, column=0, sticky="w")
        ttk.Entry(self.quick_result_tab, textvariable=self.quick_result_chance_var, width=8).grid(
            row=0, column=1, sticky="w", padx=(6, 0)
        )
        ttk.Label(self.quick_result_tab, text="Success Text").grid(row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(self.quick_result_tab, textvariable=self.quick_result_success_var).grid(
            row=1, column=1, sticky="ew", padx=(6, 0), pady=(6, 0)
        )
        ttk.Label(self.quick_result_tab, text="Failure Text").grid(row=2, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(self.quick_result_tab, textvariable=self.quick_result_failure_var).grid(
            row=2, column=1, sticky="ew", padx=(6, 0), pady=(6, 0)
        )
        ttk.Label(self.quick_result_tab, text="Flag Changes").grid(row=3, column=0, sticky="nw", pady=(6, 0))
        self.quick_result_flags = ScrolledText(self.quick_result_tab, height=4, wrap="none")
        self.quick_result_flags.grid(row=3, column=1, sticky="ew", padx=(6, 0), pady=(6, 0))
        ttk.Label(self.quick_result_tab, text="format: flagId=true").grid(row=4, column=1, sticky="w", pady=(4, 0))

        self.quick_branch_tab.columnconfigure(1, weight=1)
        ttk.Label(self.quick_branch_tab, text="Conditions").grid(row=0, column=0, sticky="nw")
        self.quick_branch_conditions = ScrolledText(self.quick_branch_tab, height=5, wrap="none")
        self.quick_branch_conditions.grid(row=0, column=1, sticky="ew", padx=(6, 0))
        ttk.Label(self.quick_branch_tab, text="format: flagId=true").grid(row=1, column=1, sticky="w", pady=(4, 0))

        self.quick_flag_tab.columnconfigure(1, weight=1)
        ttk.Label(self.quick_flag_tab, text="Flag Id").grid(row=0, column=0, sticky="w")
        ttk.Entry(self.quick_flag_tab, textvariable=self.quick_flag_node_id_var).grid(
            row=0, column=1, sticky="ew", padx=(6, 0)
        )
        ttk.Checkbutton(self.quick_flag_tab, text="Value True", variable=self.quick_flag_node_value_var).grid(
            row=1, column=1, sticky="w", pady=(6, 0)
        )
        ttk.Label(self.quick_flag_tab, text="Text").grid(row=2, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(self.quick_flag_tab, textvariable=self.quick_flag_node_text_var).grid(
            row=2, column=1, sticky="ew", padx=(6, 0), pady=(6, 0)
        )
        ttk.Label(self.quick_flag_tab, text="TextKo").grid(row=3, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(self.quick_flag_tab, textvariable=self.quick_flag_node_text_ko_var).grid(
            row=3, column=1, sticky="ew", padx=(6, 0), pady=(6, 0)
        )

    def _add_flag_definition(self):
        flag_id = simpledialog.askstring("Flag ID", "Enter flag id", parent=self)
        if not flag_id:
            return
        flag_id = flag_id.strip()
        if not flag_id:
            return
        existing = [f for f in self.project.get("flags", []) if str(f.get("id")) == flag_id]
        if existing:
            messagebox.showerror("Duplicate", f"Flag '{flag_id}' already exists.")
            return

        flag_name = simpledialog.askstring("Flag Name", "Display name", parent=self, initialvalue=flag_id) or flag_id
        default_value = messagebox.askyesno("Default Value", "Default to True?")
        self.project.setdefault("flags", []).append(
            {"id": flag_id, "name": flag_name.strip() or flag_id, "defaultValue": bool(default_value)}
        )
        self.play_status_var.set(f"Flag added: {flag_id}")
        self._refresh_project_views()

    def _add_node_from_graph(self):
        node_type = self.graph_add_type_var.get().strip().lower() or "dialogue"
        x, y = self._graph_view_center()
        self._add_node(node_type=node_type, position=(x, y))

    def _graph_view_center(self):
        x0 = self.graph_canvas.canvasx(0)
        y0 = self.graph_canvas.canvasy(0)
        w = max(1, self.graph_canvas.winfo_width())
        h = max(1, self.graph_canvas.winfo_height())
        return int(x0 + (w / 2) - 110), int(y0 + (h / 2) - 40)

    def _on_graph_connect_mode_changed(self):
        if self.graph_connect_mode_var.get():
            self.graph_connect_info_var.set("Connect mode: click source node")
        else:
            self._reset_graph_connect_source()
            self.graph_connect_info_var.set("Connect mode: off")
        self._redraw_graph()

    def _reset_graph_connect_source(self):
        self.graph_connect_source_id = None
        if self.graph_connect_mode_var.get():
            self.graph_connect_info_var.set("Connect mode: click source node")
        else:
            self.graph_connect_info_var.set("Connect mode: off")
        self._redraw_graph()

    def _on_graph_press(self, event):
        x = self.graph_canvas.canvasx(event.x)
        y = self.graph_canvas.canvasy(event.y)
        node_id = self._graph_node_id_from_xy(x, y)
        if not node_id:
            self.graph_drag_node_id = None
            return

        if self.graph_connect_mode_var.get():
            if self.graph_connect_source_id is None:
                self.graph_connect_source_id = node_id
                self.graph_connect_info_var.set(f"Source: {node_id} -> click target")
                self._set_selected_node(node_id, update_list=True)
                self._redraw_graph()
            else:
                source_id = self.graph_connect_source_id
                target_id = node_id
                if source_id == target_id:
                    return
                handle = self.graph_connect_handle_var.get().strip()
                if not handle:
                    handle = self._auto_source_handle(source_id)
                if self._add_edge_core(source_id, target_id, handle):
                    self.graph_connect_source_id = None
                    self.graph_connect_info_var.set("Edge created. Click source node")
                    self._refresh_project_views()
                    self._set_selected_node(source_id, update_list=True)
            return

        self._set_selected_node(node_id, update_list=True)
        node = self._node_by_id(node_id)
        if node is None:
            return
        px = int((node.get("position") or {}).get("x") or 0)
        py = int((node.get("position") or {}).get("y") or 0)
        self.graph_drag_node_id = node_id
        self.graph_drag_offset = (x - px, y - py)

    def _on_graph_drag(self, event):
        if self.graph_connect_mode_var.get():
            return
        if not self.graph_drag_node_id:
            return
        node = self._node_by_id(self.graph_drag_node_id)
        if node is None:
            return

        x = int(self.graph_canvas.canvasx(event.x) - self.graph_drag_offset[0])
        y = int(self.graph_canvas.canvasy(event.y) - self.graph_drag_offset[1])
        x = max(0, x)
        y = max(0, y)
        node["position"] = {"x": x, "y": y}
        self._redraw_graph()

    def _on_graph_release(self, _event):
        self.graph_drag_node_id = None

    def _on_graph_double_click(self, event):
        x = self.graph_canvas.canvasx(event.x)
        y = self.graph_canvas.canvasy(event.y)
        node_id = self._graph_node_id_from_xy(x, y)
        if node_id:
            return
        node_type = self.graph_add_type_var.get().strip().lower() or "dialogue"
        self._add_node(node_type=node_type, position=(int(x), int(y)))

    def _graph_node_id_from_xy(self, x, y):
        for item in reversed(self.graph_canvas.find_overlapping(x - 1, y - 1, x + 1, y + 1)):
            tags = self.graph_canvas.gettags(item)
            for tag in tags:
                if tag.startswith("node:"):
                    return tag.split(":", 1)[1]
        return None

    def _node_fill_color(self, node_type: str):
        colors = {
            "trigger": "#2c7be5",
            "dialogue": "#6f42c1",
            "choice": "#e83e8c",
            "branch": "#fd7e14",
            "result": "#20c997",
            "flag": "#17a2b8",
        }
        return colors.get(node_type, "#6c757d")

    def _node_display_label(self, node):
        node_type = self._node_type(node)
        data = node.get("data", {}) if isinstance(node.get("data"), dict) else {}
        label = str(data.get("label") or node.get("id") or "").strip()
        if node_type == "flag":
            fid = str(data.get("flagId", "")).strip()
            if fid:
                label = f"{label}\n{fid}={bool(data.get('value', True))}"
        if node_type == "branch":
            conds = data.get("conditions")
            if isinstance(conds, list) and conds:
                label = f"{label}\n{len(conds)} condition(s)"
        return label

    def _redraw_graph(self):
        if not hasattr(self, "graph_canvas"):
            return

        self.graph_canvas.delete("all")
        self.graph_node_items = {}

        nodes = self.project.get("nodes", [])
        node_map = {str(n.get("id")): n for n in nodes}

        for edge in self.project.get("edges", []):
            source = node_map.get(str(edge.get("source")))
            target = node_map.get(str(edge.get("target")))
            if not source or not target:
                continue
            s_pos = source.get("position") or {}
            t_pos = target.get("position") or {}
            x1 = int(s_pos.get("x") or 0) + 110
            y1 = int(s_pos.get("y") or 0) + 42
            x2 = int(t_pos.get("x") or 0) + 110
            y2 = int(t_pos.get("y") or 0) + 42

            self.graph_canvas.create_line(x1, y1, x2, y2, arrow=tk.LAST, fill="#9bb4d1", width=2)
            handle = str(edge.get("sourceHandle") or "").strip()
            if handle:
                mx = int((x1 + x2) / 2)
                my = int((y1 + y2) / 2)
                self.graph_canvas.create_text(
                    mx,
                    my - 8,
                    text=handle,
                    fill="#d4deea",
                    font=("Segoe UI", 8, "bold"),
                )

        for node in self._sorted_nodes(nodes):
            node_id = str(node.get("id"))
            node_type = self._node_type(node)
            pos = node.get("position") or {}
            x = int(pos.get("x") or 0)
            y = int(pos.get("y") or 0)
            w = 220
            h = 84

            fill = self._node_fill_color(node_type)
            outline = "#ffe082" if node_id == self.selected_node_id else "#32465c"
            width = 3 if node_id == self.selected_node_id else 1
            rect = self.graph_canvas.create_rectangle(x, y, x + w, y + h, fill=fill, outline=outline, width=width)
            text = self.graph_canvas.create_text(
                x + (w // 2),
                y + (h // 2),
                text=f"{node_id}\n{self._node_display_label(node)}",
                fill="#ffffff",
                width=w - 16,
                justify="center",
                font=("Segoe UI", 9, "bold"),
            )

            tag = f"node:{node_id}"
            self.graph_canvas.itemconfigure(rect, tags=("node", tag))
            self.graph_canvas.itemconfigure(text, tags=("node", tag))
            self.graph_node_items[node_id] = (rect, text)

            if self.graph_connect_source_id == node_id:
                self.graph_canvas.create_rectangle(
                    x - 4,
                    y - 4,
                    x + w + 4,
                    y + h + 4,
                    outline="#ffdd57",
                    width=2,
                )

        bbox = self.graph_canvas.bbox("all")
        if bbox:
            pad = 120
            self.graph_canvas.configure(scrollregion=(bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad))
        else:
            self.graph_canvas.configure(scrollregion=(0, 0, 2400, 1600))

    def _set_selected_node(self, node_id: str | None, update_list: bool = False):
        self.selected_node_id = node_id
        node = self._node_by_id(node_id) if node_id else None

        if update_list:
            self._suppress_node_select_event = True
            try:
                self.node_listbox.selection_clear(0, "end")
                if node_id and node_id in self.node_ids_in_list:
                    idx = self.node_ids_in_list.index(node_id)
                    self.node_listbox.selection_set(idx)
                    self.node_listbox.activate(idx)
                    self.node_listbox.see(idx)
            finally:
                self._suppress_node_select_event = False

        if node is None:
            self.selected_node_var.set("Selected: (none)")
            self.node_json_editor.delete("1.0", "end")
            self._refresh_outgoing_edges()
            self._redraw_graph()
            return

        self.selected_node_var.set(f"Selected: {node_id}")
        self.node_json_editor.delete("1.0", "end")
        self.node_json_editor.insert("1.0", json.dumps(node, ensure_ascii=False, indent=2))
        self._load_quick_form(node)
        self._refresh_outgoing_edges()
        self._redraw_graph()

    def _parse_bool(self, raw, default=False):
        text = str(raw).strip().lower()
        if text in {"1", "true", "yes", "y", "on"}:
            return True
        if text in {"0", "false", "no", "n", "off"}:
            return False
        return default

    def _parse_flag_assignments(self, text):
        result = []
        for raw_line in str(text).splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if "=" in line:
                flag_id, value_text = line.split("=", 1)
                flag_id = flag_id.strip()
                if not flag_id:
                    continue
                result.append({"flagId": flag_id, "value": self._parse_bool(value_text, default=True)})
            else:
                result.append({"flagId": line, "value": True})
        return result

    def _format_flag_assignments(self, changes):
        if not isinstance(changes, list):
            return ""
        rows = []
        for c in changes:
            if not isinstance(c, dict):
                continue
            fid = str(c.get("flagId", "")).strip()
            if not fid:
                continue
            rows.append(f"{fid}={str(bool(c.get('value', True))).lower()}")
        return "\n".join(rows)

    def _load_quick_form(self, node):
        node_type = self._node_type(node)
        data = node.get("data", {}) if isinstance(node.get("data"), dict) else {}

        self.quick_node_type_var.set(f"Type: {node_type}")
        self.quick_label_var.set(str(data.get("label", "")))

        type_to_tab = {
            "trigger": self.quick_trigger_tab,
            "dialogue": self.quick_dialogue_tab,
            "choice": self.quick_choice_tab,
            "result": self.quick_result_tab,
            "branch": self.quick_branch_tab,
            "flag": self.quick_flag_tab,
        }
        tab = type_to_tab.get(node_type, self.quick_dialogue_tab)
        self.quick_notebook.select(tab)

        self.quick_trigger_min_var.set(str(data.get("minDay", "")))
        self.quick_trigger_max_var.set("" if data.get("maxDay") is None else str(data.get("maxDay")))
        self.quick_trigger_prob_var.set(str(data.get("probability", 1.0)))

        self.quick_dialogue_text_var.set(str(data.get("text", "")))
        self.quick_dialogue_text_ko_var.set(str(data.get("textKo", "")))
        self.quick_dialogue_char_var.set("" if data.get("characterId") is None else str(data.get("characterId")))
        self.quick_dialogue_bg_var.set("" if data.get("backgroundId") is None else str(data.get("backgroundId")))

        self.quick_choice_prompt_var.set(str(data.get("text", "")))
        choice_lines = []
        for c in data.get("choices", []) if isinstance(data.get("choices"), list) else []:
            if not isinstance(c, dict):
                continue
            choice_lines.append(
                f"{str(c.get('text', '')).strip()}|{str(c.get('textKo', '')).strip()}|{str(c.get('requiredItem', '') or '').strip()}"
            )
        self.quick_choice_lines.delete("1.0", "end")
        self.quick_choice_lines.insert("1.0", "\n".join(choice_lines))

        self.quick_result_chance_var.set(str(data.get("successChance", 1.0)))
        on_success = data.get("onSuccess") if isinstance(data.get("onSuccess"), dict) else {}
        on_failure = data.get("onFailure") if isinstance(data.get("onFailure"), dict) else {}
        self.quick_result_success_var.set(str(on_success.get("text", "")))
        self.quick_result_failure_var.set(str(on_failure.get("text", "")))
        self.quick_result_flags.delete("1.0", "end")
        self.quick_result_flags.insert(
            "1.0",
            self._format_flag_assignments(on_success.get("flagChanges", [])),
        )

        conditions = data.get("conditions", []) if isinstance(data.get("conditions"), list) else []
        cond_lines = []
        for c in conditions:
            if not isinstance(c, dict):
                continue
            if str(c.get("type", "flag")).lower() != "flag":
                continue
            fid = str(c.get("flagId", "")).strip()
            if not fid:
                continue
            cond_lines.append(f"{fid}={str(bool(c.get('value', True))).lower()}")
        self.quick_branch_conditions.delete("1.0", "end")
        self.quick_branch_conditions.insert("1.0", "\n".join(cond_lines))

        self.quick_flag_node_id_var.set(str(data.get("flagId", "")))
        self.quick_flag_node_value_var.set(bool(data.get("value", True)))
        self.quick_flag_node_text_var.set(str(data.get("text", "")))
        self.quick_flag_node_text_ko_var.set(str(data.get("textKo", "")))

    def _apply_quick_edit(self):
        if not self.selected_node_id:
            messagebox.showwarning("No selection", "Select a node first.")
            return

        node = self._node_by_id(self.selected_node_id)
        if node is None:
            return

        data = node.get("data")
        if not isinstance(data, dict):
            data = {}
            node["data"] = data
        data["label"] = self.quick_label_var.get().strip()
        node_type = self._node_type(node)

        if node_type == "trigger":
            try:
                data["minDay"] = int(self.quick_trigger_min_var.get().strip() or 1)
            except ValueError:
                data["minDay"] = 1
            raw_max = self.quick_trigger_max_var.get().strip()
            if raw_max == "":
                data["maxDay"] = None
            else:
                try:
                    data["maxDay"] = int(raw_max)
                except ValueError:
                    data["maxDay"] = None
            try:
                prob = float(self.quick_trigger_prob_var.get().strip() or 1.0)
            except ValueError:
                prob = 1.0
            data["probability"] = max(0.0, min(1.0, prob))

        elif node_type == "dialogue":
            data["text"] = self.quick_dialogue_text_var.get().strip()
            data["textKo"] = self.quick_dialogue_text_ko_var.get().strip()
            char_id = self.quick_dialogue_char_var.get().strip()
            bg_id = self.quick_dialogue_bg_var.get().strip()
            data["characterId"] = char_id or None
            data["backgroundId"] = bg_id or None

        elif node_type == "choice":
            data["text"] = self.quick_choice_prompt_var.get().strip()
            rows = self.quick_choice_lines.get("1.0", "end").splitlines()
            parsed = []
            for row in rows:
                line = row.strip()
                if not line:
                    continue
                parts = [p.strip() for p in line.split("|")]
                text = parts[0] if len(parts) > 0 else ""
                text_ko = parts[1] if len(parts) > 1 else ""
                required = parts[2] if len(parts) > 2 else ""
                if not text and not text_ko:
                    continue
                parsed.append(
                    {
                        "id": f"{node.get('id')}-c{len(parsed) + 1}",
                        "text": text,
                        "textKo": text_ko,
                        "requiredItem": required or None,
                    }
                )
            data["choices"] = parsed

        elif node_type == "result":
            try:
                chance = float(self.quick_result_chance_var.get().strip() or 1.0)
            except ValueError:
                chance = 1.0
            data["successChance"] = max(0.0, min(1.0, chance))
            if not isinstance(data.get("onSuccess"), dict):
                data["onSuccess"] = {}
            if not isinstance(data.get("onFailure"), dict):
                data["onFailure"] = {}
            data["onSuccess"]["text"] = self.quick_result_success_var.get().strip()
            data["onFailure"]["text"] = self.quick_result_failure_var.get().strip()
            data["onSuccess"]["flagChanges"] = self._parse_flag_assignments(
                self.quick_result_flags.get("1.0", "end")
            )

        elif node_type == "branch":
            changes = self._parse_flag_assignments(self.quick_branch_conditions.get("1.0", "end"))
            data["conditions"] = [
                {
                    "id": f"{node.get('id')}-cond-{idx + 1}",
                    "type": "flag",
                    "flagId": c["flagId"],
                    "value": bool(c["value"]),
                }
                for idx, c in enumerate(changes)
            ]

        elif node_type == "flag":
            data["flagId"] = self.quick_flag_node_id_var.get().strip()
            data["value"] = bool(self.quick_flag_node_value_var.get())
            data["text"] = self.quick_flag_node_text_var.get().strip()
            data["textKo"] = self.quick_flag_node_text_ko_var.get().strip()

        self._refresh_project_views()
        self._set_selected_node(self.selected_node_id, update_list=True)

    def _build_playtest_tab(self):
        self.play_tab.columnconfigure(0, weight=1)
        self.play_tab.rowconfigure(1, weight=1)

        top = ttk.Frame(self.play_tab, padding=(10, 8))
        top.grid(row=0, column=0, sticky="ew")

        ttk.Button(top, text="Start Playtest", command=self._start_playtest).pack(side="left")
        ttk.Button(top, text="Next", command=self._on_next).pack(side="left", padx=6)
        ttk.Button(top, text="Reload Project", command=self._reload_project_for_playtest).pack(side="left", padx=6)

        self.language_var = tk.StringVar(value="ko")
        ttk.Label(top, text="Language").pack(side="left", padx=(20, 6))
        lang_combo = ttk.Combobox(top, textvariable=self.language_var, state="readonly", width=6)
        lang_combo["values"] = ("ko", "en")
        lang_combo.pack(side="left")
        lang_combo.bind("<<ComboboxSelected>>", lambda _e: self._rerender_current_node())

        self.play_status_var = tk.StringVar(value="Ready")
        ttk.Label(top, textvariable=self.play_status_var).pack(side="right")

        self.play_canvas = tk.Canvas(self.play_tab, bg="#101225", highlightthickness=0)
        self.play_canvas.grid(row=1, column=0, sticky="nsew")
        self.play_canvas.bind("<Configure>", self._on_canvas_resize)

        self.dialogue_overlay = tk.Frame(self.play_canvas, bg="#1C1E35", bd=0, highlightthickness=0)
        self.dialogue_bg_label = tk.Label(self.dialogue_overlay, bd=0, bg="#1C1E35")
        self.dialogue_bg_label.place(relx=0, rely=0, relwidth=1, relheight=1)

        self.speaker_label = tk.Label(
            self.dialogue_overlay,
            text="",
            bg="#1C1E35",
            fg="#ffd7ef",
            font=("Segoe UI", 12, "bold"),
            anchor="w",
        )
        self.speaker_label.pack(fill="x", padx=24, pady=(14, 4))

        self.dialogue_text_label = tk.Label(
            self.dialogue_overlay,
            text="",
            justify="left",
            bg="#1C1E35",
            fg="#ffffff",
            font=("Segoe UI", 12),
            wraplength=900,
            anchor="w",
        )
        self.dialogue_text_label.pack(fill="both", expand=True, padx=24)

        self.choice_frame = tk.Frame(self.dialogue_overlay, bg="#1C1E35", bd=0)
        self.choice_frame.pack(fill="x", padx=18, pady=(6, 0))

        self.next_button = tk.Button(
            self.dialogue_overlay,
            text="NEXT",
            command=self._on_next,
            bd=0,
            relief="flat",
            font=("Segoe UI", 10, "bold"),
            fg="#ffffff",
            bg="#1C1E35",
            activebackground="#1C1E35",
            highlightthickness=0,
            cursor="hand2",
            compound="center",
        )
        self.next_button.pack(anchor="e", padx=20, pady=(8, 16))

        self.dialogue_window = self.play_canvas.create_window(0, 0, window=self.dialogue_overlay, anchor="center")

    def _load_static_ui_images(self):
        self.ui_base_images.clear()
        self.ui_photo_cache.clear()
        for key, path in UI_ASSET_PATHS.items():
            if path.exists():
                try:
                    img = Image.open(path)
                    if key in {"home_bg", "story_bg"}:
                        img = img.convert("RGB")
                    else:
                        img = img.convert("RGBA")
                    self.ui_base_images[key] = img
                except Exception:
                    pass

    def _refresh_project_views(self):
        meta = self.project.get("meta", {})
        self.meta_title_var.set(meta.get("title", ""))
        self.meta_author_var.set(meta.get("author", ""))
        self.meta_version_var.set(meta.get("version", ""))

        self.node_ids_in_list.clear()
        self.node_listbox.delete(0, "end")
        for node in self._sorted_nodes(self.project.get("nodes", [])):
            node_id = str(node.get("id", ""))
            node_type = self._node_type(node)
            self.node_ids_in_list.append(node_id)
            self.node_listbox.insert("end", f"{node_id}  [{node_type}]")

        self.edge_target_combo["values"] = self.node_ids_in_list
        self._refresh_outgoing_edges()
        self._update_window_title()
        self._redraw_graph()
        if self.selected_node_id and self.selected_node_id in self.node_ids_in_list:
            self._set_selected_node(self.selected_node_id, update_list=True)
        elif self.selected_node_id and self.selected_node_id not in self.node_ids_in_list:
            self._set_selected_node(None, update_list=True)

    def _update_window_title(self):
        title = self.project.get("meta", {}).get("title") or "Untitled"
        suffix = f" - {self.project_path}" if self.project_path else ""
        self.title(f"Python Steam UGC Studio | {title}{suffix}")

    def _sorted_nodes(self, nodes):
        return sorted(nodes, key=lambda n: (self._node_sort_key(n), str(n.get("id", ""))))

    def _node_sort_key(self, node):
        node_type = self._node_type(node)
        if node_type == "trigger":
            data = node.get("data", {})
            return (0, int(data.get("minDay") or 0))
        ordering = {"dialogue": 1, "choice": 2, "branch": 3, "result": 4, "flag": 5}
        return (ordering.get(node_type, 9), 0)

    def _node_type(self, node):
        data = node.get("data")
        if isinstance(data, dict) and data.get("type"):
            return str(data.get("type")).lower()
        raw_type = str(node.get("type") or "")
        if raw_type.endswith("Node"):
            raw_type = raw_type[:-4]
        return raw_type.lower()

    def _on_meta_changed(self, *_args):
        self._sync_meta_to_project()
        self._update_window_title()

    def _sync_meta_to_project(self):
        if "meta" not in self.project or not isinstance(self.project["meta"], dict):
            self.project["meta"] = {}
        self.project["meta"]["title"] = self.meta_title_var.get().strip()
        self.project["meta"]["author"] = self.meta_author_var.get().strip()
        self.project["meta"]["version"] = self.meta_version_var.get().strip()

    def _new_project(self):
        if not self._confirm_discard_if_needed():
            return
        self.project = default_project()
        self.project_path = None
        self.project_dir = APP_DIR
        self.selected_node_id = None
        self.graph_connect_source_id = None
        self.node_json_editor.delete("1.0", "end")
        self._refresh_project_views()
        self._set_selected_node(None, update_list=True)
        self.play_status_var.set("New project loaded")

    def _confirm_discard_if_needed(self):
        return messagebox.askyesno("Confirm", "Discard current unsaved changes?")

    def _load_project_dialog(self):
        file_path = filedialog.askopenfilename(
            title="Open UGC Project",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialdir=str(self.project_dir),
        )
        if not file_path:
            return
        self._load_project(Path(file_path))

    def _load_project(self, path: Path):
        try:
            raw = path.read_text(encoding="utf-8")
            data = json.loads(raw)
            self.project = normalize_project(data)
            self.project_path = path
            self.project_dir = path.parent
            self.selected_node_id = None
            self.graph_connect_source_id = None
            self.node_json_editor.delete("1.0", "end")
            self._refresh_project_views()
            self._set_selected_node(None, update_list=True)
            self.play_status_var.set(f"Loaded: {path.name}")
        except Exception as exc:
            messagebox.showerror("Load failed", f"Could not load project.\n{exc}")

    def _save_project(self):
        self._sync_meta_to_project()
        if self.project_path is None:
            self._save_project_as()
            return
        self._save_to_path(self.project_path)

    def _save_project_as(self):
        self._sync_meta_to_project()
        default_name = self.project.get("meta", {}).get("title", "ugc_project").strip() or "ugc_project"
        safe = "".join(ch for ch in default_name if ch.isalnum() or ch in ("-", "_", " ")).strip().replace(" ", "_")
        path_str = filedialog.asksaveasfilename(
            title="Save UGC Project",
            defaultextension=".json",
            initialfile=f"{safe}.json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialdir=str(self.project_dir),
        )
        if not path_str:
            return
        path = Path(path_str)
        self.project_path = path
        self.project_dir = path.parent
        self._save_to_path(path)

    def _save_to_path(self, path: Path):
        try:
            path.write_text(json.dumps(self.project, ensure_ascii=False, indent=2), encoding="utf-8")
            self.play_status_var.set(f"Saved: {path.name}")
            self._update_window_title()
        except Exception as exc:
            messagebox.showerror("Save failed", f"Could not save project.\n{exc}")

    def _node_by_id(self, node_id: str):
        for node in self.project.get("nodes", []):
            if str(node.get("id")) == str(node_id):
                return node
        return None

    def _on_node_selected(self, _event=None):
        if self._suppress_node_select_event:
            return
        selected = self.node_listbox.curselection()
        if not selected:
            self._set_selected_node(None, update_list=False)
            return

        idx = selected[0]
        if idx < 0 or idx >= len(self.node_ids_in_list):
            return
        self._set_selected_node(self.node_ids_in_list[idx], update_list=False)

    def _format_node_json(self):
        raw = self.node_json_editor.get("1.0", "end").strip()
        if not raw:
            return
        try:
            parsed = json.loads(raw)
            self.node_json_editor.delete("1.0", "end")
            self.node_json_editor.insert("1.0", json.dumps(parsed, ensure_ascii=False, indent=2))
        except Exception as exc:
            messagebox.showerror("JSON error", f"Invalid JSON.\n{exc}")

    def _apply_node_json(self):
        if not self.selected_node_id:
            messagebox.showwarning("No selection", "Select a node first.")
            return
        raw = self.node_json_editor.get("1.0", "end").strip()
        if not raw:
            return
        try:
            node = json.loads(raw)
            node_id = str(node.get("id", "")).strip()
            if not node_id:
                raise ValueError("Node must contain an id.")

            nodes = self.project.get("nodes", [])
            replaced = False
            for i, old in enumerate(nodes):
                if str(old.get("id")) == str(self.selected_node_id):
                    nodes[i] = node
                    replaced = True
                    break
            if not replaced:
                nodes.append(node)

            if node_id != self.selected_node_id:
                for edge in self.project.get("edges", []):
                    if edge.get("source") == self.selected_node_id:
                        edge["source"] = node_id
                    if edge.get("target") == self.selected_node_id:
                        edge["target"] = node_id
                self.selected_node_id = node_id

            self._refresh_project_views()
            self._set_selected_node(self.selected_node_id, update_list=True)
        except Exception as exc:
            messagebox.showerror("Apply failed", f"Could not apply node JSON.\n{exc}")

    def _restore_selected_node_in_list(self):
        if not self.selected_node_id:
            return
        self._set_selected_node(self.selected_node_id, update_list=True)

    def _add_node(self, node_type: str | None = None, position: tuple[int, int] | None = None):
        if not node_type:
            node_type = simpledialog.askstring(
                "Node Type",
                "Enter node type: trigger / dialogue / choice / result / branch / flag",
                parent=self,
                initialvalue="dialogue",
            )
            if not node_type:
                return

        node_type = str(node_type).strip().lower()
        if node_type not in {"trigger", "dialogue", "choice", "result", "branch", "flag"}:
            messagebox.showerror("Invalid type", "Allowed: trigger, dialogue, choice, result, branch, flag")
            return

        default_id = f"{node_type}-{uuid.uuid4().hex[:6]}"
        if position is None:
            node_id = simpledialog.askstring("Node ID", "Enter node id", parent=self, initialvalue=default_id)
            if not node_id:
                return
            node_id = node_id.strip()
        else:
            node_id = default_id

        if self._node_by_id(node_id):
            if position is None:
                messagebox.showerror("Duplicate id", f"Node id '{node_id}' already exists.")
                return
            while self._node_by_id(node_id):
                node_id = f"{node_type}-{uuid.uuid4().hex[:6]}"

        node = default_node(node_type, node_id)
        if position is not None:
            node["position"] = {"x": int(position[0]), "y": int(position[1])}
        self.project.setdefault("nodes", []).append(node)
        self.selected_node_id = node_id
        self._refresh_project_views()
        self._set_selected_node(node_id, update_list=True)

    def _delete_selected_node(self):
        if not self.selected_node_id:
            return
        if not messagebox.askyesno("Delete node", f"Delete node '{self.selected_node_id}'?"):
            return

        node_id = self.selected_node_id
        self.project["nodes"] = [n for n in self.project.get("nodes", []) if str(n.get("id")) != node_id]
        self.project["edges"] = [
            e
            for e in self.project.get("edges", [])
            if str(e.get("source")) != node_id and str(e.get("target")) != node_id
        ]
        if self.graph_connect_source_id == node_id:
            self.graph_connect_source_id = None
        self.selected_node_id = None
        self.node_json_editor.delete("1.0", "end")
        self._refresh_project_views()
        self._set_selected_node(None, update_list=True)

    def _refresh_outgoing_edges(self):
        self.out_edge_ids_in_list.clear()
        self.edge_listbox.delete(0, "end")
        if not self.selected_node_id:
            return
        for edge in self._out_edges(self.selected_node_id):
            edge_id = str(edge.get("id"))
            handle = edge.get("sourceHandle") or "-"
            target = edge.get("target")
            self.out_edge_ids_in_list.append(edge_id)
            self.edge_listbox.insert("end", f"{edge_id} -> {target} (handle: {handle})")

    def _auto_source_handle(self, source_id: str):
        source = self._node_by_id(source_id)
        if source is None:
            return ""
        node_type = self._node_type(source)
        edges = self._out_edges(source_id)
        used = {str(e.get("sourceHandle") or "").strip() for e in edges}

        if node_type == "choice":
            idx = 0
            while f"choice-{idx}" in used:
                idx += 1
            return f"choice-{idx}"
        if node_type == "branch":
            if "true" not in used:
                return "true"
            if "false" not in used:
                return "false"
        return ""

    def _add_edge_core(self, source: str, target: str, handle: str = ""):
        source = str(source).strip()
        target = str(target).strip()
        if not source or not target or source == target:
            return False
        if self._node_by_id(source) is None or self._node_by_id(target) is None:
            return False

        for edge in self.project.get("edges", []):
            if (
                str(edge.get("source")) == source
                and str(edge.get("target")) == target
                and str(edge.get("sourceHandle") or "") == str(handle or "")
            ):
                return False

        edge = {
            "id": f"e-{source}-{target}-{uuid.uuid4().hex[:8]}",
            "source": source,
            "target": target,
            "type": "smoothstep",
        }
        if handle:
            edge["sourceHandle"] = handle
        self.project.setdefault("edges", []).append(edge)
        return True

    def _add_edge(self):
        if not self.selected_node_id:
            messagebox.showwarning("No source", "Select a source node first.")
            return
        target = self.edge_target_var.get().strip()
        if not target:
            messagebox.showwarning("No target", "Select a target node.")
            return
        if target == self.selected_node_id:
            messagebox.showwarning("Invalid target", "Source and target cannot be the same.")
            return

        handle = self.edge_handle_var.get().strip()
        if not handle:
            handle = self._auto_source_handle(self.selected_node_id)

        if not self._add_edge_core(self.selected_node_id, target, handle):
            messagebox.showwarning("Edge skipped", "Duplicate or invalid edge.")
            return

        self.edge_handle_var.set("")
        self._refresh_project_views()
        self._set_selected_node(self.selected_node_id, update_list=True)

    def _delete_selected_edge(self):
        selected = self.edge_listbox.curselection()
        if not selected:
            return
        idx = selected[0]
        if idx < 0 or idx >= len(self.out_edge_ids_in_list):
            return
        edge_id = self.out_edge_ids_in_list[idx]
        self.project["edges"] = [e for e in self.project.get("edges", []) if str(e.get("id")) != edge_id]
        self._refresh_project_views()
        self._set_selected_node(self.selected_node_id, update_list=True)

    def _reload_project_for_playtest(self):
        if self.project_path and self.project_path.exists():
            self._load_project(self.project_path)
        else:
            self.play_status_var.set("No project file on disk yet. Use Save first.")

    def _start_playtest(self):
        self._sync_meta_to_project()
        self.trigger_cursor = 0
        self.visited_triggers = set()
        self.current_node_id = None
        self.pending_result_next_id = None
        self.current_background_ref = "assets/ui/story_bg.jpg"
        self.play_mode = "idle"

        self.runtime_flags = {
            str(flag.get("id")): bool(flag.get("defaultValue"))
            for flag in self.project.get("flags", [])
            if isinstance(flag, dict) and flag.get("id")
        }

        self._clear_choice_buttons()
        self._set_dialogue("", "Playtest started", show_next=False)
        self._render_current_background()
        self._advance_to_next_trigger()

    def _sorted_triggers(self):
        triggers = [n for n in self.project.get("nodes", []) if self._node_type(n) == "trigger"]
        return sorted(
            triggers,
            key=lambda n: (
                int((n.get("data") or {}).get("minDay") or 0),
                str(n.get("id", "")),
            ),
        )

    def _out_edges(self, source_id: str):
        return sorted(
            [e for e in self.project.get("edges", []) if str(e.get("source")) == str(source_id)],
            key=lambda e: str(e.get("id", "")),
        )

    def _first_target_id(self, source_id: str, source_handle: str | None = None, fallback_index: int | None = None):
        edges = self._out_edges(source_id)
        if source_handle:
            exact = [e for e in edges if str(e.get("sourceHandle")) == str(source_handle)]
            if exact:
                return str(exact[0].get("target"))
        if fallback_index is not None and 0 <= fallback_index < len(edges):
            return str(edges[fallback_index].get("target"))
        if edges:
            return str(edges[0].get("target"))
        return None

    def _advance_to_next_trigger(self):
        triggers = self._sorted_triggers()
        while self.trigger_cursor < len(triggers):
            trigger = triggers[self.trigger_cursor]
            self.trigger_cursor += 1
            trigger_id = str(trigger.get("id"))
            if trigger_id in self.visited_triggers:
                continue
            probability = float((trigger.get("data") or {}).get("probability") or 1.0)
            probability = max(0.0, min(1.0, probability))
            if random.random() > probability:
                continue
            self.visited_triggers.add(trigger_id)
            next_id = self._first_target_id(trigger_id)
            if next_id:
                self._enter_node(next_id, depth=0)
                return

        self.play_mode = "finished"
        self.current_node_id = None
        self.pending_result_next_id = None
        self._clear_choice_buttons()
        self._set_dialogue("System", "No more events in this scenario.", show_next=False)
        self.play_status_var.set("Playtest complete")

    def _enter_node(self, node_id: str, depth: int = 0):
        if depth > 60:
            messagebox.showerror("Flow error", "Too many chained nodes. Check for loops.")
            return
        node = self._node_by_id(node_id)
        if node is None:
            self.play_status_var.set(f"Missing node: {node_id}")
            self._advance_to_next_trigger()
            return

        self.current_node_id = node_id
        node_type = self._node_type(node)
        data = node.get("data", {}) if isinstance(node.get("data"), dict) else {}

        if node_type == "trigger":
            next_id = self._first_target_id(node_id)
            if next_id:
                self._enter_node(next_id, depth + 1)
            else:
                self._advance_to_next_trigger()
            return

        if node_type == "branch":
            branch_result = self._evaluate_branch(data)
            handle = "true" if branch_result else "false"
            next_id = self._first_target_id(node_id, source_handle=handle)
            if not next_id:
                next_id = self._first_target_id(node_id)
            if next_id:
                self._enter_node(next_id, depth + 1)
            else:
                self._advance_to_next_trigger()
            return

        if node_type == "dialogue":
            speaker = self._resolve_speaker(data)
            text = self._pick_text(data, "text", "(empty dialogue)")
            self.current_background_ref = self._resolve_background_ref(data.get("backgroundId"))
            self._render_current_background()
            self.play_mode = "dialogue"
            self.pending_result_next_id = None
            self._clear_choice_buttons()
            self._set_dialogue(speaker, text, show_next=True)
            self.play_status_var.set(f"Node: {node_id} [dialogue]")
            return

        if node_type == "choice":
            choices = data.get("choices")
            if not isinstance(choices, list) or len(choices) == 0:
                next_id = self._first_target_id(node_id)
                if next_id:
                    self._enter_node(next_id, depth + 1)
                else:
                    self._advance_to_next_trigger()
                return

            prompt = self._pick_text(data, "text", data.get("label") or "Select a choice")
            self.play_mode = "choice"
            self.pending_result_next_id = None
            self._set_dialogue("Choice", prompt, show_next=False)
            self._render_choices(choices)
            self.play_status_var.set(f"Node: {node_id} [choice]")
            return

        if node_type == "result":
            chance = float(data.get("successChance") or 1.0)
            chance = max(0.0, min(1.0, chance))
            success = random.random() <= chance
            payload = data.get("onSuccess") if success else data.get("onFailure")
            payload = payload if isinstance(payload, dict) else {}
            self._apply_result_changes(payload)

            speaker = "Success" if success else "Failure"
            text = self._pick_text(payload, "text", "(empty result)")
            self.play_mode = "result"
            self.pending_result_next_id = self._first_target_id(node_id)
            self._clear_choice_buttons()
            self._set_dialogue(speaker, text, show_next=True)
            self.play_status_var.set(f"Node: {node_id} [result]")
            return

        if node_type == "flag":
            flag_id = str(data.get("flagId", "")).strip()
            value = bool(data.get("value", True))
            if flag_id:
                self.runtime_flags[flag_id] = value

            text = self._pick_text(data, "text", f"Flag {flag_id} set to {value}.")
            self.play_mode = "result"
            self.pending_result_next_id = self._first_target_id(node_id)
            self._clear_choice_buttons()
            self._set_dialogue("Flag", text, show_next=True)
            self.play_status_var.set(f"Node: {node_id} [flag]")
            return

        next_id = self._first_target_id(node_id)
        if next_id:
            self._enter_node(next_id, depth + 1)
        else:
            self._advance_to_next_trigger()

    def _evaluate_branch(self, data: dict):
        conditions = data.get("conditions")
        if not isinstance(conditions, list) or len(conditions) == 0:
            return True
        for cond in conditions:
            if not isinstance(cond, dict):
                continue
            ctype = str(cond.get("type", "flag")).lower()
            if ctype == "flag":
                flag_id = str(cond.get("flagId", "")).strip()
                if not flag_id:
                    continue
                expected = bool(cond.get("value", True))
                actual = bool(self.runtime_flags.get(flag_id, False))
                if actual != expected:
                    return False
        return True

    def _apply_result_changes(self, payload: dict):
        flag_changes = payload.get("flagChanges")
        if not isinstance(flag_changes, list):
            return
        for change in flag_changes:
            if not isinstance(change, dict):
                continue
            flag_id = str(change.get("flagId", "")).strip()
            if not flag_id:
                continue
            self.runtime_flags[flag_id] = bool(change.get("value", True))

    def _resolve_speaker(self, data: dict):
        speaker = str(data.get("speaker", "")).strip()
        if speaker:
            return speaker
        char_id = data.get("characterId")
        if char_id:
            for character in self.project.get("assets", {}).get("characters", []):
                if str(character.get("id")) == str(char_id):
                    name = str(character.get("name", "")).strip()
                    if name:
                        return name
        return "Narrator"

    def _pick_text(self, obj: dict, base_key: str, default: str):
        if not isinstance(obj, dict):
            return default
        if self.language_var.get() == "ko":
            ko = str(obj.get(f"{base_key}Ko", "")).strip()
            if ko:
                return ko
        en = str(obj.get(base_key, "")).strip()
        return en or default

    def _resolve_background_ref(self, background_id):
        if background_id:
            text = str(background_id).strip()
            if text:
                for bg in self.project.get("assets", {}).get("backgrounds", []):
                    if str(bg.get("id")) == text or str(bg.get("name")) == text:
                        image_ref = bg.get("image")
                        if image_ref:
                            return str(image_ref)
                if "/" in text or "\\" in text or "." in text:
                    return text
        return "assets/ui/story_bg.jpg"

    def _load_image_from_ref(self, ref):
        if not ref:
            return None
        ref = str(ref).strip()
        cache_key = f"{self.project_dir}|{ref}"
        if cache_key in self.image_source_cache:
            return self.image_source_cache[cache_key]

        image = None
        try:
            if ref.startswith("data:image"):
                comma = ref.find(",")
                if comma != -1:
                    encoded = ref[comma + 1 :]
                    raw = base64.b64decode(encoded)
                    image = Image.open(io.BytesIO(raw))
            else:
                p = Path(ref)
                candidates = []
                if p.is_absolute():
                    candidates.append(p)
                else:
                    candidates.append(self.project_dir / p)
                    candidates.append(APP_DIR / p)
                for cand in candidates:
                    if cand.exists():
                        image = Image.open(cand)
                        break
            if image is not None:
                if ref.lower().endswith(".jpg") or ref.lower().endswith(".jpeg"):
                    image = image.convert("RGB")
                else:
                    image = image.convert("RGBA")
        except Exception:
            image = None

        if image is not None:
            self.image_source_cache[cache_key] = image
        return image

    def _cover_resize(self, image: Image.Image, width: int, height: int):
        if width <= 0 or height <= 0:
            return image
        scale = max(width / image.width, height / image.height)
        resized = image.resize((max(1, int(image.width * scale)), max(1, int(image.height * scale))), Image.LANCZOS)
        left = max(0, (resized.width - width) // 2)
        top = max(0, (resized.height - height) // 2)
        return resized.crop((left, top, left + width, top + height))

    def _render_current_background(self):
        w = max(1, self.play_canvas.winfo_width())
        h = max(1, self.play_canvas.winfo_height())

        ref = self.current_background_ref or "assets/ui/story_bg.jpg"
        image = self._load_image_from_ref(ref)
        if image is None:
            image = self.ui_base_images.get("story_bg")
        if image is None:
            self.play_canvas.configure(bg="#101225")
            return

        if image.mode != "RGB":
            image = image.convert("RGB")
        draw_img = self._cover_resize(image, w, h)
        self.canvas_bg_photo = ImageTk.PhotoImage(draw_img)

        if self.canvas_bg_item is None:
            self.canvas_bg_item = self.play_canvas.create_image(0, 0, anchor="nw", image=self.canvas_bg_photo)
        else:
            self.play_canvas.itemconfigure(self.canvas_bg_item, image=self.canvas_bg_photo)
            self.play_canvas.coords(self.canvas_bg_item, 0, 0)
        self.play_canvas.tag_lower(self.canvas_bg_item)
        self.play_canvas.tag_raise(self.dialogue_window)

    def _get_ui_photo(self, key: str, width: int, height: int):
        width = max(1, int(width))
        height = max(1, int(height))
        cache_key = (key, width, height)
        if cache_key in self.ui_photo_cache:
            return self.ui_photo_cache[cache_key]

        image = self.ui_base_images.get(key)
        if image is None:
            return None
        resized = image.resize((width, height), Image.LANCZOS)
        photo = ImageTk.PhotoImage(resized)
        self.ui_photo_cache[cache_key] = photo
        return photo

    def _set_dialogue(self, speaker: str, text: str, show_next: bool):
        self.speaker_label.configure(text=speaker or "")
        self.dialogue_text_label.configure(text=text or "")
        if show_next:
            self.next_button.pack(anchor="e", padx=20, pady=(8, 16))
        else:
            self.next_button.pack_forget()

    def _clear_choice_buttons(self):
        for child in self.choice_frame.winfo_children():
            child.destroy()

    def _render_choices(self, choices):
        self._clear_choice_buttons()

        panel_w = max(600, min(1080, int(self.play_canvas.winfo_width() * 0.86)))
        btn_w = max(320, min(760, panel_w - 72))
        btn_h = 54
        self.choice_button_photo = self._get_ui_photo("reply_btn", btn_w, btn_h)

        for idx, choice in enumerate(choices):
            label = self._pick_text(choice if isinstance(choice, dict) else {}, "text", f"Choice {idx + 1}")
            btn = tk.Button(
                self.choice_frame,
                text=label,
                command=lambda i=idx: self._on_choice(i),
                bd=0,
                relief="flat",
                fg="#ffffff",
                bg="#1C1E35",
                activebackground="#1C1E35",
                font=("Segoe UI", 10, "bold"),
                compound="center",
                wraplength=btn_w - 40,
                justify="center",
                cursor="hand2",
                highlightthickness=0,
            )
            if self.choice_button_photo is not None:
                btn.configure(image=self.choice_button_photo)
            btn.pack(pady=3)

    def _on_choice(self, choice_index: int):
        if self.play_mode != "choice" or not self.current_node_id:
            return
        target_id = self._first_target_id(self.current_node_id, source_handle=f"choice-{choice_index}")
        if not target_id:
            target_id = self._first_target_id(self.current_node_id, fallback_index=choice_index)
        if target_id:
            self._enter_node(target_id, depth=0)
        else:
            self._advance_to_next_trigger()

    def _on_next(self):
        if self.play_mode == "idle":
            self._start_playtest()
            return

        if self.play_mode == "dialogue" and self.current_node_id:
            next_id = self._first_target_id(self.current_node_id)
            if next_id:
                self._enter_node(next_id, depth=0)
            else:
                self._advance_to_next_trigger()
            return

        if self.play_mode == "result":
            if self.pending_result_next_id:
                self._enter_node(self.pending_result_next_id, depth=0)
            else:
                self._advance_to_next_trigger()
            return

        if self.play_mode == "finished":
            self._start_playtest()

    def _rerender_current_node(self):
        if not self.current_node_id:
            return
        self._enter_node(self.current_node_id, depth=0)

    def _on_canvas_resize(self, _event=None):
        w = max(1, self.play_canvas.winfo_width())
        h = max(1, self.play_canvas.winfo_height())

        panel_w = max(700, min(1120, int(w * 0.9)))
        panel_h = max(220, min(280, int(h * 0.34)))

        x = w // 2
        y = h - (panel_h // 2) - 22
        self.play_canvas.coords(self.dialogue_window, x, y)
        self.play_canvas.itemconfigure(self.dialogue_window, width=panel_w, height=panel_h)

        self.dialogue_text_label.configure(wraplength=panel_w - 64)

        self.dialogue_panel_photo = self._get_ui_photo("dialogue_container", panel_w, panel_h)
        if self.dialogue_panel_photo is not None:
            self.dialogue_bg_label.configure(image=self.dialogue_panel_photo)
            self.dialogue_bg_label.lower()
        else:
            self.dialogue_bg_label.configure(image="", bg="#1C1E35")

        next_w = 176
        next_h = 48
        self.next_button_photo = self._get_ui_photo("next_btn", next_w, next_h)
        if self.next_button_photo is not None:
            self.next_button.configure(image=self.next_button_photo, text="")
        else:
            self.next_button.configure(image="", text="NEXT")

        self._render_current_background()


def main():
    app = UGCStudioApp()
    app.mainloop()


if __name__ == "__main__":
    main()
