// 분석 엔진 전역에서 공유하는 타입 정의. AI narrator는 이 요약 타입만 입력으로 받는다.

export type ColumnDataType =
  | "numeric"
  | "categorical"
  | "date"
  | "boolean"
  | "text";

export type DataDomain =
  | "생활인구"
  | "카드매출"
  | "교통"
  | "문화"
  | "관광"
  | "부동산"
  | "일반";

export interface ParsedDataset {
  columns: string[];
  rows: Record<string, string | number | null>[];
}

export interface ColumnSchema {
  name: string;
  type: ColumnDataType;
  sampleValues: (string | number | null)[];
}

export interface SchemaSummary {
  rowCount: number;
  columnCount: number;
  columns: ColumnSchema[];
}

export interface ColumnMissingInfo {
  name: string;
  missingCount: number;
  missingRate: number;
}

export interface MissingSummary {
  totalCells: number;
  totalMissingCells: number;
  overallMissingRate: number;
  duplicateRowCount: number;
  columns: ColumnMissingInfo[];
}

export interface NumericColumnStats {
  column: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
}

export interface CategoricalColumnStats {
  column: string;
  uniqueCount: number;
  topValues: { value: string; count: number; ratio: number }[];
}

export type ChartType = "bar" | "line" | "pie";

export interface ChartSpec {
  id: string;
  type: ChartType;
  title: string;
  xKey: string;
  yKey: string;
  data: Record<string, string | number>[];
}

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface MapSpec {
  detected: boolean;
  mode: "point" | "region" | "none";
  latColumn?: string;
  lngColumn?: string;
  regionColumn?: string;
  points: MapPoint[];
}

export interface AnalysisResult {
  qualityScore: number;
  schemaSummary: SchemaSummary;
  missingSummary: MissingSummary;
  numericSummary: NumericColumnStats[];
  categoricalSummary: CategoricalColumnStats[];
  chartSpecs: ChartSpec[];
  mapSpecs: MapSpec;
  insightSummary: string;
  generatedAt: string;
}

export interface ProjectMeta {
  id: string;
  title: string;
  description: string;
  dataType: DataDomain;
  analysisGoal: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFileMeta {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  rowCount: number;
  columnCount: number;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface ProjectRecord {
  meta: ProjectMeta;
  file: UploadedFileMeta;
  analysis: AnalysisResult;
  reports: ReportRecord[];
}

/** AI narrator에 전달되는 입력. 원본 행 데이터(rows)는 절대 포함하지 않는다. */
export interface NarratorInput {
  projectTitle: string;
  dataType: DataDomain;
  analysisGoal: string;
  qualityScore: number;
  schemaSummary: SchemaSummary;
  missingSummary: MissingSummary;
  numericSummary: NumericColumnStats[];
  categoricalSummary: CategoricalColumnStats[];
  ruleBasedInsight: string;
}
