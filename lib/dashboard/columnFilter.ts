// 분석 결과 탭의 컬럼 개요·타입별 필터 로직. schemaSummary/missingSummary를 조합해 표시용 행을 만들고
// 선택된 컬럼 유형으로 걸러내기만 한다 (새로운 통계 계산은 하지 않는다)
import type { ColumnDataType, MissingSummary, SchemaSummary } from "@/types/analysis";

export type ColumnTypeFilter = "all" | ColumnDataType;

export interface ColumnOverviewRow {
  name: string;
  type: ColumnDataType;
  missingRate: number;
  sampleValues: string;
}

const TYPE_ORDER: ColumnDataType[] = ["numeric", "categorical", "date", "boolean", "text"];

export function buildColumnOverview(schema: SchemaSummary, missing: MissingSummary): ColumnOverviewRow[] {
  const missingByName = new Map(missing.columns.map((c) => [c.name, c.missingRate]));
  return schema.columns.map((column) => ({
    name: column.name,
    type: column.type,
    missingRate: missingByName.get(column.name) ?? 0,
    sampleValues: column.sampleValues
      .slice(0, 3)
      .map((value) => (value === null ? "-" : String(value)))
      .join(", "),
  }));
}

export function filterColumnsByType(
  rows: ColumnOverviewRow[],
  filter: ColumnTypeFilter
): ColumnOverviewRow[] {
  if (filter === "all") return rows;
  return rows.filter((row) => row.type === filter);
}

/** 실제로 존재하는 컬럼 유형만, 고정된 표시 순서로 반환한다 (필터 컨트롤 옵션 구성용) */
export function availableColumnTypes(rows: ColumnOverviewRow[]): ColumnDataType[] {
  const present = new Set(rows.map((row) => row.type));
  return TYPE_ORDER.filter((type) => present.has(type));
}
