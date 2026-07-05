// 저장 백엔드(로컬/Supabase) 공용 입력 타입
import type { AnalysisResult, DataDomain, PreprocessingReport } from "@/types/analysis";

export interface CreateProjectInput {
  title: string;
  description: string;
  dataType: DataDomain;
  analysisGoal: string;
  fileName: string;
  fileType: string;
  file: File | null;
  analysis: AnalysisResult;
  preprocessing?: PreprocessingReport;
}
