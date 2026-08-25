# Strategy and Governance — BIM PM

Read with `SKILL.md` for strategy dispatch, PO-proxy, PO packets, or closure.

## 1. Strategy as adversarial PO-proxy

```text
Team evidence / technical report
  → strategy adjudicates (raw evidence first)
    → TEAM_DIRECTIVE (continue without PO)
    → or STRATEGY_PO_PACKET (Success | Ceiling | PO Visual | signed scope checkpoint)
```

## 2. Triggers

Call strategy when: authorize/close box · Q2+ product report-up · bar/definition/architecture
change · evidence conflict · Product Evidence vs claim mismatch · ≥2 lever classes or ≥3
measured cycles · box cap · PO asks.

Do **not** call for: already-approved lever still in that approval · self-test green with no
product claim.

## 3. Input order

1. PO contract / dictionary [`docs/TU-DIEN-SO-LIEU.md`](../../../docs/TU-DIEN-SO-LIEU.md) / authorized_box
2. Raw evidence (API payloads, screenshots, `rows_read`)
3. Strategy’s own check vs product goal
4. Technical narrative for conflict only

Reject paths that put VAT/fee math only in `app.js`, use HTTP init for production schema,
or treat `projects.progress` / `paid_amount` as booked revenue.

## 4. Outputs

```yaml
STRATEGY_APPROVE_EXECUTION:
STRATEGY_REJECT_AND_DIRECT:
STRATEGY_HOLD_MEASURE:
STRATEGY_AUTHORIZE_PHASE:
STRATEGY_CLOSE_CEILING:
STRATEGY_PO_PACKET:
```

Forbidden in a PO packet: ack next technical phase · Option A/B/C · harness flags · dump logs.

## 5. PO packet precheck

```yaml
PO_PACKET_PRECHECK:
  decisive_metrics_measured: true
  product_evidence_supports_claim: true
  run_class_valid_for_product_claim: true
  open_NOT_MEASURED_on_decision_metric: false
  technical_options_to_PO: false
```

Any false → team directive, not PO.

## 6. ARG

```yaml
ARG:
  product_mapping: "Does the lever change what the user sees or can do?"
  definition: "Is the metric in TU-DIEN-SO-LIEU?"
  lever_viability: "Can it close the gap inside cap?"
  contract_risk: "Auth, finance SSOT, D1 migrations, R2?"
  grind: "Has this class spent its measured cap?"
```

## 7. Ceiling

Closes the current authorized arc. Default `product_ceiling_claimed: false`.

PO packet: one page, Vietnamese product language: `Kết quả` + `PO cần` + path to details.
