# Fase 1 live test results — P1.3 tool-calling `ai-assistant`

Run: 2026-09-22, branch `feature/concierge-backend`, via `scripts/live_test_runner.sh` →
`scripts/test-tools.sh` (docs/RUN_ON_MAC.md §3b). No secrets in this file or in the raw log.

**Result: all green — `passed: 22   failed: 0`, exit code `0`.**

Coverage note: `OTHER_CENTER_ID` and `OPERATOR_ACCESS_TOKEN` were not set for this run, so the
cross-center-403 and non-owner-role-scoping checks were skipped (owner-only path fully covered).
Re-run with those two set before closing out P1.3 to cover role scoping end-to-end.

## Verdict on the two risky points

### 1. Gateway streams `tool_calls` for the chat model the way `llm.ts` expects

**Confirmed.** The natural-language round trip (`Come sta andando il mio centro questa
settimana? ...`) produced a tool call the SSE parser correctly decoded:

```
tools the model called: get_center_kpi
```

The model's final answer quotes real numbers pulled from that tool's result (scontrino medio,
clienti dormienti, etc. for "Centro Estetico Aurora"), which is only possible if `llm.ts`
correctly reassembled the streamed `tool_calls` fragments (by `index`, no `id` guaranteed) into
a complete function call before the agent loop executed it. Fragment reassembly is not a
degenerate no-op here — a single tool was called, so the risk of interest (multi-fragment /
multi-tool assembly) is only partially exercised by this run.

### 2. Forced tool-less final call (history has `tool_calls`, request omits `tools`) is accepted by the gateway

**Confirmed.** After the tool call above, the agent loop makes its forced-final model call
with no `tools` array in the request. The stream:

- ended with `data: [DONE]` (`stream ends with [DONE]`: PASS)
- contained **no** in-band `"type":"error"` frame (`no in-band error frame`: PASS)
- delivered real answer text (`final answer text streamed (1732 chars)`: PASS)

If the gateway had rejected the tool-less follow-up (e.g. because the history still references
`tool_calls` /  `role: "tool"` messages), this would have surfaced as an in-band error frame or a
truncated/empty answer. Neither happened.

## Other checks in this run

- Auth/validation: missing auth (401), garbage JWT (401), malformed `centerId` (400), oversized
  body (413), client-injected `system` role (400) — all PASS.
- Direct-mode tools: `get_center_kpi`, `simulate_goal` (happy path + 3 validation-error cases),
  `list_appointments` (today / explicit day / malformed day), `get_center_profile`,
  `get_protocol` (happy path + too-short name), unknown-tool handling, smuggled `center_id`
  argument rejection — all PASS. In particular: no tool response leaked a raw `center_id`
  (`get_center_kpi` data has no `center_id` key), matching the "tools never take/see tenant ids"
  rule in `docs/CONCIERGE_TOOLS.md`.

## Not covered by this run

- Cross-center isolation (403 for a center the user isn't a member of) and non-owner role
  scoping (owner-only tools refused for an operator/receptionist) — both skipped because
  `OTHER_CENTER_ID` / `OPERATOR_ACCESS_TOKEN` weren't provided.
- Multi-tool / multi-fragment `tool_calls` reassembly in a single turn — this run's chat round
  trip only triggered one tool call.
