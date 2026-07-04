// 로컬(데모) 모드에서 최초 1회 시드되는 프로젝트 목록. 규칙 기반 엔진을 실제 데모 데이터에 돌려 생성한다
import type { ProjectRecord } from "@/types/analysis";
import { runAnalysis } from "@/lib/analytics";
import { buildPopulationDataset } from "./populationData";
import { buildSalesDataset } from "./salesData";

const DEMO_CREATED_AT = "2026-06-20T00:00:00.000Z";

function buildDemoProject(config: {
  id: string;
  title: string;
  description: string;
  dataType: ProjectRecord["meta"]["dataType"];
  analysisGoal: string;
  fileName: string;
  dataset: ReturnType<typeof buildPopulationDataset>;
}): ProjectRecord {
  const analysis = runAnalysis(config.dataset);
  return {
    meta: {
      id: config.id,
      title: config.title,
      description: config.description,
      dataType: config.dataType,
      analysisGoal: config.analysisGoal,
      createdAt: DEMO_CREATED_AT,
      updatedAt: DEMO_CREATED_AT,
    },
    file: {
      id: `file_${config.id}`,
      projectId: config.id,
      fileName: config.fileName,
      fileType: "csv",
      rowCount: analysis.schemaSummary.rowCount,
      columnCount: analysis.schemaSummary.columnCount,
      createdAt: DEMO_CREATED_AT,
    },
    analysis,
    reports: [],
  };
}

export const demoProjects: ProjectRecord[] = [
  buildDemoProject({
    id: "demo-population",
    title: "경남 시군별 생활인구 변화 분석",
    description: "6개 시군의 월별·연령대별 생활인구 데이터를 활용한 정책 기초 분석",
    dataType: "생활인구",
    analysisGoal: "지역별 연령대 인구 분포 변화를 파악해 맞춤형 정책 수립에 활용",
    fileName: "gyeongnam_population_2026.csv",
    dataset: buildPopulationDataset(),
  }),
  buildDemoProject({
    id: "demo-sales",
    title: "경남 업종별 카드매출 동향 분석",
    description: "6개 시군의 월별·업종별 카드매출 데이터를 활용한 지역경제 분석",
    dataType: "카드매출",
    analysisGoal: "업종·지역별 매출 추이를 분석해 지역경제 활성화 방안 도출",
    fileName: "gyeongnam_card_sales_2026.csv",
    dataset: buildSalesDataset(),
  }),
];
