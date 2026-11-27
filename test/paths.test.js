"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var E = require("../src/engine.js");
var build = require("../build.js");
var D = E.DATA;

// Every phone number in the source document (Insurer_phone_number_comparison.docx), as written there.
// If you add a number to src/data.js, add it here too, which is a deliberate second check.
var SOURCE_NUMBERS = [
  "0800 092 9400", "01273 323563", "01892 503030", "0800 854929", "0345 600 7696", "020 4626 3233",
  "+44 (0)1892 503 856", "0345 755 3333", "0345 600 5422", "01823 625278", "01823 625000", "01823 625170",
  "0800 015 0107", "+353 163 01301", "+353 160 1300", "01475 492145", "+44 1475 788 182", "+1 800 441 2668",
  "+32 3 293 1811", "+44 1475 492 197", "020 3376 3907"
];
// Numbers in the source document that are deliberately NOT in the tool, table or CSV.
// Each needs a reason. The checks below make sure they stay out.
var EXCLUDED_SOURCE_NUMBERS = {
  // Cigna Global Employer Health (EU). Removed at Effra's request (Nov 2026):
  // the source doesn't say when clinics should use it.
  "+44 1475 492 197": "Removed by Effra: usage unclear"
};
var digits = function (s) { return s.replace(/\(0\)/g, "").replace(/\D/g, ""); };

function deepStrings(obj, out) {
  out = out || [];
  if (typeof obj === "string") out.push(obj);
  else if (Array.isArray(obj)) obj.forEach(function (x) { deepStrings(x, out); });
  else if (obj && typeof obj === "object") Object.keys(obj).forEach(function (k) {
    if (k === "line") return; // raw line object, checked separately
    var v = obj[k];
    assert.notEqual(v, undefined, "undefined field " + k);
    if (typeof v === "number") assert.ok(!isNaN(v), "NaN field " + k);
    deepStrings(v, out);
  });
  return out;
}

var paths = E.enumeratePaths();

test("every path ends at a result with a number (no dead ends)", function () {
  assert.ok(paths.length > 0);
  paths.forEach(function (p) {
    var label = JSON.stringify(p.state);
    assert.equal(p.step.type, "result", "path " + label + " → " + (p.step.message || p.step.type));
    var r = p.step.result;
    assert.ok(r.main.number && r.main.number.trim(), "no number on " + label);
    assert.match(r.main.tel, /^tel:\+?\d{6,15}$/, "bad tel on " + label);
    deepStrings(r).forEach(function (s) {
      assert.ok(!/\bundefined\b|\bnull\b|\bNaN\b/.test(s), "bad value '" + s + "' on " + label);
    });
    r.alternatives.forEach(function (a) { assert.match(a.tel, /^tel:\+?\d{6,15}$/); });
  });
});

test("every route is reachable, and each path matches exactly one route", function () {
  var reached = {};
  paths.forEach(function (p) { reached[p.step.result.routeId] = true; });
  E.allRoutes().forEach(function (x) { assert.ok(reached[x.route.id], "unreachable route " + x.route.id); });
});

test("route ids are unique and lines/questions referenced exist", function () {
  var seen = {};
  D.insurers.forEach(function (ins) {
    ins.questions.forEach(function (q) { assert.ok(D.questions[q], ins.id + ": unknown question " + q); });
    ins.routes.forEach(function (r) {
      assert.ok(!seen[r.id], "duplicate route id " + r.id); seen[r.id] = true;
      assert.match(r.id, /^[a-z0-9-]+$/);
      assert.ok(ins.lines[r.line], r.id + ": unknown line " + r.line);
      assert.ok(Array.isArray(r.menu), r.id + ": menu must be a list");
      assert.equal(r.alternative, undefined, r.id + ": use `alternatives: [...]`, not `alternative`");
      (r.alternatives || []).forEach(function (a) {
        assert.ok(ins.lines[a.line], r.id + ": unknown alternative line " + a.line);
        assert.notEqual(a.line, r.line, r.id + ": alternative repeats the main line");
      });
      if (r.needsVerification) assert.ok(r.verifyNote, r.id + ": needsVerification without verifyNote");
      Object.keys(r.when).forEach(function (q) {
        assert.ok(ins.questions.indexOf(q) !== -1, r.id + ": when uses question not in insurer.questions: " + q);
        [].concat(r.when[q]).forEach(function (v) {
          assert.ok(D.questions[q].options.some(function (o) { return o.value === v; }), r.id + ": unknown answer " + q + "=" + v);
        });
      });
    });
  });
});

