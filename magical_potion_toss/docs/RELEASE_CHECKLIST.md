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
- [ ] `pnpm build`
- [ ] `.ait` bundle generated successfully

## Product QA
- [ ] First screen opens within 10 seconds
- [ ] Order selection, 재료 선택, 손질, 조제, 정산, 다음 날 진행이 모두 끊김 없이 이어진다
- [ ] Save data restores after app restart
- [ ] Interrupted run can be resumed or safely abandoned
- [ ] 3일차 / 6일차 임대료 정산과 7일차 감사 주문이 정상 작동한다

## Launch
- [ ] QR test completed on a real Toss app build
- [ ] Game review material is ready
- [ ] Final store/support metadata is approved
