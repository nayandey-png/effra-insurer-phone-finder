/* Routing engine: pure functions, no DOM. Reads IPF_DATA (src/data.js).
 * Used by the wizard (index.html), the build (table + CSV) and the tests. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory(require("./data.js"));
  else root.IPF_ENGINE = factory(root.IPF_DATA);
})(typeof self !== "undefined" ? self : this, function (DATA) {
  "use strict";

  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var STATE_KEYS = ["insurer"].concat(Object.keys(DATA.questions).filter(function (k) { return k !== "insurer"; }));

  function getInsurer(id) {
    for (var i = 0; i < DATA.insurers.length; i++) if (DATA.insurers[i].id === id) return DATA.insurers[i];
    return null;
  }

  function matchValue(cond, value) {
    return Array.isArray(cond) ? cond.indexOf(value) !== -1 : cond === value;
  }

  // Routes still possible given the answers so far.
  function candidates(insurer, state) {
    return insurer.routes.filter(function (r) {
      return insurer.questions.every(function (q) {
        if (state[q] === undefined || r.when[q] === undefined) return true;
        return matchValue(r.when[q], state[q]);
      });
    });
  }

  function questionOptions(qid, cands) {
    var def = DATA.questions[qid];
    return def.options.filter(function (opt) {
      return cands.some(function (r) { return r.when[qid] !== undefined && matchValue(r.when[qid], opt.value); });
    });
  }

  // Returns { type: "insurer" } | { type: "question", id, title, options } | { type: "result", route, result }
  // or { type: "error", message } if the data is inconsistent (the tests make sure this never happens).
  function getStep(state) {
    var insurer = state.insurer && getInsurer(state.insurer);
    if (!insurer) return { type: "insurer", id: "insurer", title: DATA.questions.insurer.title };
    var cands = candidates(insurer, state);
    for (var i = 0; i < insurer.questions.length; i++) {
      var q = insurer.questions[i];
      if (state[q] !== undefined) continue;
      if (!cands.some(function (r) { return r.when[q] !== undefined; })) continue;
      return { type: "question", id: q, title: DATA.questions[q].title, options: questionOptions(q, cands), insurer: insurer };
    }
    if (cands.length !== 1) {
      return { type: "error", message: (cands.length ? "Several" : "No") + " routes match for " + insurer.id + " " + JSON.stringify(state) };
    }
    return { type: "result", route: cands[0], insurer: insurer, result: buildResult(insurer, cands[0], state) };
  }

  // Rebuild a clean state from untrusted params (e.g. the URL), stopping at the first invalid answer.
  function sanitize(params) {
    var state = {};
    if (!params || !getInsurer(params.insurer)) return state;
    state.insurer = params.insurer;
    for (var guard = 0; guard < 20; guard++) {
      var step = getStep(state);
      if (step.type !== "question") break;
      var v = params[step.id];
      if (!step.options.some(function (o) { return o.value === v; })) break;
      state[step.id] = v;
    }
    return state;
  }

  // Keys answered, in the order they were asked.
  function answeredPath(state) {
    var clean = sanitize(state), path = [], replay = {};
    if (!clean.insurer) return path;
    path.push("insurer"); replay.insurer = clean.insurer;
    for (var guard = 0; guard < 20; guard++) {
      var step = getStep(replay);
      if (step.type !== "question" || clean[step.id] === undefined) break;
      replay[step.id] = clean[step.id]; path.push(step.id);
    }
    return path;
  }

  function parentState(state) {
    var path = answeredPath(state), out = {};
    path.slice(0, -1).forEach(function (k) { out[k] = state[k]; });
    return out;
  }

  // Most questions still to come on the longest remaining branch (for the progress bar).
  function maxRemaining(state) {
    var step = getStep(state);
    if (step.type === "insurer") {
      return 1 + Math.max.apply(null, DATA.insurers.map(function (ins) { return maxRemaining({ insurer: ins.id }); }));
    }
    if (step.type !== "question") return 0;
    return 1 + Math.max.apply(null, step.options.map(function (o) {
      var next = Object.assign({}, state); next[step.id] = o.value; return maxRemaining(next);
    }));
  }

  // ---------------------------------------------------------------- hours
  function expandDays(spec) {
    var parts = spec.split("-");
    if (parts.length === 1) return [parts[0]];
    var a = DAY_ORDER.indexOf(parts[0]), b = DAY_ORDER.indexOf(parts[1]);
    return DAY_ORDER.slice(a, b + 1);
  }

  function formatTime(t) {
    var h = parseInt(t.slice(0, 2), 10), m = t.slice(3, 5);
    var suffix = h >= 12 ? "pm" : "am", h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m === "00" ? "" : ":" + m) + suffix;
  }

  function formatHours(line) {
    if (line.hours === "24/7") return "24/7";
    if (!line.hours) return line.hoursNote || "Hours not listed";
    return line.hours.map(function (w) {
      return w.days.replace("-", "–") + " " + formatTime(w.from) + "–" + formatTime(w.to);
    }).join(", ");
  }

  // UK weekday + minutes since midnight for a given instant.
  function londonNow(date) {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date);
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: o.weekday, minutes: parseInt(o.hour, 10) % 24 * 60 + parseInt(o.minute, 10) };
  }

  // true = open, false = closed, null = we don't know (no badge shown).
  function isOpenNow(line, date) {
    if (line.hours === "24/7") return true;
    if (!line.hours) return null;
    var now = londonNow(date || new Date());
    return line.hours.some(function (w) {
      var toMin = function (t) { return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3, 5), 10); };
      return expandDays(w.days).indexOf(now.day) !== -1 && now.minutes >= toMin(w.from) && now.minutes < toMin(w.to);
    });
  }

  // ---------------------------------------------------------------- results
  function telHref(number) {
    var n = number.replace(/\(0\)/g, "").replace(/[^\d+]/g, "");
    return "tel:" + n;
  }

  function menuLabel(step) { return /^\d$/.test(step) ? "Press " + step : step; }

  function describeLine(insurer, key, menu) {
    var line = insurer.lines[key];
    return {
      lineKey: key,
      number: line.number,
      tel: telHref(line.number),
      team: line.team || "",
      hoursText: formatHours(line),
      hours: line.hours,
      line: line,
      menu: (menu || []).map(menuLabel)
    };
  }

  function buildResult(insurer, route, state) {
    var main = describeLine(insurer, route.line, route.menu);
    var line = insurer.lines[route.line];
    var tips = [].concat(route.tips || [], route.transfer ? [DATA.transferTip] : [], line.tips || [], insurer.tips || []);
    var haveReady = route.haveReady ||
      (state.query && DATA.haveReadyDefaults[state.query]) || [];
    var alt = route.alternative ? describeLine(insurer, route.alternative.line, route.alternative.menu) : null;
    if (alt) alt.label = route.alternative.label;
    return {
      routeId: route.id,
      insurerId: insurer.id,
      insurerName: insurer.name,
      main: main,
      covers: route.covers || "",
      tips: tips,
      haveReady: haveReady,
      alternative: alt,
      needsVerification: !!route.needsVerification,
      verifyNote: route.verifyNote || ""
    };
  }

  // Human labels for the answers that lead to a route (for the table/CSV/debug).
  function labelFor(qid, value) {
    var def = DATA.questions[qid];
    for (var i = 0; i < def.options.length; i++) if (def.options[i].value === value) return def.options[i].label;
    return value;
  }
  function whenLabels(insurer, route) {
    var query = "", followUps = [];
    insurer.questions.forEach(function (q) {
      var cond = route.when[q];
      if (cond === undefined) return;
      var labels = (Array.isArray(cond) ? cond : [cond]).map(function (v) { return labelFor(q, v); });
      if (q === "query") query = labels.join("; ");
      else followUps.push((DATA.questions[q].shortTitle || DATA.questions[q].title.replace(/\?$/, "")) + ": " + labels.join(" / "));
    });
    if (!query) query = route.covers || "All queries";
    return { query: query, followUp: followUps.join("; ") };
  }

  // Every complete path through the wizard: [{ state, step }].
  function enumeratePaths() {
    var out = [];
    function walk(state, depth) {
      var step = getStep(state);
      if (depth > 20) { out.push({ state: state, step: { type: "error", message: "too deep" } }); return; }
      if (step.type === "question") {
        if (!step.options.length) { out.push({ state: state, step: { type: "error", message: "question with no options: " + step.id } }); return; }
        step.options.forEach(function (o) {
          var next = Object.assign({}, state); next[step.id] = o.value; walk(next, depth + 1);
        });
        return;
      }
      out.push({ state: state, step: step });
    }
    DATA.insurers.forEach(function (ins) { walk({ insurer: ins.id }, 0); });
    return out;
  }

  // Every route, in data order, with resolved details (one per table/CSV row).
  function allRoutes() {
    var rows = [];
    DATA.insurers.forEach(function (ins) {
      ins.routes.forEach(function (r) {
        // Use the first wizard path that reaches this route for state-dependent defaults.
        var state = { insurer: ins.id };
        ins.questions.forEach(function (q) {
          if (r.when[q] !== undefined) state[q] = Array.isArray(r.when[q]) ? r.when[q][0] : r.when[q];
        });
        var labels = whenLabels(ins, r);
        rows.push({ insurer: ins, route: r, labels: labels, result: buildResult(ins, r, state) });
      });
    });
    return rows;
  }

  function stateToParams(state) {
    var out = {};
    STATE_KEYS.forEach(function (k) { if (state[k] !== undefined) out[k] = state[k]; });
    return out;
  }

  return {
    DATA: DATA,
    STATE_KEYS: STATE_KEYS,
    getInsurer: getInsurer,
    getStep: getStep,
    sanitize: sanitize,
    answeredPath: answeredPath,
    parentState: parentState,
    maxRemaining: maxRemaining,
    formatHours: formatHours,
    isOpenNow: isOpenNow,
    telHref: telHref,
    labelFor: labelFor,
    enumeratePaths: enumeratePaths,
    allRoutes: allRoutes,
    stateToParams: stateToParams
  };
});
