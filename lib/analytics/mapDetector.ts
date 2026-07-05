// 컬럼명 패턴으로 위경도/지역 컬럼을 탐지해 지도 표시 가능 여부와 좌표 포인트를 산출한다
import type { MapCluster, MapPoint, MapSpec, ParsedDataset, SchemaSummary } from "@/types/analysis";

const LAT_PATTERN = /(위도|lat|latitude)/i;
const LNG_PATTERN = /(경도|lng|lon|longitude)/i;
const REGION_PATTERN = /(시군구|지역|시도|구|군|읍면동|region)/i;
const LABEL_PATTERN = /(이름|명칭|주소|name|label|장소)/i;

// 위경도 약 0.05도(5km 내외) 격자로 근접 포인트를 묶는다. 카카오맵 SDK 클러스터러가 없을 때의 기본 클러스터 정보로 쓰인다.
const CLUSTER_GRID_SIZE = 0.05;

export function clusterPoints(points: MapPoint[], gridSize = CLUSTER_GRID_SIZE): MapCluster[] {
  const grid = new Map<string, { latSum: number; lngSum: number; count: number }>();

  for (const point of points) {
    const key = `${Math.round(point.lat / gridSize)}:${Math.round(point.lng / gridSize)}`;
    const cell = grid.get(key) ?? { latSum: 0, lngSum: 0, count: 0 };
    cell.latSum += point.lat;
    cell.lngSum += point.lng;
    cell.count += 1;
    grid.set(key, cell);
  }

  return Array.from(grid.values()).map((cell) => ({
    lat: Number((cell.latSum / cell.count).toFixed(6)),
    lng: Number((cell.lngSum / cell.count).toFixed(6)),
    count: cell.count,
  }));
}

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
      clusters: clusterPoints(points),
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
