#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { checkUrl } from "./checkUrl.js";
import { writeReports } from "./report.js";
import type { UrlCheckResult } from "./types.js";

type CliOptions = {
  inputPath: string | null;
  urlColumn: string | null;
};

async function main(): Promise<void> {
  let options: CliOptions;

  try {
    options = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Example: npm run check -- examples/dataset.csv -- --url-column image_url");
    process.exitCode = 1;
    return;
  }

  const { inputPath, urlColumn } = options;

  if (!inputPath) {
    console.error("Please provide an input file path.");
    console.error("Example: npm run check -- examples/urls.txt");
    process.exitCode = 1;
    return;
  }

  let urls: string[];

  try {
    urls = await readUrlsFromFile(inputPath, urlColumn);
  } catch (error) {
    console.error(`Could not load URLs from input file: ${inputPath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (urls.length === 0) {
    console.error("No URLs found. Add one URL per line, or use a CSV file with URLs.");
    process.exitCode = 1;
    return;
  }

  printBanner();
  console.log(`Checking ${urls.length} URL${urls.length === 1 ? "" : "s"}...\n`);

  const results: UrlCheckResult[] = [];

  for (const url of urls) {
    results.push(await checkUrl(url));
  }

  printSummary(results);
  printTable(results);

  await writeReports(results);
  console.log("\nReports written:");
  console.log("- reports/linkpulse-report.json");
  console.log("- reports/linkpulse-report.csv");
}

function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: null,
    urlColumn: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--url-column") {
      const value = args[index + 1];

      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --url-column.");
      }

      options.urlColumn = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.inputPath) {
      options.inputPath = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return options;
}

async function readUrlsFromFile(inputPath: string, urlColumn: string | null): Promise<string[]> {
  const rawContent = await readFile(inputPath, "utf8");
  const extension = path.extname(inputPath).toLowerCase();

  if (urlColumn && extension !== ".csv") {
    throw new Error("--url-column can only be used with .csv input files.");
  }

  if (extension === ".csv") {
    return parseCsvUrls(rawContent, urlColumn);
  }

  return rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function parseCsvUrls(rawContent: string, urlColumn: string | null): string[] {
  const rows = rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (rows.length === 0) {
    return [];
  }

  const firstRow = parseSimpleCsvRow(rows[0]);

  if (urlColumn) {
    const header = firstRow.map((value) => value.trim());
    const columnIndex = header.findIndex((value) => value === urlColumn);

    if (columnIndex === -1) {
      throw new Error(`CSV column not found: ${urlColumn}`);
    }

    return rows
      .slice(1)
      .map((row) => parseSimpleCsvRow(row)[columnIndex]?.trim() ?? "")
      .filter((url) => url.length > 0);
  }

  const defaultUrlColumnIndex = firstRow.findIndex((value) => value.toLowerCase() === "url");
  const startIndex = defaultUrlColumnIndex >= 0 ? 1 : 0;
  const columnIndex = defaultUrlColumnIndex >= 0 ? defaultUrlColumnIndex : 0;

  return rows
    .slice(startIndex)
    .map((row) => parseSimpleCsvRow(row)[columnIndex]?.trim() ?? "")
    .filter((url) => url.length > 0);
}

function parseSimpleCsvRow(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const nextChar = row[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function printSummary(results: UrlCheckResult[]): void {
  const total = results.length;
  const reachable = results.filter((result) => result.reachable).length;
  const redirected = results.filter((result) => result.redirect_count > 0).length;
  const failed = total - reachable;
  const averageResponseTime = Math.round(
    results.reduce((sum, result) => sum + result.response_time_ms, 0) / total
  );

  console.log("Summary");
  console.log(`Total checked: ${total}`);
  console.log(`Reachable: ${reachable}`);
  console.log(`Redirected: ${redirected}`);
  console.log(`Failed: ${failed}`);
  console.log(`Average response time: ${averageResponseTime}ms`);
}

function printBanner(): void {
  console.log(String.raw`
██╗     ██╗███╗   ██╗██╗  ██╗██████╗ ██╗   ██╗██╗     ███████╗███████╗
██║     ██║████╗  ██║██║ ██╔╝██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██║     ██║██╔██╗ ██║█████╔╝ ██████╔╝██║   ██║██║     ███████╗█████╗
██║     ██║██║╚██╗██║██╔═██╗ ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝
███████╗██║██║ ╚████║██║  ██╗██║     ╚██████╔╝███████╗███████║███████╗
╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝

URL health checker for developers.
`);
}

function printTable(results: UrlCheckResult[]): void {
  const rows = results.map((result) => ({
    URL: truncate(result.original_url, 45),
    Status: result.status_code === null ? "-" : String(result.status_code),
    Reachable: result.reachable ? "yes" : "no",
    Time: `${result.response_time_ms}ms`,
    Error: result.error_type ?? "-"
  }));

  console.log("\nResults");
  console.table(rows);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

main().catch((error) => {
  console.error("Unexpected LinkPulse error:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
