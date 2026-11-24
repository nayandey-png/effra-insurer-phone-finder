/* =============================================================================
 *  INSURER DATA: the only file you need to edit to change a number,
 *  a menu option, opening hours or a tip.
 * =============================================================================
 *
 *  After any edit, run:   npm test     (checks every path still ends at a number)
 *                 then:   npm run build (regenerates dist/ for Framer + the table)
 *
 *  HOW IT FITS TOGETHER
 *  --------------------
 *  Each insurer has:
 *    lines     The phone lines we know about. A route points at a line by its key.
 *              Change a number or its hours HERE and every route that uses that
 *              line updates, in the tool and in the SEO table.
 *    questions The questions the wizard may ask for this insurer, in the order
 *              they are asked. A question is only asked when the answer changes
 *              which route you end up on, so you never need to say *when* to ask.
 *    routes    Each route is one result card (and one row in the SEO table).
 *              `when` says which answers lead here. A list such as
 *              ["payment", "cover"] means "any of these answers".
 *              An insurer with a single route and an empty `when` skips the
 *              questions and goes straight to the result.
 *
 *  ROUTE FIELDS
 *    id                 Unique, lowercase, no spaces. Used in tests and the table.
 *    when               { questionId: answer } (see `questions` at the bottom).
 *    line               Key of a line in this insurer's `lines`.
 *    menu               Phone-menu steps, in order. A single digit "3" is shown
 *                       as "Press 3". Anything else is shown exactly as written.
 *                       [] = no menu options listed in our source.
 *    covers             (optional) What this line handles, shown on the card.
 *    tips               (optional) Extra tips for this route only.
 *    haveReady          (optional) Overrides the default "Have ready" list.
 *    transfer           (optional) true = add the "ask to be transferred" tip.
 *    alternative        (optional) { line, menu, label } A second number to offer.
 *    needsVerification  true = we made an assumption. Listed in VERIFY.md.
 *    verifyNote         Short note on what needs checking (shown in ?debug=1).
 *
 *  LINE FIELDS
 *    number     Exactly as it should be displayed.
 *    team       (optional) Team name shown under the number.
 *    hours      "24/7", or null if our source gives no hours, or a list of
 *               { days: "Mon-Fri", from: "09:00", to: "17:00" }
 *               (days: Mon Tue Wed Thu Fri Sat Sun, a range "Mon-Fri", or "Sat").
 *               Times are UK time, 24-hour clock. Bank holidays are not modelled.
 *    hoursNote  (optional) Shown when the hours can't be put in the format above.
 *    tips       (optional) Tips shown on every route that uses this line.
 *
 *  Never add a number, option, hours or a bank-holiday rule that isn't in the
 *  source document. If in doubt, set needsVerification: true.
 * ========================================================================== */

