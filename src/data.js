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
 *    alternatives       (optional) List of other numbers to offer, each
 *                       { line, menu, label }. Shown below the main number in
 *                       a secondary "Other … lines" section.
 *    needsVerification  true = we made an assumption. Listed in VERIFY.md.
 *    verifyNote         Short note on what needs checking (shown in ?debug=1).
 *
 *  INSURER FIELDS (besides lines/questions/routes)
 *    ctaUrl     (optional) Effra page for this insurer, used by the "See how →"
 *               link. Without it, the link uses cta.defaultUrl.
 *
 *  LINE FIELDS
 *    number     Exactly as it should be displayed.
 *    team       (optional) Team name shown under the number.
 *    hours      "24/7", or null if our source gives no hours (the hours line is
 *               then hidden, with no open/closed badge), or a list of
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

  // Footer disclaimer. The footer reads "Last checked: <lastChecked>. <disclaimer>"
  // in the tool (insurer list) and in insurer-table.html.
  disclaimer: "Numbers and menu options may change. Not affiliated with these insurers.",

  // The single Effra call to action on the result card. The link goes to the
  // insurer's own Effra page (`ctaUrl` on the insurer below) when there is one,
  // otherwise to `defaultUrl`. Links open in the main page, not the iframe.
  cta: {
    text: "Still spending time on hold to insurers? Effra automates insurer billing end-to-end for 1000+ providers.",
    linkText: "See how →",
    defaultUrl: "https://www.effra.io/?lp_source=Insurer+Phone+Number+Tool"
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
        // Accepted by Effra: purpose and hours unknown.
        second: { number: "+353 160 1300", hours: null }
      },
      questions: [],
      routes: [
        {
          id: "allianz-all",
          when: {},
          line: "main",
          menu: [],
          haveReady: ["Patient's membership number"],
          alternatives: [{ line: "second", menu: [], label: "Other Allianz number" }]
        }
      ]
    },

    // -------------------------------------------------------------------- AVIVA
    {
      id: "aviva",
      name: "Aviva",
      ctaUrl: "https://www.effra.io/integrations/insurers/aviva-automated-billing-for-healthcare-providers",
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
          covers: "Invoice questions",
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
      ctaUrl: "https://www.effra.io/integrations/insurers/axa-automated-billing-for-healthcare-providers",
      initials: "AXA",
      lines: {
        general: {
          number: "01892 503030",
          hours: [{ days: "Mon-Fri", from: "09:00", to: "17:00" }],
          tips: ["Wait times are usually shortest between 3pm and 5pm."]
        },
        // Accepted by Effra: hours unknown for these two lines.
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
          haveReady: ["Patient's policy number", "Invoice number"]
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
          haveReady: ["Patient's policy number", "Invoice number"]
        },
        // Provider account services (payment / remittance route)
        {
          id: "axa-payment-stp",
          when: { query: "payment", policy: "stp" },
          line: "bristol", menu: [],
          haveReady: ["Patient's policy number", "Invoice number"],
          needsVerification: true,
          verifyNote: "Payment queries sent to account services, not Op 1 → Op 2 ('amount AXA paid')."
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
          verifyNote: "Payment queries sent to account services, not Op 1 → Op 2 ('amount AXA paid')."
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
          tips: ["AXA asks you to update your details on Healthcode's Private Practice Register (PPR) first. Call if the change hasn't reached AXA, or if a detail needs correcting."]
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
      hint: "International policies",
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
          covers: "All clinic queries",
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
      ctaUrl: "https://www.effra.io/integrations/insurers/bupa-automated-billing-for-healthcare-providers",
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
      hint: "International policies",
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
          covers: "Pre-authorisation, claims, payments and missing remittances",
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
        general: { number: "+32 3 293 1811", team: "General number for UK clinics", hours: null }
      },
      questions: ["memberId", "query"],
      routes: [
        {
          id: "cigna-eu-payment", when: { memberId: "eu", query: "payment" },
          line: "eu", menu: ["1"],
          haveReady: ["Patient's member ID", "Invoice number"]
        },
        {
          id: "cigna-eu-preauth", when: { memberId: "eu", query: "preauth" },
          line: "eu", menu: ["2"],
          haveReady: ["Patient's member ID"],
          needsVerification: true,
          verifyNote: "Option 2 is 'pre-admission checks', read as pre-authorisation."
        },
        {
          id: "cigna-eu-provider", when: { memberId: "eu", query: ["invoice", "cover", "other"] },
          line: "eu", menu: ["3"],
          haveReady: ["Patient's member ID"],
          needsVerification: true,
          verifyNote: "Invoice and cover queries sent to option 3 (provider team)."
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
      ctaUrl: "https://www.effra.io/integrations/insurers/healix-automated-billing-for-healthcare-providers",
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
      ctaUrl: "https://www.effra.io/integrations/insurers/vitality-automated-billing-for-healthcare-providers",
      initials: "Vi",
      lines: {
        main: { number: "0800 092 9400",
                hours: [{ days: "Mon-Fri", from: "10:00", to: "15:00" }] }
      },
      questions: ["query", "urgent"],
      routes: [
        { id: "vitality-invoice", when: { query: "invoice" }, line: "main", menu: ["3", "1"] },
        { id: "vitality-preauth-urgent", when: { query: "preauth", urgent: "yes" }, line: "main", menu: ["3", "2"] },
        // Confirmed by Effra (Nov 2026); source doc says option 3 only.
        { id: "vitality-preauth", when: { query: "preauth", urgent: "no" }, line: "main", menu: ["3", "3"] },
        {
          // Confirmed by Effra (Nov 2026); source doc says option 3 only.
          id: "vitality-provider", when: { query: ["payment", "cover", "other"] }, line: "main", menu: ["3", "3"],
          covers: "Most other questions, such as patient cover, authorisation, remittances and invoices"
        }
      ]
    },

    // ---------------------------------------------------------------------- WPA
    // WPA has three overlapping lines (accepted by Effra). Every route lists the
    // other two lines as alternatives so staff can try another line if needed.
    // Hours for 01823 625278 and 01823 625000 are unknown (accepted by Effra).
    {
      id: "wpa",
      name: "WPA",
      ctaUrl: "https://www.effra.io/integrations/insurers/wpa-automated-billing-for-healthcare-providers",
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
          alternatives: [
            { line: "billing", menu: ["4"], label: "Invoicing & payment queries" },
            { line: "claims",  menu: ["1"], label: "Treatment or claim queries" }
          ]
        },
        {
          id: "wpa-invoice-several", when: { query: "invoice", invoiceCount: "several" },
          line: "provider", menu: ["4", "1"],
          alternatives: [
            { line: "billing", menu: ["4"], label: "Invoicing & payment queries" },
            { line: "claims",  menu: ["1"], label: "Treatment or claim queries" }
          ]
        },
        {
          id: "wpa-payment", when: { query: "payment" },
          line: "billing", menu: ["4"],
          tips: ["For a payment dispute, email ageddebt@wpa.org.uk. To follow up by phone, call 01823 625170 and ask to be routed to that team."],
          alternatives: [
            { line: "provider", menu: ["4"], label: "Invoice queries" },
            { line: "claims",   menu: ["1"], label: "Treatment or claim queries" }
          ]
        },
        {
          id: "wpa-preauth", when: { query: "preauth" },
          line: "provider", menu: ["2"],
          alternatives: [
            { line: "billing", menu: ["2"], label: "Pre-authorisation" },
            { line: "claims",  menu: ["1"], label: "Treatment or claim queries" }
          ]
        },
        {
          id: "wpa-cover", when: { query: "cover" },
          line: "provider", menu: ["3"],
          alternatives: [
            { line: "claims",  menu: ["1"], label: "Treatment or claim queries" },
            { line: "billing", menu: [],    label: "Billing & payment queries line" }
          ]
        },
        {
          id: "wpa-submit", when: { query: "submit" },
          line: "claims", menu: ["3"],
          alternatives: [
            { line: "provider", menu: ["4"], label: "Invoice query or submitting an invoice" },
            { line: "billing",  menu: ["4"], label: "Invoicing & payment queries" }
          ]
        },
        {
          id: "wpa-contract", when: { query: "contract" },
          line: "provider", menu: ["5"],
          alternatives: [
            { line: "billing", menu: [], label: "Billing & payment queries line" },
            { line: "claims",  menu: [], label: "Treatment, claims and invoice submission line" }
          ]
        },
        {
          id: "wpa-details", when: { query: "details" },
          line: "provider", menu: ["6"],
          alternatives: [
            { line: "billing", menu: [], label: "Billing & payment queries line" },
            { line: "claims",  menu: [], label: "Treatment, claims and invoice submission line" }
          ]
        },
        {
          id: "wpa-other", when: { query: "other" },
          line: "provider", menu: [],
          transfer: true,
          alternatives: [
            { line: "claims",  menu: ["1"], label: "Treatment or claim queries" },
            { line: "billing", menu: [],    label: "Billing & payment queries line" }
          ]
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
        { value: "payment",  label: "A payment or remittance doesn't add up" },
        { value: "preauth",  label: "Get pre-authorisation" },
        { value: "cover",    label: "Check a patient's cover or membership number" },
        { value: "submit",   label: "Submit an invoice" },
        { value: "contract", label: "Our contract, agreed fees or provider recognition" },
        { value: "details",  label: "Update our practice details" },
        { value: "recoup",   label: "The insurer overpaid us or wants money back (recoup)" },
        { value: "other",    label: "Something else" }
      ]
    },
    invoiceType: {
      title: "Which best describes it?",
      shortTitle: "Invoice question",          // used in the SEO table and CSV
      options: [
        { value: "specific", label: "Check where an invoice is up to, or ask about an amount AXA paid" },
        { value: "account",  label: "Something's gone wrong: an invoice is overdue, a remittance doesn't add up, or a claim has gone missing" }
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
        { value: "eu",           label: "85, 80 or 88", detail: "Europe" },
        { value: "individual",   label: "9",            detail: "Individual policy" },
        { value: "northAmerica", label: "21",           detail: "North America" },
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
