# AGENTS.md

This file defines working rules for human and AI contributors in this repository.

## Source of truth files

Use these files as authoritative for rewrite planning and execution:

1. `/Users/justin.smethers/GitHub/CorsixTH/docs/architecture/typescript-web-rewrite-plan.md`
   - Phase scope, exit criteria, quality gates, decision log, checkpoint log, risk register, active next steps.
2. `/Users/justin.smethers/GitHub/CorsixTH/docs/architecture/runtime-flow.md`
   - Runtime sequencing and integration flow expectations.
3. `/Users/justin.smethers/GitHub/CorsixTH/web/docs/parity-specs/`
   - Parity scenario definitions and expectations per phase/subsystem.
4. `/Users/justin.smethers/GitHub/CorsixTH/web/docs/milestone-reports/`
   - Validation evidence and checkpoint closeout records.

If there is a conflict, treat the rewrite plan as the primary source and record any correction as an explicit decision log update.

## Execution rules

1. Work only on the currently authorized phase.
2. Do not start the next phase until all current phase exit criteria and quality gates pass.
3. Follow test-first: add or update tests that lock behavior before implementation changes.
4. Keep changes small and reviewable.

## Required documentation updates during work

Update documentation as work is done, not at the end:

1. Add decision log entries for architecture/scope decisions.
2. Update checkpoint log status when gates are run or closed.
3. Open/close risks in the risk register as new risks appear or are mitigated.
4. Keep "Active next steps" current after each meaningful milestone.
5. Update parity specs when scenario coverage changes.
6. Add milestone report evidence for validation commands and outcomes.

## Pre-handoff checklist

Before handing work off:

1. Confirm implementation matches source-of-truth docs (or docs were updated to reflect approved decisions).
2. Confirm required tests and gates for the active phase pass.
3. Confirm evidence links and logs are updated in the plan/milestone docs.
