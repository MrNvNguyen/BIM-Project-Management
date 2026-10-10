# Evidence and Footer Contracts — BIM PM

Read with `SKILL.md` when producing or adjudicating evidence.

## 1. Machine SSOT

Prefer small markdown/JSON under `docs/` or a campaign evidence folder. Never commit
secrets, tokens, or files >50 MiB. Record byte length + SHA-256 for large local blobs.

```text
<evidence-root>/
  result.json
  claims.yaml
  evidence-index.json
```

```yaml
schema: bim-pm-evidence-1
campaign: <id> | n/a
wave_id:
verify_sha: <git SHA>
behavior_change: true | false
authority: PRODUCT | DIAGNOSTIC | PROCESS
run_class: INVALID_ENVIRONMENT_RUN | PRODUCT_FAILURE_RUN | PRODUCT_PASS_RUN | N/A
attempt_outcome: PASS | FALSIFIED | NOT_MEASURED | N/A
```

Logs summarize; they do not dump D1 row dumps or HAR with tokens.

## 2. Footers (one per agent turn when this skill is active)

### lead-dev

```yaml
LEAD_FOOTER:
  wave_id:
  lever:
  verify_sha:
  self_test: PASS | FAIL
  behavior_change: true | false
  next_agent: qa-agent | lead-dev | technical-advisor
  attempt_claimed: false
```

### qa-agent

```yaml
QA_FOOTER:
  wave_id:
  verify_sha:
  qa_tier:
  run_class:
  attempt_outcome:
  product_evidence_paths: []
  engineering_evidence_paths: []
  verdict: PASS | FAIL | PARTIAL
  next_agent: technical-advisor
```

### technical-advisor

```yaml
TECHNICAL_FOOTER:
  wave_id:
  local_verdict: APPROVE-HANDOFF | BLOCK-DEV | SELF-REPAIR | REPORT-UP-STRATEGY | ADVANCE_SHORT
  open_gaps: []
  next_agent: lead-dev | qa-agent | strategy-advisor | orchestrator-router
  never: PO-human
```

### strategy-advisor

```yaml
STRATEGY_FOOTER:
  strategyOutputType:
  challenged_assumption:
  po_packet_precheck: PASS | FAIL | N/A
  next_agent: technical-advisor | orchestrator-router | PO-human | none
```

### orchestrator-router

```yaml
ORCH_FOOTER:
  dispatched:
  preflight: PASS | FAIL
  stop_reason: null | <reason>
  next_agent:
```

## 3. Claims

```yaml
claims:
  - id:
    statement:
    evidence: []
    status: measured | inferred | hypothesis
```

Product PASS requires measured claims. Hypothesis cannot carry a Success packet alone.
