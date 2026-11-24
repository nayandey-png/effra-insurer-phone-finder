# Items to verify with the billing team

Source: *Insurer_phone_number_comparison.docx*. Every number, menu option and opening time in `src/data.js` comes from that document; `npm test` fails if a number appears that isn't in it.

Where the source was ambiguous or overlapping, I picked the most sensible primary route and set `needsVerification: true` on it. You can see all of them highlighted in yellow at `index.html?debug=1`.

**To confirm an item:** check it, adjust `src/data.js` if needed, then remove `needsVerification`/`verifyNote` from that route and tick it off here.

## Product decisions (confirmed by Effra)
- [x] **Unsupported query types are hidden.** Each insurer only shows the query types its data covers. Every insurer with more than one route also offers **"Something else"**, which goes to the general number with the tip "Ask the agent to transfer you to the right team".
- [x] **Single-number insurers skip the "What do you need to do?" step:** Allianz, AXA Global, Bupa Global and Aviva. The result card says what the line handles.
- [x] **Last checked:** November 2026.

## Allianz
- [ ] `allianz-all`: the source gives two numbers and no purpose for either. +353 163 01301 (24/7) is primary. +353 160 1300 is shown as "Other Allianz number" with "Hours and purpose not listed".
- [ ] The number format "+353 163 01301" is unusual for an Irish number. It's kept exactly as written (dialled as +35316301301). Please confirm the digits.

## Aviva
- [ ] `aviva-invoicing`: the only Aviva number covers invoicing. Our source has no Aviva number for pre-auth, cover and other queries, so none is shown.

## AXA
- [ ] **Invoice vs account services overlap.** Op 1 → Op 2 covers "an amount AXA paid that you need explained". Provider account services covers "a payment amount you cannot reconcile". So:
  - "Chase or check an invoice" asks a follow-up. "A specific invoice (status, or an amount paid)" goes to 01892 503030, Op 1 → Op 2. "Received but not paid / can't reconcile / remittance / dropped claims" goes to account services, which asks for the policy prefix.
  - "Query a payment / remittance I can't reconcile" goes **straight to account services** (`axa-payment-stp`, `axa-payment-hol`, `axa-payment-other`).
- [ ] `axa-invoice-account-stp`, `axa-payment-stp`: no hours are given for 0800 854929 (AXA Bristol Team). The card shows "Hours not listed" and no open/closed badge.
- [ ] `axa-invoice-account-other`, `axa-payment-other`: no hours for 020 4626 3233. Policy prefix "Something else" and "Don't know" both go here, as the source says.
- [ ] **"Shortest wait times 3–5pm"** appears after the account-services block in the doc. I applied it to the general number 01892 503030 routes only, not to the STP, HOL or 020 numbers.
- [ ] "Check patient cover / membership number" goes to Op 1 → Op 2. The source groups "confirming membership number" with billing.
- [ ] No route for submitting an invoice, so that option is hidden for AXA.
- [ ] The reassessment tip ("about 5 days, then on the remittance around a month later") is on the specific-invoice route only.

## AXA Global
- [ ] `axa-global-all`: one number with option 2 (provider team) for every query. The source doesn't split it by query type.

## Bupa
- [ ] `bupa-payment`: the source lists option 1 for "invoice queries, pre-auth & treatment cover questions". I assumed payment/remittance queries go there too.
- [ ] No Bupa routes for submitting an invoice, practice details or overpayments, so those options are hidden.

## Bupa Global
- [ ] `bupa-global-all`: one 24/7 number covering pre-auth, claim info, payments and missing remittances. There's no menu and no patient-cover route.

## Cigna
- [ ] **Order of questions:** Cigna asks for the member ID first because that decides the number. Only the 85/80/88 (EU) line has a menu, so only that path asks what you need to do.
- [ ] `cigna-eu-preauth`: option 2 is "pre-admission checks", read as pre-authorisation.
- [ ] `cigna-eu-provider`: invoice, cover and "Something else" queries on the EU line go to option 3 (provider team).
- [ ] **Global Employer Health (EU), +44 1475 492 197:** the source doesn't say when to use it. I show it as an alternative on all three EU-line routes, labelled "For Cigna Global Employer Health policies in the EU". It has no hours.
- [ ] `cigna-north-america`: the only hours given are "open from 1pm UK time", with no closing time or days, so there's no open/closed badge. The menu step is shown as "Extension 152 (dial #152)".
- [ ] `cigna-general`: no hours given for +32 3 293 1811.
- [ ] Cigna has no "Something else" on the query step except via the EU line. "No member ID" is the general route.

## Healix Health
- [ ] `healix-payment`: option 2 is "invoice and billing queries". I assumed payment/remittance queries go there.

## Vitality
- [ ] "Option 3 then 1 for a submitted invoice" is read as chasing an invoice you've already submitted, not submitting one. "Submit an invoice" is hidden for Vitality.
- [ ] "Query a payment", "Check patient cover" and "Something else" all go to option 3 ("other provider questions, e.g. patient cover, authorisation, remittances, invoices").

## WPA (three overlapping lines)
- [ ] **Primary line:** 01823 625170 is primary wherever it has a matching option, because it's the only WPA line with hours (Mon–Fri 9am–4pm).
- [ ] `wpa-invoice-one` / `wpa-invoice-several`: I added a follow-up, "One invoice or several?", because 625170 option 4 splits into 4 → 3 for a specific invoice and 4 → 1 for multiple invoices. The alternative is 01823 625278 option 4.
- [ ] `wpa-payment`: 01823 625278 option 4 ("invoicing & payment queries"). It has no hours. The payment-dispute route (email ageddebt@wpa.org.uk, or call 01823 625170 and ask to be routed) is shown as a tip.
- [ ] `wpa-preauth`: 625170 option 2, with 625278 option 2 as the alternative.
- [ ] `wpa-submit`: 01823 625000 option 3 ("submitting invoice"), with 625170 option 4 as the alternative. 625000 has no hours.
- [ ] `wpa-other`: 625170 general, with "ask to be transferred". The alternative is 01823 625000 option 1 for treatment or claim queries. That option isn't mapped as a primary route anywhere else.
- [ ] No WPA route for overpayments, so that option is hidden.

## Not modelled (by design)
- Bank holidays: the source gives no rule, so the badge uses the usual weekly hours and says "Usual hours, UK time".
