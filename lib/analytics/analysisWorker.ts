// Web Worker 진입점: 메인 스레드로부터 정제된 데이터셋을 받아 runAnalysis를 실행하고 결과를 postMessage로 반환한다
import type { AnalysisResult, ParsedDataset } from "@/types/analysis";
import { runAnalysis } from "./index";

export type AnalysisWorkerResponse =
  | { ok: true; result: AnalysisResult }
  | { ok: false; message: string };

self.onmessage = (event: MessageEvent<ParsedDataset>) => {
  try {
    const result = runAnalysis(event.data);
    postMessage({ ok: true, result } satisfies AnalysisWorkerResponse);
  } catch (error) {
    postMessage({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    } satisfies AnalysisWorkerResponse);
  }
};
