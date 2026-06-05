# LinkPulse V2 Dataset Validation Plan

## Goal

Evolve LinkPulse from a basic URL health checker into a CLI-first dataset URL validator for CSV/JSON datasets used in data science and MLOps workflows.

This is a planning document only. V2 should stay small, terminal-based, and suitable for local checks or pipeline scripts.

## Current V1 Capabilities

LinkPulse V1 already supports:

- `.txt` input with one URL per line.
- Simple `.csv` input.
- URL health checks.
- Redirect following.
- HTTP status code capture.
- Response time measurement.
- JSON and CSV report exports.

## Better Positioning

LinkPulse should not try to compete with mature general-purpose link checkers like Lychee or Muffet. Those tools are better suited for broad website crawling, documentation link checks, and recursive link discovery.

LinkPulse should position itself more narrowly as:

**A dataset URL validator for data science and MLOps pipelines.**

That means V2 should focus on validating URL columns inside structured datasets, preserving row context, producing machine-readable outputs, and helping teams decide whether a dataset is clean enough to use in training, enrichment, labeling, or ingestion workflows.

## V2 Scope

Planned V2 features:

- `--url-column`: Select the CSV column that contains URLs.
- `--expected-content-type`: Mark rows failed when the response content type does not match the expected value.
- `--min-size`: Mark rows failed when the response body or content length is smaller than the minimum expected size.
- `--fail-threshold`: Exit with failure when the failed URL percentage exceeds a configured threshold.
- `--clean-output`: Write a CSV containing only rows that pass validation.
- Summary metrics:
  - Total processed.
  - Reachable count.
  - Failed count.
  - Failure rate.
  - Failures by domain.
  - Links per second.

## Out Of Scope For V2

V2 should not include:

- Parquet support.
- Airflow integration.
- DVC hooks.
- GitHub Action.
- Web UI.
- Database.
- Auth.
- AI.
- Dashboard.

## Example Commands

Validate an image dataset by URL column:

```bash
npm run check -- data/images.csv --url-column image_url
```

Require image responses:

```bash
npm run check -- data/images.csv --url-column image_url --expected-content-type image/
```

Require each asset to be at least 10 KB:

```bash
npm run check -- data/images.csv --url-column image_url --min-size 10240
```

Fail the process when more than 5% of links fail:

```bash
npm run check -- data/images.csv --url-column image_url --fail-threshold 5
```

Write only valid rows to a clean CSV:

```bash
npm run check -- data/images.csv --url-column image_url --clean-output reports/images-clean.csv
```

## Data Examples

Example CSV input:

```csv
id,image_url,label
1,https://example.com/cat.jpg,cat
2,https://example.com/dog.jpg,dog
3,https://example.com/missing.jpg,dog
4,not-a-url,unknown
```

Example clean output CSV:

```csv
id,image_url,label
1,https://example.com/cat.jpg,cat
2,https://example.com/dog.jpg,dog
```

## Implementation Order

1. Parse `--url-column`.
2. Preserve original CSV rows during validation.
3. Add `--clean-output`.
4. Add `--fail-threshold`.
5. Add `--expected-content-type`.
6. Add `--min-size`.
7. Add summary metrics.

## Risks

- Slow checks when datasets contain many URLs.
- Some sites block `HEAD` requests or automated clients.
- Large files may be expensive to validate.
- Memory usage can grow if entire datasets are loaded at once.
- False positives from temporary network failures.
- Rate limiting from domains with many repeated URLs.

## Testing Plan

Test V2 with:

- A small CSV with a valid `image_url` column.
- An invalid URL column name.
- Mixed good and bad URLs.
- Content-type mismatch behavior.
- `--fail-threshold` pass and fail behavior.
- `--clean-output` file creation and row verification.

## README Update Plan

When V2 is implemented, update the README to include:

- Dataset URL validation positioning.
- `--url-column` usage.
- Content type and size validation examples.
- Fail threshold behavior and exit codes.
- Clean output CSV examples.
- Updated report fields and summary metrics.
- Clear note that LinkPulse remains CLI-first and is not a web app or SaaS.
