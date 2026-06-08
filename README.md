# LinkPulse

LinkPulse is a small TypeScript CLI tool that checks URL health from a text or CSV file and exports clean JSON and CSV reports.

GitHub project description: A CLI-first URL health checker for quick link audits, redirect checks, and simple broken-link reporting.

It is built as a focused side project: no frontend, no database, no auth, no dashboard, no AI, and no payment flow.

## Features

- Reads URLs from `.txt` or simple `.csv` files.
- Ignores empty lines and `#` comments.
- Follows redirects and records the final URL.
- Captures status code, reachability, response time, redirect count, error type, and timestamp.
- Continues checking even when individual URLs fail.
- Prints a terminal summary and table.
- Exports JSON and CSV reports.

## Tech Stack

- Node.js
- TypeScript
- Native `fetch`
- Minimal dev dependencies: `typescript`, `tsx`, and `@types/node`

## Why It Exists

LinkPulse helps you quickly spot broken, redirected, or unreachable URLs before they become annoying cleanup work. It is useful for small link audits, README checks, resource lists, and simple content QA.

## Installation

```bash
npm install
```

## Try It Yourself

Prerequisites:

- Node.js 18 or newer.
- Git.

Clone the project:

```bash
git clone https://github.com/ItzPranav61/linkpulse.git
cd linkpulse
```

Install dependencies:

```bash
npm install
```

Run the quick text-file demo:

```bash
npm run demo
```

Run the CSV dataset demo:

```bash
npm run demo:csv
```

Manual commands, if you want the individual steps:

```bash
npm run build
npm run check -- examples/urls.txt
```

Manual CSV column check:

```bash
npm run check -- examples/dataset.csv -- --url-column image_url
```

Create your own `my-links.txt`:

```text
https://example.com
https://github.com
# comments are ignored
not-a-url
```

Then run:

```bash
npm run check -- my-links.txt
```

Reports are generated in:

```text
reports/linkpulse-report.json
reports/linkpulse-report.csv
```

## Usage

Build the CLI:

```bash
npm run build
```

Run against a text file:

```bash
npm run check -- examples/urls.txt
```

Run against a specific CSV column:

```bash
npm run check -- examples/dataset.csv -- --url-column image_url
```

Run directly from TypeScript during development:

```bash
npm run dev -- examples/urls.txt
```

Text files should contain one URL per line. Empty lines and lines starting with `#` are ignored.

CSV files are also supported in a simple form. If a header named `url` exists, LinkPulse reads that column. Otherwise, it reads the first column. For dataset-style CSV files, use `--url-column` to choose a named URL column.

## Preview

When LinkPulse runs, it prints a small CLI banner before the URL checks:

```text
██╗     ██╗███╗   ██╗██╗  ██╗██████╗ ██╗   ██╗██╗     ███████╗███████╗
██║     ██║████╗  ██║██║ ██╔╝██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██║     ██║██╔██╗ ██║█████╔╝ ██████╔╝██║   ██║██║     ███████╗█████╗
██║     ██║██║╚██╗██║██╔═██╗ ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝
███████╗██║██║ ╚████║██║  ██╗██║     ╚██████╔╝███████╗███████║███████╗
╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝

URL health checker for developers.
```

## Sample Output

```text
Checking 5 URLs...

Summary
Total checked: 5
Reachable: 2
Redirected: 1
Failed: 3
Average response time: 320ms

Results
URL                                           Status  Reachable  Time   Error
https://example.com                           200     yes        120ms  -
http://github.com                             301     yes        180ms  -
https://example.com/not-found                 404     no         90ms   http_error
https://chatgpt.com                           403     no         130ms  access_blocked
not-a-url                                     -       no         0ms    invalid_url
https://this-domain-should-not-exist...       -       no         900ms  dns_error
```

Reports are written to:

```text
reports/linkpulse-report.json
reports/linkpulse-report.csv
```

## Example CSV Report Preview

```csv
original_url,final_url,status_code,server_responded,reachable,response_time_ms,redirect_count,error_type,checked_at
https://example.com,https://example.com/,200,true,true,120,0,,2026-06-05T08:13:14.673Z
http://github.com,https://github.com/,200,true,true,180,1,,2026-06-05T08:13:14.860Z
https://example.com/not-found,https://example.com/not-found,404,true,false,90,0,http_error,2026-06-05T08:13:14.949Z
https://chatgpt.com,https://chatgpt.com/,403,true,false,130,0,access_blocked,2026-06-05T08:13:14.950Z
not-a-url,,,false,false,0,0,invalid_url,2026-06-05T08:13:14.969Z
```

## Result Fields

- `original_url`: The URL exactly as it appeared in the input file.
- `final_url`: The final URL after redirects, or `null` for invalid input.
- `status_code`: The HTTP status code, or `null` if no response was received.
- `server_responded`: `true` when an HTTP response was received, even if the status code is not reachable.
- `reachable`: `true` for 2xx and 3xx responses, otherwise `false`.
- `response_time_ms`: Total time spent checking the URL.
- `redirect_count`: Number of redirects followed.
- `error_type`: Failure reason, such as `dns_error`, `tls_error`, `timeout`, `access_blocked`, `http_error`, `invalid_url`, or `unknown_error`.
- `checked_at`: ISO timestamp for when the check started.

`access_blocked` means the server responded with `401`, `403`, or `429`. The URL may still work in a browser, but the site blocked unauthenticated, automated, or rate-limited access.

## What I Learned

- How to structure a small CLI-first TypeScript project.
- How to use native Node.js `fetch` with redirects, timeouts, and error handling.
- How to keep failures isolated so one bad URL does not stop the whole run.
- How to generate simple JSON and CSV reports from typed result data.

## Limitations

- Redirects are capped at 10 hops.
- Timeout is fixed at 10 seconds.
- CSV support is intentionally simple and meant for basic files.
- URLs are checked sequentially to keep the code beginner-readable.
- Some sites may block automated requests or return different results based on region, TLS settings, or bot protection.
- `401`, `403`, and `429` are reported as `access_blocked`, not necessarily as broken links.

## Future Improvements

- Add a configurable timeout.
- Add parallel checks with a safe concurrency limit.
- Add CLI flags for output paths.
- Add tests for parsing and error classification.
- Add support for custom request headers.
