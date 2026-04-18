# Competitors (Korean Fortune/Saju Apps)

## Date
- 2026-02-15

## Ranking Metric
- **Google Play "Downloads"** label (install range) on each listing page.
- Note: This is **not** a perfect “popularity” metric (iOS users, web traffic, marketing spikes), but it is a stable, easy-to-verify public proxy.

## Top Apps (by Google Play downloads)
1. 점신 (운세/사주/타로): **5M+**  
   - https://play.google.com/store/apps/details?id=com.techlabs.JPUN
2. 포스텔러 (운세/사주/타로/궁합): **1M+**  
   - https://play.google.com/store/apps/details?id=com.fatekorea.forcetrller
3. 운세비결 (사주/궁합/토정비결): **1M+**  
   - https://play.google.com/store/apps/details?id=com.interest.apps.fortunetelling
4. 원광만세력: **500K+**  
   - https://play.google.com/store/apps/details?id=com.wonkwang.wonkwangmanse
5. 운세의 신 (신년운세/사주/타로): **100K+**  
   - https://play.google.com/store/apps/details?id=com.sportschosun.yu
6. 천명 (사주/운세/타로): **100K+**  
   - https://play.google.com/store/apps/details?id=com.cheonmyung
7. 샐리 (사주/별자리/타로): **100K+**  
   - https://play.google.com/store/apps/details?id=com.un7soft.sally

## Common UX Patterns Observed
- **Home-first** navigation (quick jump to 4~6 core features)
- Bottom tabs with **persistent category access**
- **Daily** fixed content pages (오늘의 운세, 별자리, 띠 운세)
- **Tarot** with “shuffle -> pick -> reveal -> long explanation”
- Saju: **명조표(표 형식)** + **긴 자연어 풀이** + **분야별 Q&A**

## Major Web Portals (Fortune Sections)
- Naver 운세: https://fortune.naver.com/
- Daum 운세: https://fortune.daum.net/
- Nate 운세: https://fortune.nate.com/

## How This Repo Reflects It
- `apps/mobile` now uses a game-like **5-tab bottom bar** with **center Home**.
- Tarot is implemented as **type buttons -> auto shuffle -> pick -> result**, with **1/day caching** for "오늘의 운세".
- Saju output is **report-first**: 결과표 + 자연어 풀이 + Q&A + 연/월 선택.
