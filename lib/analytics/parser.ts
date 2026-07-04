// CSV/XLSX 파일을 브라우저에서 직접 파싱해 ParsedDataset으로 변환한다 (서버 전송 없음)
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParsedDataset } from "@/types/analysis";

function normalizeValue(value: unknown): string | number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const asString = String(value).trim();
  if (asString === "") return null;
  const asNumber = Number(asString.replace(/,/g, ""));
  if (!Number.isNaN(asNumber) && asString.match(/^-?[\d,]+(\.\d+)?%?$/)) {
    return asString.endsWith("%") ? asNumber : asNumber;
  }
  return asString;
}

function rowsToDataset(rawRows: Record<string, unknown>[]): ParsedDataset {
  const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const rows = rawRows.map((raw) => {
    const row: Record<string, string | number | null> = {};
    for (const column of columns) {
      row[column] = normalizeValue(raw[column]);
    }
    return row;
  });
  return { columns, rows };
}

export function parseCsvFile(file: File): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => resolve(rowsToDataset(result.data)),
      error: (error) => reject(error),
    });
  });
}

export async function parseXlsxFile(file: File): Promise<ParsedDataset> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });
  return rowsToDataset(rawRows);
}

export async function parseUploadedFile(file: File): Promise<ParsedDataset> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return parseCsvFile(file);
  if (extension === "xlsx" || extension === "xls") return parseXlsxFile(file);
  throw new Error(`지원하지 않는 파일 형식입니다: .${extension}`);
}
