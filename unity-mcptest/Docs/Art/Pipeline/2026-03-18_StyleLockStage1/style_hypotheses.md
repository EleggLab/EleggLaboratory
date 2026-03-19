# StackCraft Style Lock Stage 1

## 목표
- 스타일 잠금 전용 1차 배치
- 3.5~4등신, 성인 캐릭터, 흰 배경, 전신, 발 보임, 깨끗한 굵은 선 고정
- 시트/실루엣/미완성/과한 배경 금지

## 입력 자료 요약
- PromptDerived: 27
- VisualOnly: 17
- Reject: 2

## Gemini 문서와 선택 이미지에서 유지한 규칙
- slight chibi
- smaller head
- full body / standing / feet visible
- white background #ffff
- adult game character
- bold clean lineart + flat cel shading

## 스타일 가족
### A. Pink/Black Gothic Cartoon
- Source mode: `PromptMining`
- Core style: pink and black gothic fashion, black mini dress, cropped cardigan, ribbon details, platform boots, confident cute smile
- Visual refs: score_* slight chibi prompts, pink goth examples from user references
- Seed anchor: `12003111`

### B. Monotone Maid Cartoon
- Source mode: `VisualOnly`
- Core style: clean maid outfit, monochrome palette, apron, ribbon, neat silhouette, polished anime mascot look
- Visual refs: hash reference maid images, blue maid example from first reference set
- Seed anchor: `12004222`

### C. White Dress Fantasy
- Source mode: `CreativeReconstruction`
- Core style: soft white fantasy dress, simple ribbon waist, elegant but readable silhouette, clean pastel accents
- Visual refs: white dress rabbit/fox references, simple fantasy heroine silhouettes
- Seed anchor: `12005333`

### D. Horned Succubus Fantasy
- Source mode: `PromptMining`
- Core style: horned fantasy girl design, mature cute face, dark fitted dress, light demon details, seductive but safe standing pose
- Visual refs: horned fantasy references, succubus/demon target race for StackCraft
- Seed anchor: `12006444`

### E. Soft Kemonomimi Fantasy
- Source mode: `VisualOnly`
- Core style: animal ears or tail, soft fantasy outfit, clean white background mascot presentation, adult coded proportions
- Visual refs: fox/cat/bunny selected images, visual-only hash references
- Seed anchor: `12007555`

### F. Adventurer Card Cartoon
- Source mode: `CreativeReconstruction`
- Core style: fantasy adventurer outfit, leather and cloth mix, small prop or belt details, readable game-card silhouette
- Visual refs: full body standing adventure prompt references, StackCraft role readability
- Seed anchor: `12008666`

## 공통 생성 설정
- Draft automation model: `nai-diffusion-3`
- Web refinement target: `V4.5 Full` -> drift 시 `V4.5 Curated`
- Sampler: `k_euler`
- Steps: `23`
- Scale: `5.5`
- CFG Rescale: `0.2`

## 참고
- 공식 웹 UI 단계에서는 `Vibe Transfer`와 `Character Reference`를 같은 패스에서 섞지 않는다.
- 자동 API 드래프트는 prompt-only 초안 생성용으로 사용한다.

## 배치 수
- 총 24 jobs
