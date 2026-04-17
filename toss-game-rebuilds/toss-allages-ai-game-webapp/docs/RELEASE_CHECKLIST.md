# Release Checklist

## Console
- [ ] Toss console app name is fixed and matches `TOSS_APP_NAME`
- [ ] Brand display name, primary color, and icon URL are final
- [ ] Customer service email, phone, and chat URL are final
- [ ] Console screenshots and thumbnails are replaced with final assets

## Technical
- [ ] `pnpm install`
- [ ] `pnpm typecheck`
- [ ] `pnpm validate:release-env`
- [ ] `pnpm policy:check`
- [ ] `pnpm build`
- [ ] `.ait` bundle generated successfully

## Product Policy (fixed)
- [ ] Free mode only (no ads / no IAP / no settlement)
- [ ] No backend mode only (no server API / no external DB dependency)

## Product QA
- [ ] First screen opens within 10 seconds
- [ ] Battle UI stays clear of the built-in Toss game navigation area
- [ ] Sound toggle works and background resume is stable
- [ ] Save data restores after app restart
- [ ] Interrupted run can be resumed or safely abandoned
- [ ] 무료/무백엔드 정책 준수 확인 (광고/결제/서버 API 없음)

## Launch
- [ ] QR test completed on a real Toss app build
- [ ] Game review material is ready
- [ ] Final store/support metadata is approved
