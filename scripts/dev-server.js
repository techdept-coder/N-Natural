// Local preview: re-reads the sheet on every request so a new form response
// shows up on refresh. Falls back to the fixture, then to the untouched page.
var http = require("http");
var fs = require("fs");
var path = require("path");
var csv = require("./lib/csv");
var transform = require("./lib/transform");
var inject = require("./lib/inject");

var ROOT = path.join(__dirname, "..");
var PORT = Number(process.env.PORT || 8080);
var SHEET_ID = process.env.SHEET_ID || "";
var SHEET_GID = process.env.SHEET_GID || "0";
var USE_FIXTURE = process.env.USE_FIXTURE === "1";

var TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff": "font/woff", ".json": "application/json" };

function sheetUrl() {
  return "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/export?format=csv&gid=" + SHEET_GID;
}

async function loadCsv() {
  if (USE_FIXTURE) return fs.readFileSync(path.join(__dirname, "fixtures/responses.csv"), "utf8");
  if (!SHEET_ID) throw new Error("SHEET_ID is not set (see .env.example)");
  var res = await fetch(sheetUrl(), { redirect: "follow" });
  if (!res.ok) throw new Error("Sheet responded with " + res.status);
  var text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error("Got an HTML login page — the sheet is not link-viewable yet");
  return text;
}

async function buildPage() {
  var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  try {
    var jobs = transform.buildJobs(csv.toObjects(await loadCsv()));
    if (!jobs.length) throw new Error("Sheet contained no open roles");
    console.log("  → rendered " + jobs.length + " role(s): " + jobs.map(function (j) { return j.id; }).join(", "));
    return inject.injectJobs(html, jobs);
  } catch (err) {
    console.log("  ! " + err.message + " — serving the built-in roles instead");
    return html;   // same fallback the live site will use
  }
}

http.createServer(async function (req, res) {
  var url = decodeURIComponent(req.url.split("?")[0]);
  console.log(req.method + " " + url);

  if (url === "/" || url === "/index.html") {
    var page = await buildPage();
    res.writeHead(200, { "Content-Type": TYPES[".html"], "Cache-Control": "no-store" });
    return res.end(page);
  }

  var file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, function () {
  console.log("N Natural careers preview → http://localhost:" + PORT);
  console.log(USE_FIXTURE ? "source: local fixture" : "source: " + sheetUrl());
});
