# CHANGELOG

## v1.1.0 - 2026-03-14

### Added
- Mobile stack support (`vibe-starter init mobile ...`, `scripts/init.sh` mobile mode)
- `templates/mobile` guide template
- Research refresh controls: `--dry-run`, `--retry`, `--log-level`
- Test Flutter project build output (APK):
  - `starter/releases/v1.1-test/vibe-demo-app-release.apk`

### Improved
- Node CLI usage expanded to include `mobile` stack
- README updated for mobile stack and refresh controls

### Verification
- Flutter release APK build succeeded
- SHA256: `650610cac1a028ad08643d80e319ce2dd4937ac61cb5022e0dd3fc9a9096cb04`

## v1.0.0 - 2026-03-14

### Added
- Multilingual starter architecture (prompts/checklists/docs/scripts/locales/templates)
- Installable Node CLI (`vibe-starter`) with `init/verify/report`
- Stack templates: `webapp`, `bot`, `cli`
- Research pipeline:
  - `research-github.py`
  - `research-github-deep.py`
  - `triage-research-cards.py`
  - `apply-adoption-batch.py`
  - `refresh-research.sh`
- Quality framework:
  - release/security/agent-run/prompt/docs/research-ingestion checklists
  - PRD/ADR/Postmortem templates
- Prompt reference packs (foundation/context/system/domain/education)
- Role-based onboarding docs + FAQ + learning path

### Improved
- Locale fallback policy + glossary + translation style guide
- Continuous research-to-adoption loop with backlog tracking
- Extended release gate and reporting workflow

### Milestone
- Starter adoption backlog reached 100% (21/21)
