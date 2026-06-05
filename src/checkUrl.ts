import type { ErrorType, UrlCheckResult } from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 10;

export async function checkUrl(originalUrl: string): Promise<UrlCheckResult> {
  const checkedAt = new Date().toISOString();
  const startedAt = Date.now();

  let currentUrl: URL;

  try {
    currentUrl = new URL(originalUrl);
  } catch {
    return {
      original_url: originalUrl,
      final_url: null,
      status_code: null,
      reachable: false,
      response_time_ms: Date.now() - startedAt,
      redirect_count: 0,
      error_type: "invalid_url",
      checked_at: checkedAt
    };
  }

  if (!["http:", "https:"].includes(currentUrl.protocol)) {
    return {
      original_url: originalUrl,
      final_url: currentUrl.toString(),
      status_code: null,
      reachable: false,
      response_time_ms: Date.now() - startedAt,
      redirect_count: 0,
      error_type: "invalid_url",
      checked_at: checkedAt
    };
  }

  let redirectCount = 0;
  let statusCode: number | null = null;

  try {
    while (redirectCount <= MAX_REDIRECTS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      try {
        const response = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "user-agent": "LinkPulse/1.0"
          }
        });

        statusCode = response.status;

        if (isRedirect(response.status)) {
          const location = response.headers.get("location");

          if (location && redirectCount < MAX_REDIRECTS) {
            currentUrl = new URL(location, currentUrl);
            redirectCount += 1;
            continue;
          }
        }

        const reachable = response.status >= 200 && response.status < 400;

        return {
          original_url: originalUrl,
          final_url: currentUrl.toString(),
          status_code: statusCode,
          reachable,
          response_time_ms: Date.now() - startedAt,
          redirect_count: redirectCount,
          error_type: reachable ? null : "http_error",
          checked_at: checkedAt
        };
      } finally {
        clearTimeout(timeout);
      }
    }

    return {
      original_url: originalUrl,
      final_url: currentUrl.toString(),
      status_code: statusCode,
      reachable: false,
      response_time_ms: Date.now() - startedAt,
      redirect_count: redirectCount,
      error_type: "http_error",
      checked_at: checkedAt
    };
  } catch (error) {
    return {
      original_url: originalUrl,
      final_url: currentUrl.toString(),
      status_code: statusCode,
      reachable: false,
      response_time_ms: Date.now() - startedAt,
      redirect_count: redirectCount,
      error_type: classifyError(error),
      checked_at: checkedAt
    };
  }
}

function isRedirect(statusCode: number): boolean {
  return statusCode >= 300 && statusCode < 400;
}

function classifyError(error: unknown): ErrorType {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "timeout";
  }

  const errorWithCause = error as { cause?: { code?: string }; code?: string; message?: string };
  const code = errorWithCause.cause?.code ?? errorWithCause.code ?? "";
  const message = errorWithCause.message?.toLowerCase() ?? "";

  if (["ENOTFOUND", "EAI_AGAIN"].includes(code)) {
    return "dns_error";
  }

  if (
    code.includes("CERT") ||
    code.includes("TLS") ||
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    message.includes("certificate")
  ) {
    return "tls_error";
  }

  if (["ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT"].includes(code)) {
    return "timeout";
  }

  return "unknown_error";
}
