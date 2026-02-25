# Technical Debt Backlog

Updated: 2026-02-24

## P2 - Keep static OpenAPI spec up-to-date
- DEP0169 from Swagger dynamic parsing was removed from production startup by loading static spec (`config/swagger-static.json`) in production mode.
- Ongoing task:
  1. Regenerate static spec after API annotation changes: `npm run swagger:generate:static`.
  2. Commit updated `config/swagger-static.json` with route doc changes.

## P2 - Google sync call burst control monitoring
- Added client+server cooldown in this patch.
- Next sprint action:
  1. Add dashboard metric for `/api/it/google-sync` request rate and skip ratio.
  2. Alert when repeated forced sync attempts happen from same user/session.

## P2 - Backup restore drill automation
- Backup now includes local + optional offsite sync.
- Next sprint action:
  1. Add monthly scripted restore verification in staging.
  2. Persist restore report artifact.
