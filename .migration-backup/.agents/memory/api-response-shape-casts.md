---
name: apiGet unchecked casts hide shape drift
description: Frontend api.ts helpers cast responses with no runtime validation, so API/frontend shape mismatches pass typecheck and break at runtime.
---

# apiGet/apiPost cast responses without validation

`artifacts/britishce44/src/lib/api.ts` helpers (`apiGet<T>`, `apiPost<T>`, etc.) use an unchecked generic cast on the parsed JSON. The compiler trusts whatever type you pass — it does **not** verify the server actually returns that shape.

**Why:** A teacher-eval bug shipped where `GET /v1/eval/sheet/:id` returned `days` as objects `{day,en,ar}[]` while the frontend typed `EvalGrid.days` as `number[]`. Typecheck stayed green; at runtime the weekly grid used objects as cell keys (all collapsed to `"[object Object]"`), so every day column read/wrote the same cell and saves sent `day: NaN`. Pure column layout (hardcoded day=0) was unaffected, so it slipped past smoke tests that only exercised Table 1.

**How to apply:** When you add or change any eval/report API field, confirm the server JSON shape against the frontend type by curl-ing the live endpoint (use the api-server's actual running port from its workflow log / $REPLIT_DEV_DOMAIN path — it is system-assigned, not fixed) — do not trust typecheck alone. Keep the contract simple: the eval grid `days` field is numeric day codes (getUTCDay: Sat=6,Sun=0,Mon=1..Thu=4); the frontend maps them to labels via its local `DAY_LABELS`. Always exercise BOTH layouts (columns + weekly) end-to-end after touching eval grid code.
