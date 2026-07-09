// runAnalysis를 Web Worker에서 비동기 실행하는 래퍼: 브라우저에서는 워커로, Node(테스트) 등 Worker 미지원 환경에서는 동기 폴백
import type { AnalysisResult, ParsedDataset } from "@/types/analysis";
import { runAnalysis } from "./index";
import type { AnalysisWorkerResponse } from "./analysisWorker";

export async function runAnalysisAsync(dataset: ParsedDataset): Promise<AnalysisResult> {
  if (typeof Worker === "undefined") {
    // async 함수이므로 runAnalysis가 동기적으로 throw해도 자동으로 reject된 Promise로 전달된다
    return runAnalysis(dataset);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./analysisWorker.ts", import.meta.url));

    worker.onmessage = (event: MessageEvent<AnalysisWorkerResponse>) => {
      worker.terminate();
      const response = event.data;
      if (response.ok) {
        resolve(response.result);
      } else {
        reject(new Error(response.message));
      }
    };

    // 워커 실행 자체가 실패하면 기능 상실보다 UI 일시 정지가 낫다고 판단해 동기 폴백으로 처리한다
    // 단, 이 콜백은 Promise executor의 동기 스코프 밖(이벤트 핸들러)이라 runAnalysis가 던지는 예외가
    // 자동으로 reject되지 않으므로 명시적으로 잡아서 reject해야 한다
    worker.onerror = () => {
      worker.terminate();
      try {
        resolve(runAnalysis(dataset));
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };

    worker.postMessage(dataset);
  });
}
