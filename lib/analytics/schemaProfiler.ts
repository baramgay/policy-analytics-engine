// 컬럼별 데이터 타입(수치/범주/날짜/불리언/텍스트)을 표본 기반으로 추정한다
import type { ColumnDataType, ColumnSchema, ParsedDataset, SchemaSummary } from "@/types/analysis";

const DATE_PATTERN = /^\d{4}[-./]\d{1,2}([-./]\d{1,2})?$/;
const BOOLEAN_VALUES = new Set(["true", "false", "y", "n", "yes", "no", "예", "아니오"]);

function inferColumnType(values: (string | number | null)[]): ColumnDataType {
  const present = values.filter((v) => v !== null);
  if (present.length === 0) return "text";

  const numericCount = present.filter((v) => typeof v === "number").length;
  if (numericCount / present.length >= 0.8) return "numeric";

  const stringValues = present.map((v) => String(v).trim().toLowerCase());
  if (stringValues.every((v) => BOOLEAN_VALUES.has(v))) return "boolean";

  const dateCount = stringValues.filter((v) => DATE_PATTERN.test(v)).length;
  if (dateCount / stringValues.length >= 0.8) return "date";

  const uniqueRatio = new Set(stringValues).size / stringValues.length;
  if (uniqueRatio <= 0.5) return "categorical";

  return "text";
}

export function profileSchema(dataset: ParsedDataset): SchemaSummary {
  const columns: ColumnSchema[] = dataset.columns.map((name) => {
    const values = dataset.rows.map((row) => row[name]);
    return {
      name,
      type: inferColumnType(values),
      sampleValues: values.filter((v) => v !== null).slice(0, 5),
    };
  });

  return {
    rowCount: dataset.rows.length,
    columnCount: dataset.columns.length,
    columns,
  };
}