test("every question shown has at least one option, and multi-route insurers offer 'Something else'", function () {
  D.insurers.forEach(function (ins) {
    var first = E.getStep({ insurer: ins.id });
    if (ins.routes.length === 1) { assert.equal(first.type, "result", ins.id + " should skip straight to result"); return; }
    assert.equal(first.type, "question");
    var hasOther = paths.some(function (p) { return p.state.insurer === ins.id && (p.state.query === "other" || p.state.memberId === "none"); });
    assert.ok(hasOther, ins.id + " has no 'Something else' / general route");
  });
});

test("insurer list is alphabetical and Bupa/AXA Global are separate", function () {
  var names = D.insurers.map(function (i) { return i.name.toLowerCase(); });
  assert.deepEqual(names, names.slice().sort());
  ["axa", "axa-global", "bupa", "bupa-global"].forEach(function (id) { assert.ok(E.getInsurer(id)); });
});

test("no number in the data that isn't in the source document, and none missing", function () {
  var dataNumbers = [];
  D.insurers.forEach(function (ins) { Object.keys(ins.lines).forEach(function (k) { dataNumbers.push(ins.lines[k].number); }); });
  var src = SOURCE_NUMBERS.map(digits);
  dataNumbers.forEach(function (n) { assert.ok(src.indexOf(digits(n)) !== -1, "number not in source: " + n); });
  var excluded = Object.keys(EXCLUDED_SOURCE_NUMBERS).map(digits);
  excluded.forEach(function (n) { assert.ok(src.indexOf(n) !== -1, "excluded number isn't in the source list: " + n); });
  SOURCE_NUMBERS.forEach(function (n) {
    var inData = dataNumbers.some(function (d) { return digits(d) === digits(n); });
    if (excluded.indexOf(digits(n)) !== -1) assert.ok(!inData, "excluded number is back in the data: " + n);
    else assert.ok(inData, "source number missing from data: " + n);
  });
});

test("spot checks against the source document", function () {
  function res(state) { var s = E.getStep(state); assert.equal(s.type, "result", JSON.stringify(state)); return s.result; }
  var r = res({ insurer: "axa", query: "invoice", invoiceType: "account", policy: "hol" });
  assert.equal(r.main.number, "0345 600 7696"); assert.equal(r.main.hoursText, "Mon–Fri 8am–6pm");
  assert.deepEqual(res({ insurer: "axa", query: "recoup" }).main.menu, ["Press 1", "Press 3"]);
  assert.deepEqual(res({ insurer: "vitality", query: "preauth", urgent: "yes" }).main.menu, ["Press 3", "Press 2"]);
  assert.equal(res({ insurer: "cigna", memberId: "none" }).main.number, "+32 3 293 1811");
  assert.deepEqual(res({ insurer: "cigna", memberId: "eu", query: "payment" }).main.menu, ["Press 1"]);
  assert.deepEqual(res({ insurer: "healix", query: "preauth" }).main.menu, ["Press 1"]);
  assert.deepEqual(res({ insurer: "wpa", query: "invoice", invoiceCount: "several" }).main.menu, ["Press 4", "Press 1"]);
  assert.equal(res({ insurer: "bupa", query: "contract" }).main.hoursText, "Mon–Fri 10am–4pm");
  // Corrections confirmed by Effra (differ from source doc):
  assert.deepEqual(res({ insurer: "vitality", query: "preauth", urgent: "no" }).main.menu, ["Press 3", "Press 3"]);
  ["payment", "cover", "other"].forEach(function (q) {
    assert.deepEqual(res({ insurer: "vitality", query: q }).main.menu, ["Press 3", "Press 3"], "vitality " + q);
  });
  assert.equal(res({ insurer: "cigna", memberId: "eu", query: "payment" }).alternatives.length, 0);
  assert.ok(res({ insurer: "wpa", query: "payment" }).tips.some(function (t) { return t.indexOf("ageddebt@wpa.org.uk") !== -1 && t.indexOf("01823 625170") !== -1; }));
  assert.ok(res({ insurer: "aviva" }).tips.indexOf("Go through your invoices one at a time.") !== -1);
  assert.ok(res({ insurer: "axa", query: "invoice", invoiceType: "specific" }).tips.indexOf("Go through your invoices one at a time.") !== -1);
});

