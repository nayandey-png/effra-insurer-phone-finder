# Items to verify with the billing team

Source: *Insurer_phone_number_comparison.docx*. Every number, menu option and opening time in `src/data.js` comes from that document, except the corrections Effra confirmed (listed below).

`npm test` fails if:
- a number appears that isn't in the source;
- a source number is missing without being on the test's explicit exclusion list.

Open items still carry `needsVerification: true` in `src/data.js` and are highlighted in yellow at `index.html?debug=1`.

**To confirm an item:** check it, adjust `src/data.js` if needed, then remove `needsVerification`/`verifyNote` from that route and tick it off here.

## Product decisions (confirmed by Effra)
- [x] **Unsupported query types are hidden.** Each insurer only shows the query types its data covers. Every insurer with more than one route also offers **"Something else"**, which goes to the general number with the tip "Ask the agent to transfer you to the right team".
- [x] **Single-number insurers skip the "What do you need to do?" step:** Allianz, AXA Global, Bupa Global and Aviva. The result card says what the line handles.
- [x] **Unknown opening hours are omitted.** Where the source gives no hours, the result card has no hours line and no open/closed badge, and the table and CSV hours cell is left empty. Cigna North America keeps its partial note, "Open from 1pm UK time".
- [x] **Last checked:** November 2026.

## Corrections confirmed by Effra (differ from source doc)
- [x] `vitality-preauth` (pre-auth **not** needed within 72 hours): **Press 3 → 3**. The source doc says option 3 only. *Confirmed by Effra, differs from source doc.*
- [x] `vitality-provider` (query a payment / check patient cover / something else): **Press 3 → 3**. The source doc says option 3 only. *Confirmed by Effra, differs from source doc.*

## Accepted by Effra
- [x] **Allianz +353 160 1300:** accepted: purpose and hours unknown. It's kept as the "Other Allianz number" alternative, with no hours line.
- [x] **AXA 0800 854929 (STP, AXA Bristol Team) and 020 4626 3233 (other / don't know):** accepted: hours unknown. The hours line is hidden.
- [x] **WPA:** accepted: WPA has overlapping lines. Routing is unchanged. Every WPA result shows its main number, then the other two WPA lines in a secondary "Other WPA lines" section, collapsed on mobile. The payment card keeps the disputes tip (email ageddebt@wpa.org.uk, or call 01823 625170 and ask to be routed).
- [x] **WPA 01823 625278 and 01823 625000:** accepted: hours unknown. The hours line is hidden.
- [x] **Cigna Global Employer Health (EU), +44 1475 492 197:** removed from the tool, table and CSV at Effra's request. It's on the test's `EXCLUDED_SOURCE_NUMBERS` list with the reason, and the test fails if it reappears.

## Open: awaiting billing-team confirmation

### Allianz
- [ ] The number format "+353 163 01301" is unusual for an Irish number. It's kept exactly as written (dialled as +35316301301). Please confirm the digits.

### Aviva
- [ ] `aviva-invoicing`: the only Aviva number covers invoicing. Our source has no Aviva number for pre-auth, cover and other queries, so none is shown.

### AXA
- [ ] **Payment vs invoice overlap** (`axa-payment-stp`, `axa-payment-hol`, `axa-payment-other`). Op 1 → Op 2 covers "an amount AXA paid that you need explained". Provider account services covers "a payment amount you cannot reconcile". So:
  - "Chase or check an invoice" asks a follow-up. "Check where an invoice is up to, or ask about an amount AXA paid" goes to 01892 503030, Op 1 → Op 2. "Something's gone wrong: an invoice is overdue, a remittance doesn't add up, or a claim has gone missing" goes to account services, which asks for the policy prefix.
  - "A payment or remittance doesn't add up" goes **straight to account services**.
- [ ] **"Shortest wait times 3–5pm"** appears after the account-services block in the doc. I applied it to the general number 01892 503030 routes only.
- [ ] "Check patient cover / membership number" goes to Op 1 → Op 2. The source groups "confirming membership number" with billing.
- [ ] No route for submitting an invoice, so that option is hidden for AXA.
- [ ] The reassessment tip ("about 5 days, then on the remittance around a month later") is on the specific-invoice route only.

### AXA Global
- [ ] `axa-global-all`: one number with option 2 (provider team) for every query. The source doesn't split it by query type.

### Bupa
- [ ] `bupa-payment`: the source lists option 1 for "invoice queries, pre-auth & treatment cover questions". I assumed payment/remittance queries go there too.
- [ ] No Bupa routes for submitting an invoice, practice details or overpayments, so those options are hidden.

### Bupa Global
- [ ] `bupa-global-all`: one 24/7 number covering pre-auth, claim info, payments and missing remittances. There's no menu and no patient-cover route.

### Cigna
- [ ] **Order of questions:** Cigna asks for the member ID first because that decides the number. Only the 85/80/88 (EU) line has a menu, so only that path asks what you need to do.
- [ ] `cigna-eu-preauth`: option 2 is "pre-admission checks", read as pre-authorisation.
- [ ] `cigna-eu-provider`: invoice, cover and "Something else" queries on the EU line go to option 3 (provider team).
- [ ] `cigna-north-america`: the only hours given are "open from 1pm UK time", with no closing time or days, so there's no open/closed badge. The menu step is shown as "Extension 152 (dial #152)".
- [ ] `cigna-general`: no hours given for +32 3 293 1811, so the hours line is hidden.

### Healix Health
- [ ] `healix-payment`: option 2 is "invoice and billing queries". I assumed payment/remittance queries go there.

### Vitality
- [ ] "Option 3 then 1 for a submitted invoice" is read as chasing an invoice you've already submitted, not submitting one. "Submit an invoice" is hidden for Vitality.

### WPA
- [ ] No WPA route for overpayments, so that option is hidden.

## Not modelled (by design)
- Bank holidays: the source gives no rule, so the badge uses the usual weekly hours and says "Usual hours, UK time".
