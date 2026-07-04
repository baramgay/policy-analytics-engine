// 컬럼명 패턴으로 위경도/지역 컬럼을 탐지해 지도 표시 가능 여부와 좌표 포인트를 산출한다
import type { MapSpec, ParsedDataset, SchemaSummary } from "@/types/analysis";

const LAT_PATTERN = /(위도|lat|latitude)/i;
const LNG_PATTERN = /(경도|lng|lon|longitude)/i;
const REGION_PATTERN = /(시군구|지역|시도|구|군|읍면동|region)/i;
const LABEL_PATTERN = /(이름|명칭|주소|name|label|장소)/i;

export function detectMap(dataset: ParsedDataset, schema: SchemaSummary): MapSpec {
  const numericColumns = schema.columns.filter((c) => c.type === "numeric");
  const latColumn = numericColumns.find((c) => LAT_PATTERN.test(c.name));
  const lngColumn = numericColumns.find((c) => LNG_PATTERN.test(c.name));

  if (latColumn && lngColumn) {
    const labelColumn = schema.columns.find((c) => LABEL_PATTERN.test(c.name));
    const points = dataset.rows
      .map((row) => {
        const lat = row[latColumn.name];
        const lng = row[lngColumn.name];
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        return {
          lat,
          lng,
          label: labelColumn ? String(row[labelColumn.name] ?? "") : "",
        };
      })
      .filter((p): p is { lat: number; lng: number; label: string } => p !== null)
      .slice(0, 500);

    return {
      detected: true,
      mode: "point",
      latColumn: latColumn.name,
      lngColumn: lngColumn.name,
      points,
    };
  }

  const regionColumn = schema.columns.find(
    (c) => c.type === "categorical" && REGION_PATTERN.test(c.name)
  );
  if (regionColumn) {
    return {
      detected: true,
      mode: "region",
      regionColumn: regionColumn.name,
      points: [],
    };
  }

  return { detected: false, mode: "none", points: [] };
}
