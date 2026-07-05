"use client";

// 업로드 화면: 1) 파일/샘플 선택 → 2) 전처리 검토(진단+선택+미리보기) → 3) runAnalysis 실행 후 프로젝트 저장
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
import { useMemo, useState } from "react";
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
  RadioList,
  RadioListItem,
  ClickableCard,
  MetadataList,
  MetadataListItem,
} from "@astryxdesign/core";
import type { DataDomain, ParsedDataset, PreprocessingOptions, PreprocessingSuggestion } from "@/types/analysis";
import { parseCsvText, parseUploadedFile, runAnalysis } from "@/lib/analytics";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import { analyzePreprocessing, applyPreprocessing } from "@/lib/analytics/preprocessor";
import { createProject } from "@/lib/data/store";

const DATA_TYPE_OPTIONS: DataDomain[] = ["생활인구", "카드매출", "교통", "문화", "관광", "부동산", "일반"];

const SAMPLE_DATASETS = [
  {
    fileName: "monthly-population.csv",
    title: "월별 인구 추이",
    description: "시군별 월간 인구수 변화 데이터",
    dataType: "생활인구" as DataDomain,
    analysisGoal: "시군별 월간 인구 변화 추이를 파악해 인구정책 수립에 활용",
  },
  {
    fileName: "budget-by-region.csv",
    title: "사업예산 집행현황",
    description: "시군별 사업 예산 집행액과 집행률 (결측치 포함)",
    dataType: "일반" as DataDomain,
    analysisGoal: "시군별 예산 집행률 편차를 파악해 재정 운용에 참고",
  },
  {
    fileName: "facility-locations.csv",
    title: "공공시설 위치",
    description: "시군별 공공시설 위경도 좌표와 이용자수 (지도 시각화 데모)",
    dataType: "일반" as DataDomain,
    analysisGoal: "공공시설의 지역별 분포와 이용 현황을 지도로 파악",
  },
  {
    fileName: "survey-responses-messy.csv",
    title: "설문 응답",
    description: "결측치·중복 응답이 섞인 만족도 설문 원자료 (전처리 데모)",
    dataType: "일반" as DataDomain,
    analysisGoal: "결측·중복을 정제한 뒤 응답자 만족도 분포를 파악",
  },
];

