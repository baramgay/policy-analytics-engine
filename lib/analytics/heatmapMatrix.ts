// 상관 쌍 목록을 히트맵용 정방 행렬로 변환한다 (계산 없이 재구성만 수행)
import type { CorrelationPair } from "@/types/analysis";

export interface HeatmapCell {
  coefficient: number;
  significant: boolean;
}

export interface CorrelationMatrix {
  columns: string[];
  cells: Record<string, Record<string, HeatmapCell | null>>;
}

const MIN_COLUMNS_FOR_HEATMAP = 3;

export function buildCorrelationMatrix(pairs: CorrelationPair[]): CorrelationMatrix {
  const columnSet = new Set<string>();
  for (const pair of pairs) {
    columnSet.add(pair.columnA);
    columnSet.add(pair.columnB);
  }
  const columns = Array.from(columnSet);

  if (columns.length < MIN_COLUMNS_FOR_HEATMAP) {
    return { columns: [], cells: {} };
  }

  const cells: Record<string, Record<string, HeatmapCell | null>> = {};
  for (const rowColumn of columns) {
    cells[rowColumn] = {};
    for (const colColumn of columns) {
      cells[rowColumn][colColumn] =
        rowColumn === colColumn ? { coefficient: 1, significant: false } : null;
    }
  }

  for (const pair of pairs) {
    const cell: HeatmapCell = { coefficient: pair.coefficient, significant: pair.significant };
    cells[pair.columnA][pair.columnB] = cell;
    cells[pair.columnB][pair.columnA] = cell;
  }

  return { columns, cells };
}
