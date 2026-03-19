from fastapi import APIRouter

router = APIRouter(prefix="/api")

CHECKLIST = {
    "paper_only": True,
    "unified_order_schema": True,
    "risk_engine_guard": True,
    "audit_log": True,
    "session_calendar": True,
    "ws_streams": True,
    "jwt_auth": True,
    "corporate_action_apply": True,
    "core_tests_added": True,
    "e2e_full_suite_green": False,
    "ops_runbook_complete": False,
}


@router.get("/readiness")
def readiness():
    done = sum(1 for v in CHECKLIST.values() if v)
    total = len(CHECKLIST)
    return {
        "checklist": CHECKLIST,
        "done": done,
        "total": total,
        "percent": round(done / total * 100, 1),
        "production_ready": bool(done == total),
    }