test("public copy never mentions per-call limits or holding invoices back", function () {
  var all = deepStrings(E.allRoutes().map(function (x) { return x.result; })).join("\n");
  assert.ok(!/\b(5|five|3|three) invoice/i.test(all));
  assert.ok(!/announce|don't mention|at a time\b(?!\.)/i.test(all.replace(/one at a time\./g, "")));
});

test("unknown hours are omitted, not labelled", function () {
  ["axa-payment-stp", "axa-invoice-account-other", "wpa-payment", "wpa-submit", "cigna-general"].forEach(function (id) {
    var row = E.allRoutes().filter(function (x) { return x.route.id === id; })[0];
    assert.equal(row.result.main.hoursText, "", id);
    assert.equal(E.isOpenNow(row.result.main.line, new Date()), null, id);
  });
  assert.equal(E.formatHours(E.getInsurer("cigna").lines.northAmerica), "Open from 1pm UK time");
});

test("WPA: every card shows the other WPA lines", function () {
  var wpa = E.getInsurer("wpa");
  var all = Object.keys(wpa.lines).map(function (k) { return wpa.lines[k].number; }).sort();
  E.allRoutes().filter(function (x) { return x.insurer.id === "wpa"; }).forEach(function (x) {
    var r = x.result;
    var shown = [r.main.number].concat(r.alternatives.map(function (a) { return a.number; })).sort();
    assert.deepEqual(shown, all, x.route.id + " should show all three WPA numbers once");
  });
});

test("Have ready: comma-separated, later items start lowercase", function () {
  assert.equal(E.formatHaveReady(["Invoice number", "Patient's membership number"]), "Invoice number, patient's membership number");
  assert.equal(E.formatHaveReady(["Patient's policy number", "Invoice number"]), "Patient's policy number, invoice number");
  assert.equal(E.formatHaveReady(["Invoice number", "Patient's member ID"]), "Invoice number, patient's member ID");
  assert.equal(E.formatHaveReady(["Patient's member ID"]), "Patient's member ID");
  assert.equal(E.formatHaveReady([]), "");
  assert.ok(out.page.indexOf("E.formatHaveReady(r.haveReady)") !== -1);
  assert.ok(out.page.indexOf('haveReady.join(" · ")') === -1);
});

test("sanitize drops invalid or irrelevant URL params", function () {
  assert.deepEqual(E.sanitize({ insurer: "nope" }), {});
  assert.deepEqual(E.sanitize({ insurer: "axa", query: "submit" }), { insurer: "axa" }); // hidden for AXA
  assert.deepEqual(E.sanitize({ insurer: "axa", query: "payment", invoiceType: "specific", policy: "stp" }),
    { insurer: "axa", query: "payment", policy: "stp" });
  assert.deepEqual(E.parentState({ insurer: "axa", query: "payment", policy: "stp" }), { insurer: "axa", query: "payment" });
  assert.deepEqual(E.parentState({ insurer: "aviva" }), {});
});

test("open now: Europe/London across GMT and BST", function () {
  var mf = { hours: [{ days: "Mon-Fri", from: "09:00", to: "17:00" }] };
  // Winter (GMT = UTC): Tue 2026-01-13
  assert.equal(E.isOpenNow(mf, new Date("2026-01-13T08:59:00Z")), false);
  assert.equal(E.isOpenNow(mf, new Date("2026-01-13T09:00:00Z")), true);
  assert.equal(E.isOpenNow(mf, new Date("2026-01-13T16:59:00Z")), true);
  assert.equal(E.isOpenNow(mf, new Date("2026-01-13T17:00:00Z")), false);
  // Summer (BST = UTC+1): Tue 2026-07-14, 08:30 UTC = 09:30 UK
  assert.equal(E.isOpenNow(mf, new Date("2026-07-14T08:30:00Z")), true);
  assert.equal(E.isOpenNow(mf, new Date("2026-07-14T16:30:00Z")), false);
  // Weekend
  assert.equal(E.isOpenNow(mf, new Date("2026-07-18T10:00:00Z")), false);
  // Saturday window (Cigna EU)
  var cigna = E.getInsurer("cigna").lines.eu;
  assert.equal(E.isOpenNow(cigna, new Date("2026-07-18T09:30:00Z")), true);  // Sat 10:30 BST
  assert.equal(E.isOpenNow(cigna, new Date("2026-07-18T11:30:00Z")), false); // Sat 12:30 BST
  assert.equal(E.isOpenNow(cigna, new Date("2026-07-19T09:30:00Z")), false); // Sun
  // 24/7 and unknown
  assert.equal(E.isOpenNow({ hours: "24/7" }, new Date()), true);
  assert.equal(E.isOpenNow({ hours: null }, new Date()), null);
});

// ------------------------------------------------------------------ build outputs
var out = build.buildAll();
var routeIds = E.allRoutes().map(function (x) { return x.route.id; });

test("SEO table: an <h2> + table per insurer, one row per route, Last checked at top", function () {
  var html = out.table;
  assert.ok(!/<script/i.test(html), "table must contain no JS");
  var lc = html.indexOf("Last checked: " + D.lastChecked);
  assert.ok(lc !== -1 && lc < html.indexOf("<h2"), "Last checked must appear before the first insurer heading");
  var h2s = html.match(/<h2[^>]*>[^<]*<\/h2>/g) || [];
  assert.equal(h2s.length, D.insurers.length);
  D.insurers.forEach(function (ins, i) {
    assert.ok(h2s[i].indexOf(ins.name + " provider phone numbers") !== -1, "heading for " + ins.name);
    // The insurer's table follows its heading, with exactly that insurer's routes.
    var start = html.indexOf(h2s[i]);
    var end = i + 1 < h2s.length ? html.indexOf(h2s[i + 1]) : html.length;
    var chunk = html.slice(start, end);
    assert.equal((chunk.match(/<table/g) || []).length, 1);
    var ids = (chunk.match(/data-route="([^"]+)"/g) || []).map(function (m) { return m.slice(12, -1); });
    assert.deepEqual(ids, ins.routes.map(function (r) { return r.id; }));
  });
  var allIds = (html.match(/data-route="([^"]+)"/g) || []).map(function (m) { return m.slice(12, -1); });
  assert.deepEqual(allIds, routeIds);
  build.routeRows().forEach(function (r) {
    var row = html.match(new RegExp('<tr data-route="' + r.routeId + '">[\\s\\S]*?</tr>'))[0];
    assert.ok(row.indexOf(r.number) !== -1, r.routeId + " number missing from table");
    assert.ok(row.indexOf(r.tel) !== -1);
  });
  assert.ok(!/undefined|NaN/.test(html));
});

function parseCsv(text) {
  var rows = [], row = [], cell = "", q = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") {}
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

test("CSV: header + one row per route, matching the data", function () {
  var rows = parseCsv(out.csv);
  assert.deepEqual(rows[0], build.CSV_COLUMNS);
  var body = rows.slice(1);
  assert.equal(body.length, routeIds.length);
  var col = function (name) { return build.CSV_COLUMNS.indexOf(name); };
  body.forEach(function (r, i) {
    assert.equal(r.length, build.CSV_COLUMNS.length);
    assert.equal(r[col("slug")], routeIds[i]);
    assert.ok(r[col("number")]);
    assert.equal(r[col("last_checked")], D.lastChecked);
  });
});

test("outputs: no 'Hours not listed', no excluded numbers, empty hours cells where unknown", function () {
  [out.page, out.table, out.csv].forEach(function (txt) { assert.ok(txt.indexOf("Hours not listed") === -1); });
  var everything = [out.page, out.table, out.csv, JSON.stringify(D)].join("\n");
  Object.keys(EXCLUDED_SOURCE_NUMBERS).forEach(function (n) {
    assert.ok(everything.indexOf(n) === -1 && everything.indexOf(digits(n)) === -1, "excluded number in output: " + n);
  });
  var rows = parseCsv(out.csv), hoursCol = build.CSV_COLUMNS.indexOf("hours");
  var stp = rows.filter(function (r) { return r[0] === "axa-payment-stp"; })[0];
  assert.equal(stp[hoursCol], "");
  var menuCol = build.CSV_COLUMNS.indexOf("menu_path");
  assert.equal(stp[menuCol], "", "menu cell should be empty when there are no menu options");
  assert.ok(out.csv.indexOf("No menu options listed") === -1 && out.table.indexOf("No menu options listed") === -1);
  var axaOther = out.table.match(/<tr data-route="axa-other">[\s\S]*?<\/tr>/)[0].match(/<td>[\s\S]*?<\/td>/g);
  assert.equal(axaOther[2], "<td></td>", "table menu cell should be empty");
  var tr = out.table.match(/<tr data-route="wpa-payment">[\s\S]*?<\/tr>/)[0];
  var cells = tr.match(/<td>[\s\S]*?<\/td>/g);
  assert.equal(cells[3], "<td></td>", "hours cell should be empty");
});

test("result buttons: 'Return to main menu' replaces 'Start over'", function () {
  assert.ok(out.page.indexOf("Return to main menu") !== -1);
  assert.ok(out.page.indexOf("Start over") === -1);
});

test("footer text is exact, built from lastChecked, and shared by tool and table", function () {
  var expected = "Last checked: " + D.lastChecked + ". Numbers and menu options may change. Not affiliated with these insurers.";
  assert.equal(E.footerText(), expected);
  assert.equal(D.lastChecked, "November 2026");
  assert.ok(/footerEl\.textContent = E\.footerText\(\);/.test(out.page));
  assert.equal(out.table.split(expected).length - 1, 2, "table: top and bottom footer lines");
  assert.ok(out.table.indexOf(" · Numbers") === -1 && out.page.indexOf("can change. Not affiliated") === -1);
});

test("tool, table and CSV share the same Last checked date", function () {
  assert.ok(out.page.indexOf(JSON.stringify(D.lastChecked)) !== -1);
  assert.ok(out.table.indexOf(D.lastChecked) !== -1);
  assert.ok(out.framer.indexOf("Last checked: " + D.lastChecked) !== -1);
});

test("every insurer has a logo file, and the build inlines them all", function () {
  var fs = require("fs"), path = require("path");
  D.insurers.forEach(function (ins) {
    var dir = path.join(__dirname, "..", "assets", "logos");
    var ok = ["svg", "png"].some(function (ext) { return fs.existsSync(path.join(dir, ins.id + "." + ext)); });
    assert.ok(ok, "missing logo: assets/logos/" + ins.id + ".svg or .png");
  });
  assert.deepEqual(out.missingLogos, []);
  var m = out.page.match(/window\.__IPF_LOGOS__ = (\{.*?\});/);
  var logos = JSON.parse(m[1]);
  assert.deepEqual(Object.keys(logos).sort(), D.insurers.map(function (i) { return i.id; }).sort());
  Object.keys(logos).forEach(function (k) { assert.match(logos[k], /^data:image\/(png|svg\+xml);base64,/); });
});

test("CTA link: per-insurer Effra page, otherwise the default, opening in the top window", function () {
  var withPage = { aviva: 1, axa: 1, bupa: 1, healix: 1, vitality: 1, wpa: 1 };
  paths.forEach(function (p) {
    var r = p.step.result, id = r.insurerId;
    var expected = withPage[id]
      ? "https://www.effra.io/integrations/insurers/" + id + "-automated-billing-for-healthcare-providers"
      : D.cta.defaultUrl;
    assert.equal(r.ctaUrl, expected, id);
  });
  assert.equal(D.cta.defaultUrl, "https://www.effra.io/?lp_source=Insurer+Phone+Number+Tool");
  assert.ok(out.page.indexOf("Usual hours") === -1, "no 'Usual hours' note");
  assert.equal(D.cta.text, "Still spending time on hold to insurers? Effra automates insurer billing end-to-end for 1000+ providers.");
  assert.equal(D.cta.linkText, "See how →");
  assert.match(out.page, /href: r\.ctaUrl, target: "_top"/);
});

test("Manrope 500/600/700 is embedded, with its licence", function () {
  var fs = require("fs"), path = require("path");
  ["500", "600", "700"].forEach(function (w) {
    assert.ok(fs.existsSync(path.join(__dirname, "..", "assets", "fonts", "manrope-latin-" + w + "-normal.woff2")));
  });
  assert.equal((out.page.match(/url\("data:font\/woff2;base64,/g) || []).length, 3);
  assert.ok(!/url\("assets\/fonts/.test(out.page), "font not inlined");
  assert.ok(/SIL Open Font License/.test(fs.readFileSync(path.join(__dirname, "..", "assets", "fonts", "OFL.txt"), "utf8")));
});

test("UI: no filter box, footer only on the insurer list, no empty phone-menu section", function () {
  assert.ok(!/ipf-filter|Filter insurers|type: "search"/.test(out.page), "filter box should be gone");
  assert.ok(/<footer class="ipf-footer" id="ipf-footer" hidden>/.test(out.page), "footer hidden by default");
  assert.ok(/footerEl\.hidden = step\.type !== "insurer"/.test(out.page), "footer shown only on the insurer step");
  assert.ok(!/No phone-menu options listed|Tell the agent what you need/.test(out.page));
  assert.ok(/m\.menu\.length \? section\("Phone menu"/.test(out.page), "Phone menu section only when options exist");
});

test("AXA invoice follow-up uses plain-language labels", function () {
  var step = E.getStep({ insurer: "axa", query: "invoice" });
  assert.equal(step.id, "invoiceType");
  assert.deepEqual(step.options.map(function (o) { return o.label; }), [
    "Check where an invoice is up to, or ask about an amount AXA paid",
    "Something's gone wrong: an invoice is overdue, a remittance doesn't add up, or a claim has gone missing"
  ]);
});

test("built page is self-contained and has no debug view", function () {
  var page = out.page;
  assert.ok(!/DEBUG:|ipf-debug|debugView/.test(page), "debug code leaked into build");
  assert.ok(!/<script[^>]+src=/i.test(page), "external script in build");
  assert.ok(!/<link[^>]+href=/i.test(page), "external stylesheet in build");
  assert.ok(!/\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/.test(page));
  assert.ok(page.indexOf('"__IPF_INITIAL_QUERY__"') !== -1, "placeholder for Framer state injection missing");
});

test("Framer component: imports only react/framer, one named default export, auto height", function () {
  var tsx = out.framer;
  var imports = tsx.match(/^import .* from "([^"]+)"/gm) || [];
  assert.ok(imports.length >= 1);
  imports.forEach(function (line) { assert.match(line, /from "(react|framer)"$/); });
  assert.equal((tsx.match(/export default/g) || []).length, 1);
  assert.match(tsx, /export default function InsurerPhoneFinder\(/);
  assert.match(tsx, /@framerSupportedLayoutHeight auto/);
  assert.match(tsx, /insurer-finder-height/);
  assert.match(tsx, /syncUrl/);
  var b64 = tsx.match(/const HTML_BASE64 = "([^"]+)"/)[1];
  assert.equal(Buffer.from(b64, "base64").toString("utf8"), out.page);
});
