// 데모용 생활인구 원본 데이터셋. 시드 고정 난수로 매 빌드마다 동일한 값을 생성한다
import type { ParsedDataset } from "@/types/analysis";

const REGIONS = ["창원시", "진주시", "김해시", "양산시", "거제시", "통영시"] as const;
const AGE_GROUPS = ["10대", "20대", "30대", "40대", "50대", "60대이상"] as const;
const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];

const REGION_BASE: Record<(typeof REGIONS)[number], number> = {
  창원시: 180000,
  진주시: 95000,
  김해시: 110000,
  양산시: 80000,
  거제시: 60000,
  통영시: 45000,
};

const AGE_FACTOR: Record<(typeof AGE_GROUPS)[number], number> = {
  "10대": 0.08,
  "20대": 0.16,
  "30대": 0.19,
  "40대": 0.2,
  "50대": 0.19,
  "60대이상": 0.18,
};

function createSeededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function buildPopulationDataset(): ParsedDataset {
  const rnd = createSeededRandom(42);
  const rows: ParsedDataset["rows"] = [];

  for (const month of MONTHS) {
    for (const region of REGIONS) {
      for (const age of AGE_GROUPS) {
        const noise = 0.9 + rnd() * 0.2;
        const value = Math.round(REGION_BASE[region] * AGE_FACTOR[age] * noise);
        const isMissing = rnd() < 0.04;
        rows.push({
          날짜: month,
          지역: region,
          연령대: age,
          생활인구수: isMissing ? null : value,
        });
      }
    }
  }

  return { columns: ["날짜", "지역", "연령대", "생활인구수"], rows };
}
