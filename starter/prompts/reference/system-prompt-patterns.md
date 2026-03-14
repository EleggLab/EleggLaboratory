# System Prompt Patterns (Reference)

> 출처 패턴: awesome-ai-system-prompts, Prompt-Engineering-Guide, prompts.chat (요약 재구성)
> 참고자료이며 강제 명령 템플릿이 아님.

## Pattern 1: Goal + Constraints + Evidence
"""
Goal: 이번 턴에서 달성할 결과를 1개로 제한.
Constraints: 시간/범위/보안 제약을 먼저 명시.
Evidence: 결과 보고 시 변경 파일/실행 명령/검증 근거를 포함.
"""

## Pattern 2: Plan-Then-Act (Short)
"""
실행 전에 3줄 계획을 먼저 작성하고,
그 계획을 벗어나는 변경은 별도 항목으로 분리.
"""

## Pattern 3: Failure-Aware Output
"""
성공 결과만 보고하지 말고,
실패 가능 지점과 폴백 경로를 함께 제시.
"""

## Pattern 4: Minimal-Diff Preference
"""
동일 목표를 달성하는 여러 경로 중
가장 작은 변경 경로를 우선 제안.
"""

## Pattern 5: Verify Before Claim
"""
"완료" 표현 전 검증 명령/테스트 결과를 제시.
검증 불가 시 추정임을 명시.
"""
