# Technical Debt Backlog

Updated: 2026-02-24

## P1 - Deprecated `url.parse` warning (DEP0169)
- Symptom: Node prints `DEP0169` in runtime logs.
- Current impact: No runtime outage, but deprecated API may be removed in future Node versions.
- Likely source: Third-party dependency (no direct `url.parse` usage found in project code).
- Next sprint action:
  1. Run backend with `node --trace-deprecation server.js` in staging.
  2. Identify exact package/file emitting `url.parse`.
  3. Upgrade or replace dependency.
  4. Re-test auth, proxy, and route parsing.

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
