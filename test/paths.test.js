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
    assert.ok(r.main.hoursText, "no hours text on " + label);
    deepStrings(r).forEach(function (s) {
      assert.ok(!/\bundefined\b|\bnull\b|\bNaN\b/.test(s), "bad value '" + s + "' on " + label);
    });
    if (r.alternative) assert.match(r.alternative.tel, /^tel:\+?\d{6,15}$/);
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
      if (r.alternative) assert.ok(ins.lines[r.alternative.line], r.id + ": unknown alternative line");
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
  SOURCE_NUMBERS.forEach(function (n) {
    assert.ok(dataNumbers.some(function (d) { return digits(d) === digits(n); }), "source number missing from data: " + n);
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
  assert.ok(res({ insurer: "aviva" }).tips.indexOf("Go through your invoices one at a time.") !== -1);
  assert.ok(res({ insurer: "axa", query: "invoice", invoiceType: "specific" }).tips.indexOf("Go through your invoices one at a time.") !== -1);
});

test("public copy never mentions per-call limits or holding invoices back", function () {
  var all = deepStrings(E.allRoutes().map(function (x) { return x.result; })).join("\n");
  assert.ok(!/\b(5|five|3|three) invoice/i.test(all));
  assert.ok(!/announce|don't mention|at a time\b(?!\.)/i.test(all.replace(/one at a time\./g, "")));
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

test("tool, table and CSV share the same Last checked date", function () {
  assert.ok(out.page.indexOf(JSON.stringify(D.lastChecked)) !== -1);
  assert.ok(out.table.indexOf(D.lastChecked) !== -1);
  assert.ok(out.framer.indexOf("Last checked: " + D.lastChecked) !== -1);
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
