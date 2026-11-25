# Viva demo: 5-minute click path

Before you start: `npm run build && npm run preview`, open <http://localhost:4173/?presenter=1> on the projector
(press **T** to toggle the Engine Trace panel). On the phone, open the same URL once while online so it is cached.

## 1. Incomplete profile → answer live → status changes (1 min)
1. Presenter panel → **Load persona… → P8** (woman, 40, profile incomplete).
2. Results: "You can likely get 3 schemes". Under **Needs an answer**: PM Ujjwala and Ladli Behna.
3. PM Ujjwala asks about BPL → tap **Yes**, then the LPG question → tap **No**. The count goes to 4.
   The trace shows "PMUY: needs an answer → eligible".
4. Ladli Behna asks family income → tap **₹1 lakh to ₹2.5 lakh**. The count goes to 5, with Ladli Behna tagged
   "New registrations closed" and ranked last among eligible schemes.

## 2. Street vendor → scheme detail → print (1 min)
1. **Load persona… → P4**. Eligible: PMJJBY, PMSBY, APY, PM-SYM, plus PM SVANidhi.
2. Open **PM Shram Yogi Maan-dhan**: "Why you qualify" lists the conditions met; tick documents; note the
   Aadhaar line "Carry to the CSC; this app does not ask for it", the CSC locator link, and the source line.
3. **Print checklist** → A4, ink only, source line and printed date.

## 3. Ask (45 s)
1. Results → **Ask**. Tap "What documents do I need for PM Kisan?" → answer with a `Source · pmkisan.gov.in` chip.
2. Type "Who won the cricket match?" → "I don't have an official answer for that. Please ask at your nearest CSC."

## 4. Sahayak offline (1 min)
1. Home → tick consent → **I'm helping someone**. Tap **Add demo families** (CSC Ashta, Sehore).
2. Phone: turn on airplane mode, reload `/sahayak`. The offline banner appears; families, results and
   **Print checklists** (one page per family) still work.

## 5. Engine Lab (45 s)
1. Open `/lab`. **Run persona tests** → **112 / 112 passed** (Table 8 layout).
2. **Run benchmark** (10,000 random profiles) → total ms and ms per profile, "in this browser on this device".
3. Playground: set `gender` to `male` and watch PMUY move to Not eligible; drag the ranking sliders.

## 6. Admin 90-day flag (30 s)
Open `/admin/schemes`. "Days since verified" is amber when a source was last checked more than 90 days ago
or has not been checked yet. Open a scheme to show the rule tree, raw JSON and the source link.
