"use client";

// 업로드 화면: 파일을 브라우저에서 파싱하고 규칙 기반 분석 엔진(runAnalysis)을 돌린 뒤 프로젝트로 저장한다
// Supabase PostgrestError는 일반 객체({message,details,hint,code})라 instanceof Error가 false다.
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "분석 중 오류가 발생했습니다";
}
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Heading,
  Text,
  FormLayout,
  FileInput,
  TextInput,
  TextArea,
  Selector,
  Button,
  ProgressBar,
  Banner,
  Section,
} from "@astryxdesign/core";
import type { DataDomain } from "@/types/analysis";
import { parseUploadedFile, runAnalysis } from "@/lib/analytics";
import { createProject } from "@/lib/data/store";

const DATA_TYPE_OPTIONS: DataDomain[] = ["생활인구", "카드매출", "교통", "문화", "관광", "부동산", "일반"];

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState<DataDomain | null>(null);
  const [analysisGoal, setAnalysisGoal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReady = title.trim().length > 0 && dataType !== null && analysisGoal.trim().length > 0 && file !== null;

  async function handleSubmit() {
    if (!file || !dataType) return;
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const dataset = await parseUploadedFile(file);
      const analysis = runAnalysis(dataset);
      const project = await createProject({
        title,
        description,
        dataType,
        analysisGoal,
        fileName: file.name,
        fileType: file.name.split(".").pop() ?? "",
        file,
        analysis,
      });
      router.push(`/projects/${project.meta.id}`);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Section padding={6}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
        <div>
          <Heading level={1}>새 프로젝트 업로드</Heading>
          <Text type="supporting" color="secondary">
            데이터 파일을 업로드하면 규칙 기반 분석 엔진이 즉시 품질 검사·통계·차트를 계산합니다
          </Text>
        </div>

        {errorMessage ? (
          <Banner status="error" title="분석 실패" description={errorMessage} />
        ) : null}

        <Card>
          <FormLayout>
            <TextInput label="프로젝트 제목" value={title} onChange={setTitle} placeholder="예: 경남 시군별 생활인구 변화 분석" />
            <TextArea label="프로젝트 설명" value={description} onChange={setDescription} rows={2} isOptional />
            <Selector
              label="데이터 유형"
              options={DATA_TYPE_OPTIONS}
              value={dataType}
              onChange={(value) => setDataType(value as DataDomain | null)}
              hasClear
              placeholder="데이터 유형을 선택하세요"
            />
            <TextArea
              label="분석 목적"
              value={analysisGoal}
              onChange={setAnalysisGoal}
              rows={3}
              placeholder="예: 지역별 연령대 인구 분포 변화를 파악해 맞춤형 정책 수립에 활용"
            />
            <FileInput
              label="데이터 파일"
              value={file}
              onChange={(value) => setFile(Array.isArray(value) ? value[0] ?? null : value)}
              accept=".csv,.xlsx,.xls"
              mode="dropzone"
              description="CSV 또는 엑셀(XLSX) 파일을 업로드하세요"
            />
            {isProcessing ? <ProgressBar isIndeterminate label="분석 엔진 실행 중" /> : null}
            <Button
              label="분석 시작"
              variant="primary"
              isDisabled={!isReady || isProcessing}
              isLoading={isProcessing}
              clickAction={handleSubmit}
            />
          </FormLayout>
        </Card>
      </div>
    </Section>
  );
}
