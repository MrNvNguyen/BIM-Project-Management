---
name: iso-19650-reference
model: composer-2.5-fast
description: >-
  Tham chiếu ISO 19650 / CDE naming cho tài liệu & deliverable Forma/ACC Docs —
  dùng kèm @technical-advisor hoặc @lead-dev. Model: Composer. Readonly.
readonly: true
---

# ISO 19650 Reference

Quick reference for CDE and documentation naming. Read when CDE or deliverable naming
is in scope (Forma Data Management / ACC Docs paths, evidence folders, campaign docs).

**Dispatch:** `@Task(iso-19650-reference)` · **cấm** `model=` · Composer từ frontmatter.

## Container Naming

```
[Project]-[Originator]-[Volume/System]-[Level/Location]-[Type]-[Role/Number]
```

| Segment | Example |
|---------|---------|
| Project | `ONEX`, `FORMA` |
| Originator | `ARC`, `STR`, `MEP`, `DOC` |
| Volume/System | `BLDG-A`, `ZONE-01` |
| Level/Location | `L02`, `CORE` |
| Type | `DR`, `SK`, `RP`, `SC` |
| Role/Number | `GA-001` |

Example: `ONEX-DOC-ZONE-01-L02-SC-COPY-001` (scenario / copy job artifact)

## Status / Suitability

| Code | Meaning |
|------|---------|
| S0 | WIP |
| S1 | Suitable for Coordination (Shared) |
| S2 | Suitable for Information (Published) |
| A1–A4 | Approved for stage |
| B1–B2 | Partial sign-off |

## CDE states

```
WIP → Shared → Published → Archived
```

Map loosely to this repo:

- WIP: `0 Documents/1 - Thaoluan/**`
- Shared/Published: signed campaign under `1-Sprints` (when created)
- Do not treat research memos as Published product authority

## Metadata minimum

Revision · Status code · Originator · Classification · Created/Modified + author

## Flag

- Skip Shared before Published
- Missing originator/revision
- WIP edits in Published
- Inconsistent discipline codes across federated models
- Deliverables without EIR/PIR traceability
- Confusing Docs “Approved” (Reviews workflow) with PDF sheet `reviewStatus`
