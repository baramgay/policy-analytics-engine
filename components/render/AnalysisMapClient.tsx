"use client";

// AnalysisMap은 브라우저 전용 API(MapLibre GL)를 쓰므로 서버 렌더링을 끄고 동적 로드한다
import dynamic from "next/dynamic";

export const AnalysisMapClient = dynamic(
  () => import("./AnalysisMap").then((mod) => mod.AnalysisMap),
  { ssr: false },
);
