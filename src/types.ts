export type ErrorType =
  | "dns_error"
  | "tls_error"
  | "timeout"
  | "access_blocked"
  | "http_error"
  | "invalid_url"
  | "unknown_error";

export type UrlCheckResult = {
  original_url: string;
  final_url: string | null;
  status_code: number | null;
  server_responded: boolean;
  reachable: boolean;
  response_time_ms: number;
  redirect_count: number;
  error_type: ErrorType | null;
  checked_at: string;
};
