// Minimal RFC4180 CSV parser: handles quoted fields, embedded newlines and "" escapes.
function parseCsv(text) {
  var rows = [], row = [], field = "", i = 0, inQuotes = false;
  text = String(text).replace(/^﻿/, "");
  while (i < text.length) {
    var c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(function (r) { return r.some(function (v) { return v.trim() !== ""; }); });
}

// Rows keyed by header name, so column order in the sheet never matters.
function toObjects(text) {
  var rows = parseCsv(text);
  if (!rows.length) return [];
  var headers = rows[0].map(function (h) { return h.trim(); });
  return rows.slice(1).map(function (r) {
    var o = {};
    headers.forEach(function (h, n) { o[h] = (r[n] || "").trim(); });
    return o;
  });
}

module.exports = { parseCsv: parseCsv, toObjects: toObjects };
