// 통계 분석 엔진 공용 확률분포 함수 모음 (외부 통계 라이브러리 미사용)
// t분포·F분포 p값 계산에 필요한 감마·베타함수와, 카이제곱 p값 계산에 필요한
// 불완전 감마함수를 이 모듈에 모아 여러 분석기(groupComparator 등)에서 공유한다

// Lanczos 근사로 로그 감마함수를 계산한다 (불완전 베타함수·불완전 감마함수 계산에 필요)
export function logGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const xm1 = x - 1;
  let a = c[0];
  const t = xm1 + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (xm1 + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (xm1 + 0.5) * Math.log(t) - t + Math.log(a);
}

// 정규화된 불완전 베타함수 I_x(a, b) — 연분수 전개(Numerical Recipes 알고리즘)
export function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

export function tTestPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return 1;
  const x = df / (df + t * t);
  return regularizedIncompleteBeta(x, df / 2, 0.5);
}

export function fTestPValue(f: number, df1: number, df2: number): number {
  if (!Number.isFinite(f) || f <= 0 || df1 <= 0 || df2 <= 0) return 1;
  const x = df2 / (df2 + df1 * f);
  return regularizedIncompleteBeta(x, df2 / 2, df1 / 2);
}

// 하부 불완전 감마함수의 정규화값 P(s, x) — 급수 전개(x < s + 1 구간에서 사용)
export function gammaSeries(s: number, x: number): number {
  const MAXIT = 200;
  const EPS = 1e-12;

  if (x <= 0) return 0;

  let ap = s;
  let sum = 1 / s;
  let del = sum;

  for (let n = 1; n <= MAXIT; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }

  const logPrefix = -x + s * Math.log(x) - logGamma(s);
  return sum * Math.exp(logPrefix);
}

// 상부 불완전 감마함수의 정규화값 Q(s, x) — 연분수 전개(x >= s + 1 구간에서 사용, Lentz 알고리즘)
export function gammaContinuedFraction(s: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-30;

  let b = x + 1 - s;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i <= MAXIT; i++) {
    const an = -i * (i - s);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }

  const logPrefix = -x + s * Math.log(x) - logGamma(s);
  return Math.exp(logPrefix) * h;
}

// 정규화된 하부 불완전 감마함수 P(s, x) — 카이제곱 p값 계산의 기반
export function regularizedIncompleteGamma(s: number, x: number): number {
  if (x <= 0) return 0;
  if (x < s + 1) {
    return gammaSeries(s, x);
  }
  return 1 - gammaContinuedFraction(s, x);
}

// 카이제곱 통계량의 상단꼬리 p값 — 자유도 df인 카이제곱분포에서 관측된 통계량 이상 나올 확률
export function chiSquarePValue(chiSquare: number, df: number): number {
  if (!Number.isFinite(chiSquare) || !Number.isFinite(df) || chiSquare < 0 || df <= 0) return 1;
  return 1 - regularizedIncompleteGamma(df / 2, chiSquare / 2);
}
