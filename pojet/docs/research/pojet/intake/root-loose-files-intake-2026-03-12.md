# Root Loose Files Intake (2026-03-12)

## 대상
`pojet` 루트(하위 폴더 밖)에 있던 비실행 파일 일괄 점검/정리.

## 분류 결과
- 실행 유지:
  - `app.js`, `index.html`, `styles.css`, `README.md`
- 문서 자산:
  - 콘텐츠 생성 계획/가이드/예시 Markdown
- 데이터 자산:
  - 생성형 JSON(`generated_*`, `adult_narration_examples_*`)

## 재배치
- 문서:
  - `docs/content/plans/content-generation-detailed-plan.md`
  - `docs/content/guides/fantasy-adult-narrative-guideline.md`
  - `docs/content/guides/fantasy-adult-narrative-guideline-hardcore.md`
  - `docs/content/examples/adult-narration-examples-hardcore.md`
- 데이터:
  - `data/content/generated/raw-2026-03-12/*.json`
  - 파일명은 공백/괄호를 제거한 `kebab-case + vN` 규칙으로 정규화

## 적용 판단
- 직접 반영 가능: 문서 가이드라인(스타일/프롬프트) -> 적용 완료
- 직접 반영 보류: 생성형 JSON 원본
  - 이유: 런타임 스키마와 불일치(`type/options/outcome` 등), ID 충돌 가능성, 품질 편차
  - 조치: `generated/README.md` 규칙에 따라 변환 후 단계적 반영

## 이번 적용 항목
- `docs/content/content-style-guide.md`에 어휘 레이어/연출 우선순위/금지 규칙 보강
- `docs/content/pojet-content-generation-master-prompt.md`에 참조 문서 및 스키마 변환 규칙 반영
