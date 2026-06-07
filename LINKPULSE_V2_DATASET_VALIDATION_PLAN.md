# LinkPulse V2 Dataset Validation Plan

## V2 Vision

LinkPulse V2 should evolve from a basic URL health checker into a dataset URL validation CLI for CSV/JSON datasets used in data science, scraping, and MLOps workflows.

The goal is not to become a general website crawler, web app, SaaS product, or dashboard. LinkPulse should stay CLI-first and focus on one practical problem: validating URL quality inside datasets before those datasets are used for training, scraping, enrichment, labeling, or ingestion.

## Current V1 Capabilities

LinkPulse V1 already supports:

- TypeScript CLI project structure.
- TXT input with one URL per line.
- Simple CSV input.
- URL health checks.
- Redirect following.
- HTTP status code capture.
- Response time measurement.
- Error classification.
- JSON and CSV report exports.

## Proposed Niche

General link checkers already exist. LinkPulse should not try to compete with tools focused on website crawling, documentation link checking, or recursive site audits.

Instead, LinkPulse should be positioned as:

**A dataset URL validation CLI for data pipelines and ML/data projects.**

This niche makes LinkPulse useful for checking CSV/JSON datasets that contain:

- Image URLs for computer vision datasets.
- Document URLs for scraping or retrieval workflows.
- API URLs for enrichment jobs.
- Scraped resource links that may be stale, redirected, blocked, or invalid.

The V2 value is row-aware validation: keep dataset context, validate a chosen URL field, and optionally produce a clean dataset containing only healthy rows.

## V2 Feature List

V2 scope should include only these features:

- `--url-column` for CSV files.
- `--expected-content-type`.
- `--min-size`.
- `--fail-threshold`.
- `--clean-output`.
- Summary metrics:
  - Total processed.
  - Reachable count.
  - Failed count.
  - Failure rate.
  - Redirects.
  - Average response time.
  - Failures by domain.

## Example Commands

Validate URLs from a named CSV column:

```bash
npm run check -- dataset.csv -- --url-column image_url
```

Require image-like responses:

```bash
npm run check -- dataset.csv -- --url-column image_url --expected-content-type image/
```

Require each response to be at least 10 KB:

```bash
npm run check -- dataset.csv -- --url-column image_url --min-size 10kb
```

Fail the command when more than 5% of rows fail:

```bash
npm run check -- dataset.csv -- --url-column image_url --fail-threshold 5
```

Write only healthy rows to a clean CSV:

```bash
npm run check -- dataset.csv -- --url-column image_url --clean-output reports/clean.csv
```

## CLI Behavior

Recommended flag behavior:

- If `--url-column` is missing, keep the current V1 behavior.
- If `--url-column` is provided and the column is not found, fail clearly with a non-zero exit code.
- If `--expected-content-type` is set, flag responses whose `content-type` does not start with or include the expected value.
- If `--min-size` is set, flag responses smaller than the configured minimum.
- If `--fail-threshold` is exceeded, exit non-zero after writing reports.
- If `--clean-output` is set, write only healthy original dataset rows to the target CSV path.

Healthy rows should mean:

- URL is valid.
- URL is reachable.
- HTTP result meets the existing V1 reachability rules.
- Content type matches when `--expected-content-type` is provided.
- Size meets `--min-size` when provided and safely measurable.

## Out Of Scope For V2

V2 should explicitly exclude:

- Parquet support.
- Airflow integration.
- DVC integration.
- Web dashboard.
- API server.
- Database.
- Auth.
- AI features.
- Massive-scale optimization.
- Distributed workers.

## Implementation Order

Safest implementation order:

1. Add a small CLI flag parser.
2. Add `--url-column` support.
3. Add `--expected-content-type` check.
4. Add content-length / `--min-size` check.
5. Add `--fail-threshold`.
6. Add `--clean-output` CSV generation.
7. Add expanded summary metrics.
8. Update README with V2 usage and limitations.

This order keeps the early work close to existing V1 parsing and checking behavior before adding output and exit-code behavior.

## Testing Plan

Test V2 with:

- Valid CSV with a URL column.
- Missing URL column.
- Invalid URLs inside the selected column.
- Content-type mismatch.
- Min-size failure.
- Fail-threshold pass and fail behavior.
- Clean-output generation and row verification.

Manual checks should confirm:

- Existing TXT input still works.
- Existing simple CSV behavior still works when `--url-column` is not used.
- JSON and CSV reports are still generated.
- Clean output preserves original row fields and ordering.
- Non-zero exit behavior only happens when expected.

## Risks

Known risks:

- Some servers block `HEAD` requests.
- `content-length` may be missing.
- Some sites return HTML error pages with status `200`.
- Large files should not be fully downloaded just to measure size.
- Concurrency should stay out of V2 unless the sequential approach becomes too slow for realistic sample datasets.

Mitigation ideas:

- Prefer lightweight requests where possible, but fall back carefully when servers reject `HEAD`.
- Treat missing `content-length` as inconclusive unless a safe partial read strategy is added.
- Keep V2 conservative and explain limitations clearly in the README.
- Avoid downloading full large files in V2.

## Recommendation

V2 is worth implementing now because it gives LinkPulse a clearer niche without expanding into app, API, database, or dashboard scope.

The first coding task should be:

**Add a minimal CLI flag parser and implement `--url-column` for CSV files while preserving current behavior when the flag is absent.**

That creates the foundation for dataset-aware validation without changing the core URL checker too early.
