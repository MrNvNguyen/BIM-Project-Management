---
name: multi-agents
description: >-
  Orchestrates BIM Project Management work with strategy as adversarial PO-proxy,
  technical as execution planner, and lead/QA as measured doers. Use for signed
  campaign cycles, evidence adjudication, Success/Ceiling, measurement repair,
  anti-grind routing, or when work must reach PO-human with product outcomes only.
  Not for Autodesk Forma or Electron copy-app work.
disable-model-invocation: true
---

# Multi-Agent Orchestration — BIM Project Management

This repo is an internal **Hono + D1 + static SPA** for BIM projects, personnel,
timesheets, legal, finance, assets, and executive reporting. It is **not** OneX Forma
or an Electron APS copy tool.

One bounded arc → **SUCCESS** or **CEILING**. Optimize for **PO-visible truth**
(màn hình đúng số, đúng quyền), not activity.

## 0. Progressive disclosure

| Trigger | Read |
|---------|------|
| Roles, loop, stop rules | this file |
| QA tier / product job / crash | [QA-PROTOCOL.md](QA-PROTOCOL.md) |
| Machine evidence / footers | [EVIDENCE-AND-FOOTERS.md](EVIDENCE-AND-FOOTERS.md) |
| Strategy PO-proxy / PO packets | [STRATEGY-AND-GOVERNANCE.md](STRATEGY-AND-GOVERNANCE.md) |
| Money / progress formulas | [docs/TU-DIEN-SO-LIEU.md](../../../docs/TU-DIEN-SO-LIEU.md) |

SSOT when a signed campaign exists: `0 Documents/1-Sprints/<Campaign>/CAMPAIGN-STATE.md`  
Research (observation only): `0 Documents/1 - Thaoluan/**`  
If those folders are **absent**, treat `docs/` + git + running app as product SSOT. Do not invent a Forma/APS envelope.

---

## 1. Authority ladder

```text
PO-human Rules + signed authorized_box (when campaign active)
  → strategy-advisor (adversarial PO-proxy)
    → technical-advisor (execution plan + report-up)
      → lead-dev (one lever) → qa-agent (independent verify)
  → orchestrator-router (dispatch / stop)
```

Without a signed campaign: still use product-evidence-first and the four PO gates in
`.cursor/rules/po-governance.mdc`. Do **not** apply APS `copyFrom` / Reviews / Electron rules.

Only `lead-dev` edits production: `src/**`, `public/index.html`, `public/static/app.js`,
`public/static/executive-dashboard.js`, `migrations/*.sql`. Do not edit `app.v2.js` / `style.v2.css`.

---

## 2. Role contracts

### 2.1 `strategy-advisor`

**Owns:** authorize/close boxes inside signed cap · adjudicate raw evidence · reject weak
claims · `TEAM_DIRECTIVE` without PO · PO packets only when scope needs PO.

**Must:** read result/claims/screenshots **before** agent logs; extract ≥3 claims from raw
evidence; separate invalid env · product fail · product pass · `NOT_MEASURED`; challenge ≥1
assumption; decide `STRATEGY_APPROVE_EXECUTION` | `REJECT_AND_DIRECT` | `HOLD_MEASURE` |
`AUTHORIZE_PHASE` | `CLOSE_CEILING` | `PO_PACKET`.

**Must not:** edit production · ask PO to ack technical next steps · send a PO packet while
decisive metrics are `NOT_MEASURED`.

### 2.2 `technical-advisor`

**Owns:** one `WAVE_CARD` · DoD · QA tier · regression · honest report-up.

**Must not:** authorize scope · message PO · hide `NOT_MEASURED` as PASS · edit production.

### 2.3 `lead-dev`

**Owns:** one causal lever · self-test (`npm test`, targeted API/UI) · changelog for behavior.

**Must not:** change bars/box · bundle a second lever · claim product PASS · patch campaign state.

### 2.4 `qa-agent`

**Owns:** env preflight · product fingerprint (git SHA + wrangler/D1 + browser URL) ·
claim verify · Layer A (vitest/API) / Layer B (browser or curl against running app).

**Must not:** edit production · treat `vitest` PASS as product PASS for UI/finance screens.

### 2.5 `orchestrator-router`

**Owns:** dispatch order · footer validation · stop wrong PO escalations.

---

## 3. Product envelope (this repo)

Hard constraints (not APS):

