---
name: iso-19650-reference
model: composer-2.5-fast
description: >-
  Tham chiếu ISO 19650 / đặt tên file model HSTK của BIM Project Management —
  parseBepFileName, folder gói YYMMDD, cột role_codes. Dùng kèm
  @technical-advisor hoặc @lead-dev. Model: Composer. Readonly.
readonly: true
---

# ISO 19650 Reference

Quick reference for model-file naming in this app (HSTK / BEP). Read when design
packages, model filenames, or CDE deliverable names are in scope.

**Dispatch:** `@Task(iso-19650-reference)` · **cấm** `model=` · Composer từ frontmatter.

Parser: `parseBepFileName` in `src/design.ts`. Extension is stripped first
(`.rvt`, `.nwc`, `.ifc`, `.dwg`, `.pdf`, `.nwd`, `.nwf`). The base name needs at
least seven hyphen-separated fields. Field 7 is 4–6 digits. Extra fields join as
the description.

## Container naming

```
[Project]-[Originator]-[Volume]-[Level]-[Type]-[Role]-[Number]-[Description]
```

| Field | Parser key | Example `TT09-OAD-HZ-BF-M3-A-0001-HAM TT.rvt` |
|-------|------------|------------------------------------------------|
| Project | `project` | `TT09` |
| Originator | `originator` | `OAD` |
| Volume | `volume` | `HZ` |
| Level | `level` | `BF` |
| Type | `type` (uppercased) | `M3` |
| Role | `role` (uppercased) | `A` |
| Number | `number` (4–6 digits) | `0001` |
| Description | `description` | `HAM TT` |

`type` values the scanner treats as models include `M2`, `M3`, and `CM`. A name with fewer than seven fields, or a number field that is not 4–6 digits, returns `{ error }` (`too_few_fields`, `invalid_number_field`, or `empty`).

`project` is checked against `projects.code`, `projects.project_code_letter`, and outgoing `letter_number` (`modelBepProjectCodeMismatch`). It is not a free label.

## Package folder

A design package folder is `YYMMDD-Mô tả` (underscore also parses): `parseYyMmDdFolder`, pattern `^(\d{6})[-_](.+)$`.

Example: `260915-Phát hành TKCS` → date `2026-09-15`, description `Phát hành TKCS`.

Invalid month/day (for example `261345-x`) does not parse. Revision labels (`R0`, `R1`, …) are assigned by package date, then folder name (`assignRevisionNumbers`).

## Discipline `role_codes`

`project_design_disciplines.role_codes` is a comma-separated list on the discipline row (fallback: `discipline_code`). `parseBepFileName().role` matches that list through `roleInCodes` (case-insensitive, exact code). Example: role `EM` matches `HVAC,EM`.

## Status / suitability

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

- Fewer than seven hyphen fields, or number field not 4–6 digits
- `role` absent from the discipline `role_codes`
- Package folder that is not `YYMMDD-Mô tả` (or `YYMMDD_Mô tả`)
- `project` token that matches neither project code nor an outgoing letter number
- Missing originator or revision
- WIP edits treated as Published
- Inconsistent discipline codes across federated models
- Deliverables without EIR/PIR traceability
