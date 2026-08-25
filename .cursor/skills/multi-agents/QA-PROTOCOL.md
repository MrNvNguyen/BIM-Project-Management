# QA Protocol

Read with `SKILL.md` when a wave has QA work.

## 1. Tier and batching

| Tier | Scope | Required work | Default batching |
|------|-------|---------------|------------------|
| Q0 | docs/schema/contract | schema/lint/consistency; no live APS | many stages → one QA |
| Q1 | code/CLI/forensic | `verify_sha` + 1–3 claim samples; full rerun only on first-use/mismatch | 3–5 stages → one QA |
| Q2 | runtime/product spot | Layer A + bounded Electron/APS product session | solo or same-config wave |
| Q3 | product exit | full signed DoD matrix | solo once at exit |

Plan/footer must include:

```yaml
qa_tier: Q0 | Q1 | Q2 | Q3
qa_batch: solo | wave:<id>
q2_class: ROUTING_SMOKE | PRODUCT_SPOT | MEASURE_FULL | n/a
```

Rules:

- Q0/Q1 wave-batch is default.
- Q3 is not grouped with another stage.
- REM after measured failure is solo.
- `defer_qa: true` means wait until the wave end; self-test still runs per lead stage.
- QA verifies the exact shipped SHA.

## 2. Trusted harness

| Harness state | QA |
|---------------|----|
| First use or runner changed | full independent run once |
| Trusted (≥1 independent PASS, runner unchanged) | `verify_claims` + 1–3 samples + SHA |
| Lead nonzero exit, SHA/claim conflict | full rerun |

## 3. Layer A and Layer B

| Layer | Purpose | Failure |
|-------|---------|---------|
| A | code, schema, contract, unit | `INFRA-REGRESSION` |
| B | actual product behavior (Electron + APS) | `PRODUCT-UX-FAIL` or product failure |

Layer A never overrides a Layer B failure.

### Q2 class

| Class | Use | Layer B budget |
|-------|-----|----------------|
| `ROUTING_SMOKE` | UI routing / error fences; no live copy | one navigate + smoke |
| `PRODUCT_SPOT` | auth/copy/filter risk | ≤1 valid product job on fixture + decisive evidence |
| `MEASURE_FULL` | metric/DoD gate | full job report + required APS checks |

Q2 must not grow into a full qualification matrix. Q3 owns full qualification.

## 4. Product runtime policy

For Electron / APS product claims:

1. Use a dedicated fixture hub/project when live calls are required.
2. Prefer dry-run plan evidence before live `copyFrom`.
3. Redact tokens, cookies, and signed URLs in all evidence.
4. Record region, hub, project, source/dest folder URNs (or display paths).
5. One product session per QA run unless DoD requires otherwise.

Do not treat Cursor browser MCP as a substitute for Electron app verification.

## 5. Environment fingerprint

Every product qualification run records, when available:

```yaml
RUN_ENVIRONMENT_FINGERPRINT:
  git_SHA:
  electron_version:
  app_version:
  OS:
  aps_region:
  hub_id:
  project_id:
  auth_mode: PKCE
  cache_state:
  timestamp:
```

Unavailable fields are explicit `null` with a reason; do not invent values.

## 6. Effective runtime config

```yaml
EFFECTIVE_RUNTIME_CONFIG:
  source_folder:
  dest_folder:
  skip_policy: by_name | by_name_and_tip | always_new_name
  reviews_filter: APPROVED | none | custom
  tip_only: true | false
  dry_run: true | false
  scenario_id:
```

Qualification fingerprint must match product-default fingerprint for product claims.

## 7. Product evidence requirements

Minimum for a product PASS claim:

- job summary: scanned / copied / skipped / failed;
- for copy claims: proof of cloud `copyFrom` (not local download/upload);
- for filter claims: at least one included + one excluded example with reason;
- for skip claims: existing dest name skipped without overwrite;
- UI claim: screenshot/recording of the claimed surface.

## 8. Crash / auth hard-fail

```yaml
qa_tag: PRODUCT-RUNTIME-FAIL
verdict: FAIL
```

Triggers: uncaught Electron crash, auth refresh dead-end, permanent 403 on required scope,
or unhandled APS 423 loop without backoff policy when that was the claim.

Secondary metrics from that session are contaminated.

## 9. Attempt classification

```yaml
run_class: INVALID_ENVIRONMENT_RUN | PRODUCT_FAILURE_RUN | PRODUCT_PASS_RUN
attempt_outcome: PASS | FALSIFIED | NOT_MEASURED
falsifier_measured: true | false
```

`NOT_MEASURED` when auth/network/fixture missing prevents measuring the falsifier.
Valid product misses still count as `FALSIFIED` / `PRODUCT_FAILURE_RUN`.