- Money, VAT, management fee, progress, approval status: **server** (`src/finance.ts`, `src/index.tsx`). UI formats only.
- Schema: additive `migrations/*.sql`. No production `POST /api/system/init` (`ALLOW_SYSTEM_INIT=1` local only).
- Auth: Bearer (and `?token=` only for file/img). Never trust client role checks.
- Roles: `system_admin` | `project_admin` | `project_leader` | `member` + project membership. Reuse `getEffectiveRole` / `adminOnly` / `pmoAccess`.
- D1 bills **rows scanned/written**. Prefer date-range filters and JOIN pre-agg over `strftime` on columns and correlated `COUNT` per row.
- Blobs: R2 (`FILES`) when bound; list APIs must not return base64.
- Language: product copy Vietnamese; identifiers English; commits conventional.

```yaml
campaign_mode:
  RESEARCH_DRAFT:
    code_authorized: false
    allowed: [analysis, plan, evidence review]
  SIGNED_CAMPAIGN:
    requires: [authorized_box, product_outcome, retained_bars, scope_in_and_out, attempt_cap, stop_rules, QA_plan]
```

Missing signed authority for **behavior** change in an active campaign → **STOP**.  
Draft memos ≠ authorize.

---

## 4. Default loop

```text
strategy approve/direct → technical WAVE_CARD → lead-dev one lever → qa-agent
  → technical report-up → strategy adjudicate
```

Max **3 measured attempts** per lever class unless the box is tighter.  
`NOT_MEASURED` does not consume an attempt.

---

## 5. WAVE_CARD (before code)

```yaml
WAVE_CARD:
  directive_id:
  wave_id:
  product_problem: "<what the user sees wrong>"
  measured_owner: "<auth|projects|tasks|timesheet|leave|legal|finance|assets|dashboard|d1-query>" | UNKNOWN
  hypothesis: "<causal, falsifiable>"
  prediction:
    metric: <name>
    expected_range: <range>
    written_before_measurement: true
  falsifier: "<observation that proves hypothesis wrong>"
  one_allowed_lever: <single change> | OBSERVE_ONLY
  contracts_at_risk: [auth-rbac, finance-ssot, d1-migrations, r2-blobs]
  qa_tier: Q0 | Q1 | Q2 | Q3
  attempt_number: <n>/<cap>
  stop_rule: "<when to stop this class>"
```

Rules: `UNKNOWN` owner → observe-only. No prediction + falsifier → no code. One wave = one lever.

---

## 6. Run validity

```yaml
run_class: INVALID_ENVIRONMENT_RUN | PRODUCT_FAILURE_RUN | PRODUCT_PASS_RUN
attempt_outcome: PASS | FALSIFIED | NOT_MEASURED
```

- Unit/API harness green ≠ product PASS for screens that show money or approvals.
- Restarting wrangler/dev server = env recovery, not product remediation.

---

## 7. When strategy MUST enter

Phase/box authorize or close · report-up after Q2+ product claim · evidence vs claim mismatch ·
same class ≥2 levers or ≥3 measured attempts · cap spent · PO asks for review.

**Do not** call strategy for: self-test green with no product claim · drafting WAVE_CARD after
a clear `STRATEGY_APPROVE_EXECUTION`.

---

## 8. Technical report-up (never to PO)

```yaml
TECHNICAL_REPORT:
  wave_id:
  claimed_outcome:
  raw_evidence_paths: []
  run_classes: []
  open_gaps: []
  recommendation: APPROVE | REJECT_SELF | NEED_STRATEGY
  never: send_to_PO
```

---

## 9. PO-human channel

Only: Success Packet · Ceiling Packet · PO Visual after QA PASS · signed **scope** checkpoint.

Forbidden: Option A/B/C · harness rem · dump logs · timing-as-pass before product evidence.

Telegram (if configured) only after `STRATEGY_PO_PACKET`: short VN `Kết quả` + `PO cần`.

---

## 10. Stop conditions

No signed authority for campaign behavior change · owner unknown but product fix requested ·
same hypothesis with no new discriminator · three measured attempts in one class · box cap spent ·
valid product crash / 401/403 on required flow remains open · PO packet while precheck fails.

Do not stop merely because local D1/R2 was unbound — classify `NOT_MEASURED`, repair measurement.

---

## 11. Dispatch

Omit `model=` unless the user named a model. Strategy uses gated ladder only when the user asked.
Profiles: `.cursor/agents/*.md` if present.
