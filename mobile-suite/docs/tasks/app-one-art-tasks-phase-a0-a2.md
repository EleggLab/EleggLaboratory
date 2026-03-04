# App One Art Tasks (A0~A2)

## TASK-001: Asset Registry CSV 생성
- 목표: 모든 아트 소스의 라이선스/상업이용 여부 추적
- 산출물: `mobile-suite/docs/asset_registry.csv`
- 필드: `asset_name,source_url,license,commercial_use,attribution_required,owner,notes,status`
- 완료조건:
  - 샘플 50개 이상 등록
  - 라이선스 미확정 항목 `status=blocked` 처리

## TASK-002: 라이선스 정책 문서화
- 목표: 혼합 라이선스 사용 시 사고 방지
- 산출물: `mobile-suite/docs/asset_license_policy.md`
- 포함:
  - 허용 라이선스 목록
  - 금지/주의 항목
  - 배포 전 점검 체크리스트

## TASK-003: UI 디자인 토큰 v1 확정
- 목표: 화면별 스타일 일관성 확보
- 산출물: `mobile-suite/docs/ui_tokens_v1.json`
- 범위:
  - color, typography, spacing, radius, elevation, motion duration/easing

## TASK-004: 화면별 와이어 규격 문서화
- 목표: 홈/시간/가챠/도감/대규모합성 레이아웃 고정
- 산출물: `mobile-suite/docs/ui_wire_spec_v1.md`
- 포함:
  - 각 페이지 핵심 컴포넌트
  - 상태별(활성/비활성/홀드중) 표현 규칙

## TASK-005: 원소 등급 비주얼 규칙
- 목표: 6등급(일반/희귀/특수/전설/최종/신화) 차별화
- 산출물: `mobile-suite/docs/rarity_visual_system_v1.md`
- 포함:
  - 컬러 매핑
  - 아우라/테두리/아이콘 배지
  - 작은 화면 가독성 규칙

## TASK-006: 원소 아이콘 슬롯 정의
- 목표: 아트 제작 파이프라인 표준화
- 산출물: `mobile-suite/docs/element_icon_slots_v1.csv`
- 필드:
  - `element_id,rarity,base_shape,overlay_fx,state_variant,priority`

## TASK-007: 합성 피드백 모션 스펙
- 목표: 2초 홀드 합성/합성불가/삭제 피드백 표준화
- 산출물: `mobile-suite/docs/interaction_motion_spec_v1.md`
- 포함:
  - hold ring spec
  - invalid X 표시 규칙
  - trash delete 애니메이션 규칙

## TASK-008: A0~A2 QA 체크리스트
- 목표: 디자인/아트 품질 게이트 정의
- 산출물: `mobile-suite/docs/art_qa_checklist_a0_a2.md`
- 체크 항목:
  - 시인성, 대비, 터치 타겟, 중첩 가독성, 프레임 드랍, 라이선스 누락

---

## 실행 순서 (권장)
1. TASK-001 → 002 (법적/운영 리스크 선제 차단)
2. TASK-003 → 004 (UI 고정)
3. TASK-005 → 006 (아트 생산 체계)
4. TASK-007 → 008 (인터랙션 품질)

## 이번 배치 목표
- A0~A2 착수 가능한 문서/스키마를 하루 내 완성
