# SchemeConnect AI: frontend prototype (EPICS Phase I)

Tells a citizen which government schemes they can likely get, why, what documents to carry and where to apply,
in Hindi or English. Eligibility comes only from explicit rules evaluated with three-valued (Kleene) logic.
No Aadhaar, no registration, nothing stored without consent.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # engine tests: 112/112 personas, boundaries, Kleene operators, Ask
npm run build        # typecheck + production build (installable PWA)
npm run preview      # serve the build on http://localhost:4173
npm run screenshots  # needs preview running; saves Figure 10 screenshots to /screenshots
```

`npm run screenshots` uses the installed Microsoft Edge. Set `BROWSER=chromium` to use Playwright's Chromium instead.

## Routes

| Route | Screen |
|---|---|
| `/` | Onboarding: language, consent, For myself / I'm helping someone |
| `/check` | Adaptive questionnaire |
| `/results` | Grouped, ranked results |
| `/scheme/:id` | Scheme detail, document checklist, print |
| `/ask` | Assistant (Preview): answers only from the knowledge base, with a source |
| `/sahayak`, `/sahayak/family/:id` | Assisted mode for CSC operators |
| `/saved` | Opt-in saved results (30 days, on this device) |
| `/admin/schemes`, `/admin/schemes/:id` | Read-only catalogue and rule viewer |
| `/lab` | Engine Lab: persona tests, benchmark, playground |

Presenter mode: add `?presenter=1` or press **T**.

## Data access: local and http adapters

Every screen reads data through `src/api` (`SchemeApi` in `src/api/types.ts`). Two adapters share the same request and response types:

- **local** (default): `src/api/local.ts` runs the TypeScript engine (`src/engine`) on `src/data/*.json` in the
  browser. Works offline.
- **http**: `src/api/http.ts` calls a FastAPI service: `GET /schemes`, `GET /schemes/{id}`, `POST /screen`,
  `POST /next`.

Choose with environment variables (see `.env.example`):

```bash
VITE_API_MODE=http VITE_API_URL=http://localhost:8000 npm run dev
```

## Engine

`src/engine`: `evaluate.ts` (Kleene ALL/ANY/NOT), `derive.ts` (govt_employee, unorganised_worker,
vishwakarma_trade from occupation), `screen.ts` (eligible / possibly / not / already), `nextQuestion.ts` (seed
questions, then the question that can change the most undecided schemes; never one that can't change a result),
`rank.ts` (S = 0.4·V̂ + 0.3·M + 0.2·D − 0.1·A, closed schemes after open ones).

## How to add a scheme

1. Add an object to `src/data/schemes.json`. Copy an existing scheme and change:
   - `id`, `short`, `name` (`en` and `hi`), `level`, `state` (`"MP"` for MP state schemes), `category`, `need`
     (one of the results filter chips, or `null`);
   - `rule`: nodes `{ "all": [...] }`, `{ "any": [...] }`, `{ "not": node }`; leaves
     `{ "attr", "op", "value", "label": {en, hi}, "fail_label": {en, hi} }`. Ops: `eq, neq, in, lt, lte, gt, gte,
     between` (inclusive), `is_true, is_false`. `label` reads as a reason you qualify, `fail_label` as a reason you don't;
   - `benefit`, `benefit_note`, `value` (₹/year for ranking, or `null`), `how_to_apply`, `documents`
     (`kind: "aadhaar"` or `"samagra"` where relevant);
   - `source_url`, `source_label`, `last_verified` (ISO date you checked the source, or `null`),
     `enrolment_status` (`open` / `closed` / `via_survey`), `deadline`, `core_test: false`, `rule_version`.
2. Only use facts from the official source. Any field you don't know stays `null`; the UI shows "Confirm at the CSC".
3. Every `attr` used must exist in `src/data/attributes.json`. A new attribute needs a question in both languages.
4. Run `npm run chunks` to rebuild the Ask index (`src/data/chunks.json`), then `npm test`.
   The tests check that every rule attribute exists and that chunks.json is up to date.

All UI strings are in `src/locales/en.json` and `src/locales/hi.json`. Admin and Lab are internal tools and use English only.
