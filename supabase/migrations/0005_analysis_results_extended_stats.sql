-- Phase 1-5에서 AnalysisResult에 추가된 확장 통계 필드(상관/범주형상관/VIF/이상치/그룹비교/시계열)가
-- analysis_results 테이블에 컬럼으로 반영되지 않아 저장 시 유실되던 문제 수정
alter table analysis_results
  add column if not exists correlation_summary jsonb,
  add column if not exists categorical_correlation_summary jsonb,
  add column if not exists vif_summary jsonb,
  add column if not exists outlier_summary jsonb,
  add column if not exists group_comparison_summary jsonb,
  add column if not exists time_series_summary jsonb;
