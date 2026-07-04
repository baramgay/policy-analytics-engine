# E2E 스모크 테스트 결과 (2026-07-04)

## 절차 및 결과

| 단계 | 절차 | 결과 | 비고 |
|---|---|---|---|
| 1 | https://policy-analytics-engine.vercel.app 에서 프로젝트 생성 | [ ] PASS / [ ] FAIL | |
| 2 | sample-data/budget-by-region.csv 업로드 → EDA/품질진단/차트 확인 | [ ] PASS / [ ] FAIL | |
| 3 | AI 설명 요청 → Qwen 실제 응답 확인 (폴백 문구 아님) | [ ] PASS / [ ] FAIL | |
| 4 | 리포트 생성 → 새로고침 후에도 Supabase에 유지되는지 확인 | [ ] PASS / [ ] FAIL | |

## 발견된 이슈
(있으면 기록, 없으면 "없음")
