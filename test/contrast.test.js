"use strict";
// WCAG contrast check for the brand tokens in index.html (:root { --ipf-… }).
// Text and button labels must reach 4.5:1; borders and the focus ring that
// identify controls must reach 3:1. Edit the tokens and re-run `npm test`.
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
var root = html.match(/:root\s*\{([\s\S]*?)\}/)[1];
var T = {};
root.replace(/--ipf-([a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g, function (_, k, v) { T[k] = v; });

function lum(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
  var c = [0, 2, 4].map(function (i) {
    var v = parseInt(hex.substr(i, 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  var x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// [foreground token, background token, minimum, where it's used]
var PAIRS = [
  ["text", "bg", 4.5, "body text, option labels"],
  ["text", "surface", 4.5, "text on result cards"],
  ["text", "primary-soft", 4.5, "option label on hover"],
  ["muted", "bg", 4.5, "secondary text, footer"],
  ["muted", "surface", 4.5, "labels on result cards"],
  ["muted", "primary-soft", 4.5, "option detail on hover"],
  ["primary", "bg", 4.5, "Copy button, links, phone number"],
  ["primary", "surface", 4.5, "phone number on result card"],
  ["primary", "primary-soft", 4.5, "compact menu chip, initials, Copy hover"],
  ["primary-text", "primary", 4.5, "primary button / menu step label"],
  ["primary-text", "primary-hover", 4.5, "primary button label on hover"],
  ["open", "open-bg", 4.5, "Open now badge"],
  ["closed", "closed-bg", 4.5, "Closed now badge"],
  ["border-strong", "bg", 3, "option tile / input / outline button border"],
  ["focus", "bg", 3, "focus ring"],
  ["focus", "surface", 3, "focus ring on cards"]
];

test("brand tokens meet WCAG contrast", function () {
  var failures = [];
  PAIRS.forEach(function (p) {
    assert.ok(T[p[0]] && T[p[1]], "missing token --ipf-" + (T[p[0]] ? p[1] : p[0]));
    var r = ratio(T[p[0]], T[p[1]]);
    if (r < p[2]) failures.push(p[0] + " on " + p[1] + " = " + r.toFixed(2) + ":1 (needs " + p[2] + ":1, " + p[3] + ")");
  });
  assert.deepEqual(failures, []);
});

module.exports = { PAIRS: PAIRS, tokens: T, ratio: ratio };
