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

// 프로젝트 공유 링크: 토큰으로 로그인 없이 읽기 전용 접근을 허용한다
export interface ProjectShare {
  id: string;
  projectId: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
}

// 공유 화면에 달리는 댓글(로그인 불필요, 작성자명은 자유 입력)
export interface ProjectComment {
  id: string;
  projectId: string;
  authorName: string;
  content: string;
  createdAt: string;
}
