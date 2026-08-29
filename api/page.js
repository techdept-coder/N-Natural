// Serves the careers page with roles merged in from the postings sheet.
// Falls back to the roles hard-coded in index.html if anything goes wrong,
// so the worst case is the page exactly as it was before this existed.
var fs = require("fs");
var path = require("path");
var csv = require("../scripts/lib/csv");
var transform = require("../scripts/lib/transform");
var inject = require("../scripts/lib/inject");

var CACHE_SECONDS = 300;          // ~5 minutes before a fresh read
var STALE_SECONDS = 600;          // serve the old copy while refreshing behind the scenes
var FETCH_TIMEOUT_MS = 5000;

function readTemplate() {
  var candidates = [
    path.join(process.cwd(), "index.html"),
    path.join(__dirname, "..", "index.html")
  ];
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return fs.readFileSync(candidates[i], "utf8");
  }
  throw new Error("index.html not found in the deployment");
}

async function fetchRows() {
  var id = process.env.SHEET_ID;
  var gid = process.env.SHEET_GID || "0";
  if (!id) throw new Error("SHEET_ID is not configured");

  var url = "https://docs.google.com/spreadsheets/d/" + id + "/export?format=csv&gid=" + gid;
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
  try {
    var res = await fetch(url, { redirect: "follow", signal: controller.signal });
    if (!res.ok) throw new Error("Sheet responded with " + res.status);
    var text = await res.text();
    if (/^\s*<(!doctype|html)/i.test(text)) throw new Error("Sheet is not readable by link");
    return csv.toObjects(text);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  var html;
  try {
    html = readTemplate();
  } catch (err) {
    res.status(500).send("Careers page unavailable");
    return;
  }

  try {
    var jobs = transform.buildJobs(await fetchRows());
    if (!jobs.length) throw new Error("No open roles in the sheet");
    html = inject.injectJobs(html, jobs);
    res.setHeader("Cache-Control",
      "public, s-maxage=" + CACHE_SECONDS + ", stale-while-revalidate=" + STALE_SECONDS);
    res.setHeader("X-Jobs-Source", "sheet:" + jobs.length);
  } catch (err) {
    // Built-in roles are the safety net; cache briefly so a blip doesn't stick.
    console.error("Falling back to built-in roles:", err && err.message);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=60");
    res.setHeader("X-Jobs-Source", "fallback");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
};
