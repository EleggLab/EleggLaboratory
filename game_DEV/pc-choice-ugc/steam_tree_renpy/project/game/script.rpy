define config.name = "60sec Choice UGC"
define config.version = "0.1.0"
define config.window = "auto"

default persistent.ugc_lang = "ko"
default ugc_story_data = {}
default ugc_node_index = {}
default ugc_current_node_id = ""

init python:
    import json
    import renpy
    import renpy.store as store

    def ugc_load_tree(path="ugc/story_tree.json"):
        if not renpy.loadable(path):
            renpy.log("[ugc] tree not loadable: %s" % path)
            return None
        try:
            with renpy.file(path) as fp:
                raw = fp.read()
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8")
            return json.loads(raw)
        except Exception as exc:
            renpy.log("[ugc] tree load failed: %s" % exc)
            return None

    def ugc_localize(bundle):
        if isinstance(bundle, str):
            return bundle
        if not isinstance(bundle, dict):
            return ""

        lang = getattr(store.persistent, "ugc_lang", "ko")
        if lang == "en":
            return str(bundle.get("en") or bundle.get("ko") or "")
        return str(bundle.get("ko") or bundle.get("en") or "")

    def ugc_get_node(node_id=None):
        nid = node_id if node_id is not None else getattr(store, "ugc_current_node_id", "")
        return store.ugc_node_index.get(nid)


label start:
    if persistent.ugc_lang not in ("ko", "en"):
        $ persistent.ugc_lang = "ko"

    call screen ugc_language_select
    call ugc_story_play
    return


label ugc_story_play:
    $ _tree = ugc_load_tree("ugc/story_tree.json")
    if _tree is None:
        if persistent.ugc_lang == "ko":
            "스토리 파일(ugc/story_tree.json)을 찾지 못했습니다."
        else:
            "Story file not found: ugc/story_tree.json"
        return

    $ ugc_story_data = _tree
    $ ugc_node_index = {}

    python:
        for _node in ugc_story_data.get("nodes", []):
            if isinstance(_node, dict):
                _id = str(_node.get("id") or "").strip()
                if _id:
                    ugc_node_index[_id] = _node

    $ _start_id = str(ugc_story_data.get("meta", {}).get("start_node_id") or "")
    if _start_id == "" or _start_id not in ugc_node_index:
        if persistent.ugc_lang == "ko":
            "시작 노드가 잘못되었습니다."
        else:
            "Invalid start node."
        return

    $ _current_id = _start_id

    while _current_id:
        $ ugc_current_node_id = _current_id
        call screen ugc_node_screen
        $ _current_id = _return

    if persistent.ugc_lang == "ko":
        "이야기가 종료되었습니다."
    else:
        "Story complete."

    return
