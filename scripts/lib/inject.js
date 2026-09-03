var esc = require("./transform").esc;

function cardHtml(job, index) {
  var tags = job.tags.map(function (t) {
    return '                <span class="tag' + (t.variant ? " " + t.variant : "") + '">' + esc(t.text) + "</span>";
  }).join("\n");

  var meta = job.meta.map(function (m) {
    return '                <span><img src="' + m.icon + '" alt="" width="' + m.w + '" height="' + m.h +
           '" /> ' + esc(m.label) + "</span>";
  }).join("\n");

  // Button colour alternates down the list, exactly as the hand-built markup did.
  var variant = index % 2 === 0 ? "btn--outline" : "btn--lime";

  return [
    '          <article class="job-card reveal">',
    '            <div class="job-card__main">',
    '              <div class="job-card__tags">',
    tags,
    "              </div>",
    "              <h3>" + esc(job.title) + "</h3>",
    '              <p class="job-card__desc">' + esc(job.summary) + "</p>",
    '              <div class="job-card__meta">',
    meta,
    "              </div>",
    "            </div>",
    '            <div class="job-card__cta">',
    '              <button type="button" class="btn ' + variant + ' js-open-detail" data-role="' +
      esc(job.id) + '">apply for this role</button>',
    "            </div>",
    "          </article>"
  ].join("\n");
}

function jobsData(jobs) {
  var out = {};
  jobs.forEach(function (job) {
    var copy = {};
    Object.keys(job).forEach(function (k) {
      if (k.charAt(0) !== "_" && k !== "summary") copy[k] = job[k];
    });
    out[job.id] = copy;
  });
  return out;
}

function injectJobs(html, jobs) {
  // 1. Swap the hand-written <article> cards for generated ones.
  var listOpen = '<div class="job-list">';
  var noteOpen = '<div class="jobs__note reveal">';
  var a = html.indexOf(listOpen);
  var b = html.indexOf(noteOpen, a);
  if (a < 0 || b < 0) throw new Error("Could not locate the job list");
  var closeBeforeNote = html.lastIndexOf("</div>", b);
  var cards = "\n" + jobs.map(cardHtml).join("\n\n") + "\n        ";
  html = html.slice(0, a + listOpen.length) + cards + html.slice(closeBeforeNote);

  // 2. Replace the whole `var JOBS = {...};` block, up to the next statement.
  var start = html.indexOf("var JOBS = {");
  var end = html.indexOf("var currentRoleId", start);
  if (start < 0 || end < 0) throw new Error("Could not locate the JOBS block");
  var data = "var JOBS = " + JSON.stringify(jobsData(jobs), null, 2) + ";\n\n      ";
  return html.slice(0, start) + data + html.slice(end);
}

module.exports = { injectJobs: injectJobs, cardHtml: cardHtml, jobsData: jobsData };
