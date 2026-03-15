init python:
    import renpy
    from renpy.display.layout import Frame, Solid

    def _ugc_button_background(path, fallback_color):
        if renpy.loadable(path):
            return Frame(path, 16, 16)
        return Solid(fallback_color)

    if renpy.loadable("gui/ugc/dialogue_container.png"):
        style.ugc_dialog_frame.background = Frame("gui/ugc/dialogue_container.png", 32, 32)
    else:
        style.ugc_dialog_frame.background = Solid("#e8ebf3")

    style.ugc_choice_button.background = _ugc_button_background("gui/ugc/choice_button.png", "#526ba5")
    style.ugc_choice_button.hover_background = _ugc_button_background("gui/ugc/choice_button_pressed.png", "#41588c")
    style.ugc_choice_button.insensitive_background = Solid("#7485ab")

    style.ugc_primary_button.background = _ugc_button_background("gui/ugc/primary_button.png", "#4f69a7")
    style.ugc_primary_button.hover_background = _ugc_button_background("gui/ugc/primary_button_pressed.png", "#42598f")
    style.ugc_primary_button.insensitive_background = Solid("#7485ab")


style ugc_dialog_frame is default:
    xpadding 28
    ypadding 24

style ugc_title is default:
    size 34
    color "#f5f7ff"
    outlines [(1, "#101318", 0, 0)]

style ugc_subtitle is default:
    size 22
    color "#d8deef"

style ugc_body is default:
    size 26
    color "#10131d"
    line_spacing 4

style ugc_choice_button is default:
    xpadding 18
    ypadding 14
    xminimum 420

style ugc_choice_button_text is default:
    size 24
    color "#ffffff"

style ugc_primary_button is default:
    xpadding 20
    ypadding 14
    xminimum 260

style ugc_primary_button_text is default:
    size 24
    color "#ffffff"


screen ugc_language_select():
    modal True
    zorder 200

    if renpy.loadable("gui/ugc/menu_background.png"):
        add "gui/ugc/menu_background.png"
    else:
        add Solid("#101624")

    frame:
        xalign 0.5
        yalign 0.55
        xmaximum 1100
        ypadding 30
        xpadding 30
        background Solid("#0d1321d9")

        vbox:
            spacing 18
            text "언어 선택 / Language" style "ugc_title" xalign 0.5
            text "기본 언어는 한국어입니다." style "ugc_subtitle" xalign 0.5

            hbox:
                spacing 14
                xalign 0.5

                textbutton "한국어 (기본)" style "ugc_primary_button" action [SetField(persistent, "ugc_lang", "ko"), Return("ko")]
                textbutton "English" style "ugc_primary_button" action [SetField(persistent, "ugc_lang", "en"), Return("en")]


screen ugc_node_screen():
    modal True
    zorder 120

    $ node = ugc_get_node()
    $ _choices = node.get("choices", []) if isinstance(node, dict) and isinstance(node.get("choices"), list) else []
    $ _next_id = node.get("next") if isinstance(node, dict) else None
    $ _speaker = str(node.get("speaker") or "") if isinstance(node, dict) else ""
    $ _text = ugc_localize(node.get("text") if isinstance(node, dict) else {})

    $ _bg_name = ""
    if isinstance(node, dict):
        $ _candidate = str(node.get("background") or "").strip()
        if _candidate:
            $ _bg_name = "ugc/backgrounds/" + _candidate

    if _bg_name != "" and renpy.loadable(_bg_name):
        add _bg_name
    elif renpy.loadable("gui/ugc/menu_background.png"):
        add "gui/ugc/menu_background.png"
    else:
        add Solid("#111827")

    if node is None:
        frame:
            xalign 0.5
            yalign 0.5
            background Solid("#10131dcf")
            xpadding 24
            ypadding 20
            text "Node not found." style "ugc_title"
        textbutton "Return" style "ugc_primary_button" action Return(None) xalign 0.5 yalign 0.9
    else:
        frame:
            style "ugc_dialog_frame"
            xalign 0.5
            yalign 0.86
            xmaximum 1560
            ymaximum 840

            vbox:
                spacing 16

                if _speaker:
                    text _speaker style "ugc_subtitle"

                text _text style "ugc_body"

                if len(_choices) > 0:
                    vbox:
                        spacing 10
                        for _choice in _choices:
                            $ _choice_label = ugc_localize(_choice.get("text", {}))
                            $ _choice_next = _choice.get("next") if isinstance(_choice, dict) else None
                            textbutton _choice_label style "ugc_choice_button" action Return(_choice_next)
                elif isinstance(_next_id, str) and _next_id.strip() != "":
                    if persistent.ugc_lang == "ko":
                        textbutton "다음" style "ugc_primary_button" action Return(_next_id)
                    else:
                        textbutton "Continue" style "ugc_primary_button" action Return(_next_id)
                else:
                    if persistent.ugc_lang == "ko":
                        textbutton "종료" style "ugc_primary_button" action Return(None)
                    else:
                        textbutton "Finish" style "ugc_primary_button" action Return(None)
