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

export type ChartType = "bar" | "line" | "pie" | "grouped-bar";

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

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
}

export interface MapSpec {
  detected: boolean;
  mode: "point" | "region" | "none";
  latColumn?: string;
  lngColumn?: string;
  regionColumn?: string;
  points: MapPoint[];
  /** 근접 포인트를 격자 단위로 묶은 클러스터 (지도 렌더러가 줌 레벨과 무관하게 참고할 수 있는 기본 클러스터) */
  clusters?: MapCluster[];
}

export interface CorrelationPair {
  columnA: string;
  columnB: string;
  coefficient: number;
  strength: "매우 강함" | "강함" | "보통" | "약함" | "거의 없음";
  pValue: number;
  significant: boolean;
  interpretation: string;
}

export interface OutlierColumnInfo {
  column: string;
  lowerBound: number;
  upperBound: number;
  outlierCount: number;
  outlierIndices: number[];
}

export interface EffectSize {
  type: "cohen_d" | "eta_squared";
  value: number;
  magnitude: "작음" | "중간" | "큼";
}

export interface GroupComparisonResult {
  groupColumn: string;
  numericColumn: string;
  method: "welch-t" | "anova-f";
  groupCount: number;
  statistic: number;
  pValue: number;
  significant: boolean;
  groupMeans: { group: string; mean: number; count: number }[];
  effectSize: EffectSize | null;
  interpretation: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  movingAverage: number | null;
}

export interface TimeSeriesAnalysis {
  dateColumn: string;
  numericColumn: string;
  trendSlope: number;
  trendIntercept: number;
  trendDirection: "증가" | "감소" | "보합";
  points: TimeSeriesPoint[];
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
  correlationSummary?: CorrelationPair[];
  outlierSummary?: OutlierColumnInfo[];
  groupComparisonSummary?: GroupComparisonResult[];
  timeSeriesSummary?: TimeSeriesAnalysis[];
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

export type MissingStrategy = "keep" | "drop-row" | "fill";
export type DuplicateStrategy = "keep" | "drop";
export type OutlierStrategy = "keep" | "cap-iqr";

export interface PreprocessingOptions {
  missingStrategy: MissingStrategy;
  duplicateStrategy: DuplicateStrategy;
  outlierStrategy: OutlierStrategy;
}

export interface PreprocessingSuggestion {
  missingRate: number;
  duplicateRowCount: number;
  outlierColumns: { column: string; outlierCount: number }[];
  recommended: PreprocessingOptions;
}

export interface PreprocessingReport {
  options: PreprocessingOptions;
  droppedRowCount: number;
  filledCellCount: { column: string; count: number; fillValue: string | number }[];
  cappedOutlierCount: { column: string; count: number }[];
  qualityScoreBefore: number;
  qualityScoreAfter: number;
}

export interface ProjectRecord {
  meta: ProjectMeta;
  file: UploadedFileMeta;
  analysis: AnalysisResult;
  reports: ReportRecord[];
  preprocessing?: PreprocessingReport;
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