type Step = "form" | "preprocess";

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState<DataDomain | null>(null);
  const [analysisGoal, setAnalysisGoal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sampleFileName, setSampleFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [suggestion, setSuggestion] = useState<PreprocessingSuggestion | null>(null);
  const [options, setOptions] = useState<PreprocessingOptions | null>(null);

  const isReady = title.trim().length > 0 && dataType !== null && analysisGoal.trim().length > 0 && (file !== null || sampleFileName !== null);

  function applySample(sample: (typeof SAMPLE_DATASETS)[number]) {
    setTitle(sample.title);
    setDescription(sample.description);
    setDataType(sample.dataType);
    setAnalysisGoal(sample.analysisGoal);
    setFile(null);
    setSampleFileName(sample.fileName);
  }

  async function loadDataset(): Promise<ParsedDataset> {
    if (sampleFileName) {
      const response = await fetch(`/sample-data/${sampleFileName}`);
      const text = await response.text();
      return parseCsvText(text);
    }
    if (file) return parseUploadedFile(file);
    throw new Error("파일 또는 샘플 데이터를 선택하세요");
  }

  async function handleReview() {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const parsed = await loadDataset();
      const schema = profileSchema(parsed);
      const suggested = analyzePreprocessing(parsed, schema);
      setDataset(parsed);
      setSuggestion(suggested);
      setOptions(suggested.recommended);
      setStep("preprocess");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  }

  const preview = useMemo(() => {
    if (!dataset || !options) return null;
    const schema = profileSchema(dataset);
    return applyPreprocessing(dataset, schema, options);
  }, [dataset, options]);

  async function handleAnalyze() {
    if (!dataset || !options || !dataType) return;
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const schema = profileSchema(dataset);
      const { dataset: cleaned, report } = applyPreprocessing(dataset, schema, options);
      const analysis = runAnalysis(cleaned);
      const project = await createProject({
        title,
        description,
        dataType,
        analysisGoal,
        fileName: sampleFileName ?? file?.name ?? "",
        fileType: (sampleFileName ?? file?.name ?? "").split(".").pop() ?? "",
        file,
        analysis,
        preprocessing: report,
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

        {step === "form" ? (
          <>
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
                  onChange={(value) => {
                    const next = Array.isArray(value) ? value[0] ?? null : value;
                    setFile(next);
                    if (next) setSampleFileName(null);
                  }}
                  accept=".csv,.xlsx,.xls"
                  mode="dropzone"
                  description="CSV 또는 엑셀(XLSX) 파일을 업로드하세요"
                />
                {isProcessing ? <ProgressBar isIndeterminate label="데이터 진단 중" /> : null}
                <Button
                  label="다음: 전처리 검토"
                  variant="primary"
                  isDisabled={!isReady || isProcessing}
                  isLoading={isProcessing}
                  clickAction={handleReview}
                />
              </FormLayout>
            </Card>

            <div>
              <Heading level={3}>샘플 데이터로 체험하기</Heading>
              <Text type="supporting" color="secondary">
                직접 업로드할 파일이 없다면 아래 샘플 중 하나를 선택해 바로 분석해볼 수 있습니다
              </Text>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 12 }}>
                {SAMPLE_DATASETS.map((sample) => (
                  <ClickableCard
                    key={sample.fileName}
                    label={sample.title}
                    onClick={() => applySample(sample)}
                  >
                    <Text type="body" weight="bold">{sample.title}</Text>
                    <Text type="supporting" color="secondary">{sample.description}</Text>
                  </ClickableCard>
                ))}
              </div>
              {sampleFileName ? (
                <Banner status="info" title="샘플 선택됨" description={`${sampleFileName} — 폼이 자동으로 채워졌습니다`} />
              ) : null}
            </div>
          </>
        ) : null}

        {step === "preprocess" && suggestion && options && dataset ? (
          <Card>
            <FormLayout>
              <Heading level={3}>전처리 검토</Heading>
              <MetadataList columns="single">
                <MetadataListItem label="결측률">{(suggestion.missingRate * 100).toFixed(1)}%</MetadataListItem>
                <MetadataListItem label="중복 행 수">{suggestion.duplicateRowCount}행</MetadataListItem>
                <MetadataListItem label="이상치 감지 컬럼">
                  {suggestion.outlierColumns.length > 0
                    ? suggestion.outlierColumns.map((c) => `${c.column}(${c.outlierCount})`).join(", ")
                    : "없음"}
                </MetadataListItem>
              </MetadataList>

              <RadioList
                label="결측치 처리"
                value={options.missingStrategy}
                onChange={(value) => setOptions({ ...options, missingStrategy: value as PreprocessingOptions["missingStrategy"] })}
              >
                <RadioListItem label="그대로 유지" value="keep" />
                <RadioListItem label="결측 행 제거" value="drop-row" />
                <RadioListItem label="평균/최빈값으로 채우기" value="fill" />
              </RadioList>

              <RadioList
                label="중복 행 처리"
                value={options.duplicateStrategy}
                onChange={(value) => setOptions({ ...options, duplicateStrategy: value as PreprocessingOptions["duplicateStrategy"] })}
              >
                <RadioListItem label="그대로 유지" value="keep" />
                <RadioListItem label="중복 행 제거" value="drop" />
              </RadioList>

              <RadioList
                label="이상치 처리"
                value={options.outlierStrategy}
                onChange={(value) => setOptions({ ...options, outlierStrategy: value as PreprocessingOptions["outlierStrategy"] })}
              >
                <RadioListItem label="그대로 유지" value="keep" />
                <RadioListItem label="IQR 경계로 캡핑" value="cap-iqr" />
              </RadioList>

              {preview ? (
                <Banner
                  status="info"
                  title="적용 후 품질 점수 미리보기"
                  description={`${preview.report.qualityScoreBefore}점 → ${preview.report.qualityScoreAfter}점 (행 ${preview.report.droppedRowCount}개 제거)`}
                />
              ) : null}

              {isProcessing ? <ProgressBar isIndeterminate label="분석 엔진 실행 중" /> : null}

              <div style={{ display: "flex", gap: 8 }}>
                <Button label="이전" variant="secondary" isDisabled={isProcessing} clickAction={() => setStep("form")} />
                <Button
                  label="분석 실행"
                  variant="primary"
                  isDisabled={isProcessing}
                  isLoading={isProcessing}
                  clickAction={handleAnalyze}
                />
              </div>
            </FormLayout>
          </Card>
        ) : null}
      </div>
    </Section>
  );
}
