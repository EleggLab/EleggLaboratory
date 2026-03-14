# Context Engineering Cards (Reference)

> 명령 강제가 아닌 참고 카드 모음

## Card A — Context Budget
"""
현재 작업에 필요한 문맥만 남기고 나머지는 제외해줘.
필수 문맥/선택 문맥/불필요 문맥으로 분류해줘.
"""

## Card B — Retrieval First
"""
코드 변경 전에 관련 파일/함수/테스트를 먼저 열거해줘.
각 항목이 왜 필요한지 한 줄 근거를 붙여줘.
"""

## Card C — Assumption Audit
"""
현재 계획에 포함된 가정을 목록화하고,
검증 가능한 가정과 미검증 가정을 분리해줘.
"""

## Card D — Failure Surface
"""
이번 변경에서 깨질 가능성이 높은 경계 5개를 먼저 제시하고,
각 경계에 대한 빠른 검증법을 작성해줘.
"""

## Card E — Minimal Diff Plan
"""
기능 목표를 만족하는 최소 변경 경로를 제안해줘.
큰 리팩터링은 별도 단계로 분리해줘.
"""