var IPF_DATA = {

  // ---------------------------------------------------------------------------
  // Shown in the tool footer AND the SEO table. Update this whenever the
  // numbers are re-checked.
  // ---------------------------------------------------------------------------
  lastChecked: "November 2026",

  // Footer disclaimer (after the date).
  disclaimer: "Numbers and menu options can change. Not affiliated with these insurers.",

  // The single Effra call to action on the result card.
  cta: {
    text: "Effra handles insurer billing and chasing for 1000+ practitioners.",
    linkText: "See how →",
    url: "https://www.effra.com/PLACEHOLDER" // TODO: replace with the real URL
  },

  // Tip used on every "Something else" route that goes to a general number.
  transferTip: "Ask the agent to transfer you to the right team.",

  // Default "Have ready" list per query type. A route can override with `haveReady`.
  haveReadyDefaults: {
    invoice:  ["Invoice number", "Patient's membership number"],
    payment:  ["Invoice number", "Patient's membership number"],
    preauth:  ["Patient's membership number"],
    cover:    ["Patient's membership number"],
    submit:   ["Invoice details", "Patient's membership number"],
    contract: [],
    details:  [],
    recoup:   ["Invoice number", "Patient's membership number"],
    other:    []
  },

  // ===========================================================================
  //  INSURERS (shown in this order, so keep them alphabetical)
  // ===========================================================================
  insurers: [

    // ------------------------------------------------------------------ ALLIANZ
    {
      id: "allianz",
      name: "Allianz",
      initials: "Al",
      lines: {
        main: { number: "+353 163 01301", hours: "24/7" },
        second: { number: "+353 160 1300", hours: null,
                  hoursNote: "Hours and purpose not listed" }
      },
      questions: [],
      routes: [
        {
          id: "allianz-all",
          when: {},
          line: "main",
          menu: [],
          haveReady: ["Patient's membership number"],
          alternative: { line: "second", menu: [], label: "Other Allianz number" },
          needsVerification: true,
          verifyNote: "Source gives no purpose for either number, and no hours for the second."
        }
      ]
    },

    // -------------------------------------------------------------------- AVIVA
    {
      id: "aviva",
      name: "Aviva",
      initials: "Av",
      lines: {
        invoicing: { number: "0800 015 0107",
                     hours: [{ days: "Mon-Fri", from: "08:00", to: "18:00" }] }
      },
      questions: [],
      routes: [
        {
          id: "aviva-invoicing",
          when: {},
          line: "invoicing",
          menu: [],
          covers: "Invoicing queries",
          tips: ["Go through your invoices one at a time."],
          haveReady: ["Invoice number", "Patient's membership number"],
          needsVerification: true,
          verifyNote: "Only invoicing is covered by our source; no number for other Aviva queries."
        }
      ]
    },

    // ---------------------------------------------------------------------- AXA
    {
      id: "axa",
      name: "AXA",
      initials: "AXA",
      lines: {
        general: {
          number: "01892 503030",
          hours: [{ days: "Mon-Fri", from: "09:00", to: "17:00" }],
          tips: ["Wait times are usually shortest between 3pm and 5pm."]
        },
        bristol: { number: "0800 854929", team: "AXA Bristol Team", hours: null },
        hol: { number: "0345 600 7696", team: "Health-on-Line Team",
               hours: [{ days: "Mon-Fri", from: "08:00", to: "18:00" }] },
        accountOther: { number: "020 4626 3233", team: "Provider account services", hours: null }
      },
      questions: ["query", "invoiceType", "policy"],
      routes: [
        // Billing & invoicing: Op 1 → Op 2
        {
          id: "axa-invoice-specific",
          when: { query: "invoice", invoiceType: "specific" },
          line: "general",
          menu: ["1", "2"],
          tips: [
            "Go through your invoices one at a time.",
            "If AXA reassesses an invoice over the phone, it usually takes about 5 days, then shows on your remittance around a month later."
          ],
          haveReady: ["Patient's policy number", "Invoice number"]
        },
        // Provider account services (invoice route)
        {
          id: "axa-invoice-account-stp",
          when: { query: "invoice", invoiceType: "account", policy: "stp" },
          line: "bristol", menu: [],
          haveReady: ["Patient's policy number", "Invoice number"],
          needsVerification: true,
          verifyNote: "No hours given for the AXA Bristol Team; no menu options given."
        },
        {
          id: "axa-invoice-account-hol",
          when: { query: "invoice", invoiceType: "account", policy: "hol" },
          line: "hol", menu: [],
          haveReady: ["Patient's policy number", "Invoice number"]
        },
        {
          id: "axa-invoice-account-other",
          when: { query: "invoice", invoiceType: "account", policy: ["other", "unknown"] },
          line: "accountOther", menu: [],
          haveReady: ["Patient's policy number", "Invoice number"],
          needsVerification: true,
          verifyNote: "No hours given for 020 4626 3233."
        },
        // Provider account services (payment / remittance route)
        {
          id: "axa-payment-stp",
          when: { query: "payment", policy: "stp" },
          line: "bristol", menu: [],
          haveReady: ["Patient's policy number", "Invoice number"],
          needsVerification: true,
          verifyNote: "Payment queries sent to account services, not Op 1 → Op 2 ('amount AXA paid'). No hours for Bristol Team."
        },
        {
          id: "axa-payment-hol",
          when: { query: "payment", policy: "hol" },
          line: "hol", menu: [],
          haveReady: ["Patient's policy number", "Invoice number"],
          needsVerification: true,
          verifyNote: "Payment queries sent to account services, not Op 1 → Op 2 ('amount AXA paid')."
        },
        {
          id: "axa-payment-other",
          when: { query: "payment", policy: ["other", "unknown"] },
          line: "accountOther", menu: [],
          haveReady: ["Patient's policy number", "Invoice number"],
          needsVerification: true,
          verifyNote: "Payment queries sent to account services, not Op 1 → Op 2. No hours for 020 4626 3233."
        },
        {
          id: "axa-cover",
          when: { query: "cover" },
          line: "general", menu: ["1", "2"],
          haveReady: ["Patient's policy number"]
        },
        {
          id: "axa-preauth",
          when: { query: "preauth" },
          line: "general", menu: ["3"],
          haveReady: ["Patient's policy number"]
        },
        {
          id: "axa-contract",
          when: { query: "contract" },
          line: "general", menu: ["2"]
        },
        {
          id: "axa-details",
          when: { query: "details" },
          line: "general", menu: ["5"],
          tips: ["AXA asks providers to make practice detail changes through Healthcode's Private Practice Register (PPR) first. Call if a change hasn't appeared in AXA's records, or a detail needs correcting."]
        },
        {
          id: "axa-recoup",
          when: { query: "recoup" },
          line: "general", menu: ["1", "3"],
          haveReady: ["Patient's policy number", "Invoice number"]
        },
        {
          id: "axa-other",
          when: { query: "other" },
          line: "general", menu: [],
          transfer: true
        }
      ]
    },

    // --------------------------------------------------------------- AXA GLOBAL
    {
      id: "axa-global",
      name: "AXA Global",
      hint: "Global = international policies",
      initials: "AXA",
      lines: {
        main: { number: "+44 (0)1892 503 856", team: "Provider team", hours: "24/7" }
      },
      questions: [],
      routes: [
        {
          id: "axa-global-all",
          when: {},
          line: "main",
          menu: ["2"],
          covers: "All provider queries (option 2 is the provider team)",
          haveReady: ["Patient's policy number"],
          needsVerification: true,
          verifyNote: "Source gives one number and option for everything; query step skipped."
        }
      ]
    },

    // --------------------------------------------------------------------- BUPA
    {
      id: "bupa",
      name: "Bupa",
      initials: "Bu",
      lines: {
        provider: { number: "0345 755 3333", team: "Provider Services Team",
                    hours: [{ days: "Mon-Fri", from: "09:00", to: "17:00" }] },
        recognition: { number: "0345 600 5422", team: "Provider recognition, contracts and agreed fees",
                       hours: [{ days: "Mon-Fri", from: "10:00", to: "16:00" }] }
      },
      questions: ["query"],
      routes: [
        { id: "bupa-invoice", when: { query: "invoice" }, line: "provider", menu: ["1"] },
        {
          id: "bupa-payment", when: { query: "payment" }, line: "provider", menu: ["1"],
          needsVerification: true,
          verifyNote: "Source lists option 1 for 'invoice queries' only; payments/remittances assumed to go there too."
        },
        { id: "bupa-preauth", when: { query: "preauth" }, line: "provider", menu: ["1"] },
        { id: "bupa-cover", when: { query: "cover" }, line: "provider", menu: ["1"] },
        { id: "bupa-contract", when: { query: "contract" }, line: "recognition", menu: [] },
        { id: "bupa-other", when: { query: "other" }, line: "provider", menu: [], transfer: true }
      ]
    },

    // -------------------------------------------------------------- BUPA GLOBAL
    {
      id: "bupa-global",
      name: "Bupa Global",
      hint: "Global = international policies",
      initials: "BG",
      lines: {
        main: { number: "01273 323563", hours: "24/7" }
      },
      questions: [],
      routes: [
        {
          id: "bupa-global-all",
          when: {},
          line: "main",
          menu: [],
          covers: "Pre-authorisation, claim information, payments and missing remittances",
          haveReady: ["Patient's membership number", "Invoice number (for claim or payment queries)"],
          needsVerification: true,
          verifyNote: "One number for everything listed; query step skipped. No patient-cover route given."
        }
      ]
    },

    // -------------------------------------------------------------------- CIGNA
    {
      id: "cigna",
      name: "Cigna",
      initials: "Ci",
      // Tips shown on EVERY Cigna result:
      tips: ["If the first agent can't help or suggests emailing, call back and you'll usually reach a different agent."],
      lines: {
        eu: { number: "01475 492145", team: "Cigna EU",
              hours: [{ days: "Mon-Fri", from: "08:00", to: "20:00" },
                      { days: "Sat", from: "09:00", to: "12:00" }] },
        individual: { number: "+44 1475 788 182", team: "Cigna Individual", hours: "24/7" },
        northAmerica: { number: "+1 800 441 2668", team: "Cigna North America", hours: null,
                        hoursNote: "Open from 1pm UK time" },
        general: { number: "+32 3 293 1811", team: "General number for UK clinics", hours: null },
        globalEmployer: { number: "+44 1475 492 197", team: "Cigna Global Employer Health (EU)", hours: null }
      },
      questions: ["memberId", "query"],
      routes: [
        {
          id: "cigna-eu-payment", when: { memberId: "eu", query: "payment" },
          line: "eu", menu: ["1"],
          haveReady: ["Patient's member ID", "Invoice number"],
          alternative: { line: "globalEmployer", menu: [], label: "For Cigna Global Employer Health policies in the EU" },
          needsVerification: true,
          verifyNote: "Placement of the Global Employer Health (EU) number is assumed."
        },
        {
          id: "cigna-eu-preauth", when: { memberId: "eu", query: "preauth" },
          line: "eu", menu: ["2"],
          haveReady: ["Patient's member ID"],
          alternative: { line: "globalEmployer", menu: [], label: "For Cigna Global Employer Health policies in the EU" },
          needsVerification: true,
          verifyNote: "Option 2 is 'pre-admission checks', read as pre-authorisation. Global Employer Health placement assumed."
        },
        {
          id: "cigna-eu-provider", when: { memberId: "eu", query: ["invoice", "cover", "other"] },
          line: "eu", menu: ["3"],
          haveReady: ["Patient's member ID"],
          alternative: { line: "globalEmployer", menu: [], label: "For Cigna Global Employer Health policies in the EU" },
          needsVerification: true,
          verifyNote: "Invoice and cover queries sent to option 3 (provider team). Global Employer Health placement assumed."
        },
        {
          id: "cigna-individual", when: { memberId: "individual" },
          line: "individual", menu: [],
          haveReady: ["Patient's member ID"]
        },
        {
          id: "cigna-north-america", when: { memberId: "northAmerica" },
          line: "northAmerica", menu: ["Extension 152 (dial #152)"],
          haveReady: ["Patient's member ID"],
          needsVerification: true,
          verifyNote: "Only 'open from 1pm UK time' is given: no closing time or days."
        },
        {
          id: "cigna-general", when: { memberId: "none" },
          line: "general", menu: [],
          needsVerification: true,
          verifyNote: "No hours given for the general number."
        }
      ]
    },

    // ------------------------------------------------------------ HEALIX HEALTH
    {
      id: "healix",
      name: "Healix Health",
      initials: "He",
      lines: {
        main: { number: "020 3376 3907",
                hours: [{ days: "Mon-Fri", from: "09:00", to: "17:00" }] }
      },
      questions: ["query"],
      routes: [
        { id: "healix-preauth", when: { query: "preauth" }, line: "main", menu: ["1"] },
        { id: "healix-invoice", when: { query: "invoice" }, line: "main", menu: ["2"] },
        {
          id: "healix-payment", when: { query: "payment" }, line: "main", menu: ["2"],
          needsVerification: true,
          verifyNote: "Option 2 is 'invoice and billing queries'; payments/remittances assumed to go there."
        },
        { id: "healix-other", when: { query: "other" }, line: "main", menu: [], transfer: true }
      ]
    },

    // ----------------------------------------------------------------- VITALITY
    {
      id: "vitality",
      name: "Vitality",
      initials: "Vi",
      lines: {
        main: { number: "0800 092 9400",
                hours: [{ days: "Mon-Fri", from: "10:00", to: "15:00" }] }
      },
      questions: ["query", "urgent"],
      routes: [
        { id: "vitality-invoice", when: { query: "invoice" }, line: "main", menu: ["3", "1"] },
        { id: "vitality-preauth-urgent", when: { query: "preauth", urgent: "yes" }, line: "main", menu: ["3", "2"] },
        { id: "vitality-preauth", when: { query: "preauth", urgent: "no" }, line: "main", menu: ["3"] },
        {
          id: "vitality-provider", when: { query: ["payment", "cover", "other"] }, line: "main", menu: ["3"],
          covers: "Other provider questions, e.g. patient cover, authorisation, remittances, invoices"
        }
      ]
    },

    // ---------------------------------------------------------------------- WPA
    {
      id: "wpa",
      name: "WPA",
      initials: "WPA",
      lines: {
        billing: { number: "01823 625278", team: "Billing & payment queries", hours: null },
        claims: { number: "01823 625000", hours: null },
        provider: { number: "01823 625170",
                    hours: [{ days: "Mon-Fri", from: "09:00", to: "16:00" }] }
      },
      questions: ["query", "invoiceCount"],
      routes: [
        {
          id: "wpa-invoice-one", when: { query: "invoice", invoiceCount: "one" },
          line: "provider", menu: ["4", "3"],
          alternative: { line: "billing", menu: ["4"], label: "Billing & payment queries line" },
          needsVerification: true,
          verifyNote: "Overlaps with 01823 625278 option 4; 625170 chosen as primary because hours are known."
        },
        {
          id: "wpa-invoice-several", when: { query: "invoice", invoiceCount: "several" },
          line: "provider", menu: ["4", "1"],
          alternative: { line: "billing", menu: ["4"], label: "Billing & payment queries line" },
          needsVerification: true,
          verifyNote: "Overlaps with 01823 625278 option 4; 625170 chosen as primary because hours are known."
        },
        {
          id: "wpa-payment", when: { query: "payment" },
          line: "billing", menu: ["4"],
          tips: ["For a payment dispute, email ageddebt@wpa.org.uk. To follow up by phone, call 01823 625170 and ask to be routed to that team."],
          needsVerification: true,
          verifyNote: "No hours for 01823 625278. No dedicated line for payment disputes."
        },
        {
          id: "wpa-preauth", when: { query: "preauth" },
          line: "provider", menu: ["2"],
          alternative: { line: "billing", menu: ["2"], label: "Billing & payment queries line" },
          needsVerification: true,
          verifyNote: "Overlaps with 01823 625278 option 2; 625170 chosen as primary."
        },
        { id: "wpa-cover", when: { query: "cover" }, line: "provider", menu: ["3"] },
        {
          id: "wpa-submit", when: { query: "submit" },
          line: "claims", menu: ["3"],
          alternative: { line: "provider", menu: ["4"], label: "Provider line (invoice query / submit invoice)" },
          needsVerification: true,
          verifyNote: "Overlaps with 01823 625170 option 4. No hours for 01823 625000."
        },
        { id: "wpa-contract", when: { query: "contract" }, line: "provider", menu: ["5"] },
        { id: "wpa-details", when: { query: "details" }, line: "provider", menu: ["6"] },
        {
          id: "wpa-other", when: { query: "other" },
          line: "provider", menu: [],
          transfer: true,
          alternative: { line: "claims", menu: ["1"], label: "For treatment or claim queries" },
          needsVerification: true,
          verifyNote: "01823 625000 option 1 (treatment/claim queries) offered as the alternative here."
        }
      ]
    }
  ],

  // ===========================================================================
  //  QUESTIONS: wording and answer options. Option `value`s are what routes
  //  use in `when`, and what appears in the shareable URL. Only change a
  //  `value` if you also change every route that uses it.
  // ===========================================================================
  questions: {
    insurer: {
      title: "Which insurer is this for?"
    },
    query: {
      title: "What do you need to do?",
      options: [
        { value: "invoice",  label: "Chase or check an invoice" },
        { value: "payment",  label: "Query a payment / remittance I can't reconcile" },
        { value: "preauth",  label: "Get pre-authorisation" },
        { value: "cover",    label: "Check patient cover / membership number" },
        { value: "submit",   label: "Submit an invoice" },
        { value: "contract", label: "Provider recognition, contract or agreed fees" },
        { value: "details",  label: "Update our practice details" },
        { value: "recoup",   label: "Overpayment / recoup request" },
        { value: "other",    label: "Something else" }
      ]
    },
    invoiceType: {
      title: "What's the invoice question?",
      shortTitle: "Invoice question",          // used in the SEO table and CSV
      options: [
        { value: "specific", label: "A question about a specific invoice",
          detail: "Its status, or an amount paid that needs explaining" },
        { value: "account",  label: "Received but not paid, or I can't reconcile it",
          detail: "Remittance queries, dropped claims, account-level payment issues" }
      ]
    },
    policy: {
      title: "What does the patient's policy number start with?",
      shortTitle: "Policy number starts with",
      options: [
        { value: "stp",     label: "STP" },
        { value: "hol",     label: "HOL" },
        { value: "other",   label: "Something else" },
        { value: "unknown", label: "Don't know" }
      ]
    },
    memberId: {
      title: "What does the member ID start with?",
      shortTitle: "Member ID starts with",
      options: [
        { value: "eu",           label: "85, 80 or 88", detail: "Cigna EU" },
        { value: "individual",   label: "9",            detail: "Cigna Individual" },
        { value: "northAmerica", label: "21",           detail: "Cigna North America" },
        { value: "none",         label: "No member ID", detail: "General number for UK clinics" }
      ]
    },
    urgent: {
      title: "Is treatment needed within 72 hours?",
      shortTitle: "Treatment needed within 72 hours",
      options: [
        { value: "yes", label: "Yes, within 72 hours" },
        { value: "no",  label: "No" }
      ]
    },
    invoiceCount: {
      title: "Is this about one invoice or several?",
      shortTitle: "Number of invoices",
      options: [
        { value: "one",     label: "One specific invoice" },
        { value: "several", label: "Several invoices" }
      ]
    }
  }
};

// (Plumbing: lets both the browser and the tests read this file. Leave as is.)
if (typeof module !== "undefined" && module.exports) { module.exports = IPF_DATA; }
else { window.IPF_DATA = IPF_DATA; }
