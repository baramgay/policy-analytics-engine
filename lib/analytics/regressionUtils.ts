// 선형대수 공유 모듈 — VIF(분산팽창지수) 계산 전용 (Gaussian 소거법, 외부 라이브러리 미사용)
// 확률분포 계산(statUtils.ts)과 재사용 맥락이 달라 별도 모듈로 분리한다

// 특이행렬 판정 상대 허용오차. 절대값 고정 임계값 대신 행렬 스케일(원본 계수의
// 최대 절대값)에 곱해 사용한다 — VIF는 인구수·거래건수 등 큰 값 스케일의 데이터에도
// 적용되므로, 절대 임계값만 쓰면 큰 스케일에서는 특이행렬을 놓치고
// (반올림 잔차가 1e-10보다 커짐) 작은 스케일에서는 과도하게 민감해질 수 있다
const SINGULARITY_THRESHOLD = 1e-10;

// 가우스 소거법(부분 피벗팅)으로 연립방정식 Ax=b를 푼다. a가 정사각행렬이 아니거나
// b의 길이가 맞지 않으면 null, 특이행렬(또는 근사 특이)이면 null을 반환한다
export function solveLinearSystem(a: number[][], b: number[]): number[] | null {
  const n = a.length;
  if (n === 0 || a.some((row) => row.length !== n) || b.length !== n) return null;

  const matrix = a.map((row, i) => [...row, b[i]]);

  // 원본 계수의 최대 절대값을 기준으로 피벗 허용오차를 스케일링한다
  let matrixScale = 0;
  for (const row of a) {
    for (const value of row) {
      matrixScale = Math.max(matrixScale, Math.abs(value));
    }
  }
  const pivotTolerance = SINGULARITY_THRESHOLD * Math.max(matrixScale, 1);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(matrix[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(matrix[row][col]) > maxAbs) {
        maxAbs = Math.abs(matrix[row][col]);
        pivotRow = row;
      }
    }
    if (maxAbs < pivotTolerance) return null;

    if (pivotRow !== col) {
      [matrix[col], matrix[pivotRow]] = [matrix[pivotRow], matrix[col]];
    }

    for (let row = col + 1; row < n; row++) {
      const factor = matrix[row][col] / matrix[col][col];
      for (let k = col; k <= n; k++) {
        matrix[row][k] -= factor * matrix[col][k];
      }
    }
  }

  const solution = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = matrix[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= matrix[row][col] * solution[col];
    }
    solution[row] = sum / matrix[row][row];
  }

  return solution;
}

// 다중회귀 결정계수(R²)를 최소제곱법으로 계산한다. VIF 계산 시 각 예측변수를
// 나머지 예측변수들로 회귀한 R²가 필요하며, 이 함수가 그 핵심 연산을 담당한다.
// 표본 수가 파라미터 수(절편 포함) + 1보다 작으면 잔차자유도가 없어 null을 반환한다
// (n >= predictorCount + 2 여야 최소 1의 잔차자유도가 보장됨)
export function multipleRegressionRSquared(
  target: number[],
  predictors: number[][]
): number | null {
  const n = target.length;
  const predictorCount = predictors.length;
  if (predictors.some((p) => p.length !== n)) return null;
  if (n < predictorCount + 2) return null;

  // 설계행렬 X = [1, x1, x2, ...] (절편 포함)
  const designMatrix: number[][] = [];
  for (let row = 0; row < n; row++) {
    designMatrix.push([1, ...predictors.map((p) => p[row])]);
  }

  const paramCount = predictorCount + 1;
  const xtx: number[][] = Array.from({ length: paramCount }, () => new Array(paramCount).fill(0));
  const xty: number[] = new Array(paramCount).fill(0);

  for (let row = 0; row < n; row++) {
    for (let i = 0; i < paramCount; i++) {
      xty[i] += designMatrix[row][i] * target[row];
      for (let j = 0; j < paramCount; j++) {
        xtx[i][j] += designMatrix[row][i] * designMatrix[row][j];
      }
    }
  }

  const beta = solveLinearSystem(xtx, xty);
  if (!beta) return null;

  const targetMean = target.reduce((sum, v) => sum + v, 0) / n;
  let ssTotal = 0;
  let ssResidual = 0;
  for (let row = 0; row < n; row++) {
    const predicted = designMatrix[row].reduce((sum, v, i) => sum + v * beta[i], 0);
    ssResidual += (target[row] - predicted) ** 2;
    ssTotal += (target[row] - targetMean) ** 2;
  }

  if (ssTotal === 0) return null;
  return 1 - ssResidual / ssTotal;
}
