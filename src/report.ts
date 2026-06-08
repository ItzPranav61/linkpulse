import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { UrlCheckResult } from "./types.js";

const REPORTS_DIR = "reports";

export async function writeReports(results: UrlCheckResult[]): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true });

  await Promise.all([
    writeJsonReport(results, path.join(REPORTS_DIR, "linkpulse-report.json")),
    writeCsvReport(results, path.join(REPORTS_DIR, "linkpulse-report.csv"))
  ]);
}

function writeJsonReport(results: UrlCheckResult[], filePath: string): Promise<void> {
  return writeFile(filePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
}

function writeCsvReport(results: UrlCheckResult[], filePath: string): Promise<void> {
  const headers = [
    "original_url",
    "final_url",
    "status_code",
    "server_responded",
    "reachable",
    "response_time_ms",
    "redirect_count",
    "error_type",
    "checked_at"
  ];

  const rows = results.map((result) =>
    headers.map((header) => escapeCsvValue(result[header as keyof UrlCheckResult])).join(",")
  );

  return writeFile(filePath, `${headers.join(",")}\n${rows.join("\n")}\n`, "utf8");
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
