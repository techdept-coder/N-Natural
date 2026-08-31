var resolveBrand = require("./brands").resolveBrand;

var COL = {
  action: "What do you want to do?",
  title: "Job Title",
  brand: "Brand / location",
  reportsTo: "Reports to",
  terms: "Terms",
  rate: "Salary Rate",
  rateUnit: "Rate is",
  summary: "Short summary for the jobs list",
  about: "About the role",
  responsibilities: "Responsibilities / Tasks",
  requirements: "Job requirements",
  benefits: "Benefits",
  standout: "Anything that makes this role stand out?",
  category: "Category tag",
  schedule: "Schedule note",
  notes: "Notes",
  pinned: "Pin this role to the top?"
};

var CATEGORY_ORDER = ["leadership", "stylist", "experienced", "junior", "entry-level",
                      "admin", "client experience", "front of house"];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// The job title is the role's identity — the salon never types an id.
// "Master / Experienced Stylist" -> "master-experienced-stylist"
function slugify(s) {
  return String(s == null ? "" : s).toLowerCase()
    .replace(/['‘’“”]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tidy(line) { return String(line == null ? "" : line).replace(/\s+/g, " ").trim(); }

// One item per line. A line starting lowercase is a wrapped continuation of the
// line above (the client's PDFs hard-wrap mid-sentence), so rejoin it.
function splitList(text) {
  var out = [];
  String(text || "").split(/\r?\n/).forEach(function (raw) {
    var line = tidy(raw);
    if (!line) return;
    if (out.length && /^[a-z(]/.test(line)) out[out.length - 1] += " " + line;
    else out.push(line);
  });
  return out;
}

// Blank line = new paragraph; single newlines inside a paragraph are wraps.
function paragraphs(text) {
  return String(text || "").split(/\r?\n\s*\r?\n/)
    .map(function (block) { return tidy(block.split(/\r?\n/).join(" ")); })
    .filter(Boolean);
}

function toHtml(text) {
  return paragraphs(text).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
}

function isTruthy(v) { return /^(yes|true|1)$/i.test(String(v || "").trim()); }

function multi(v) {
  return String(v || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
}

// "$16.50 - $20" + "per hour" -> "$16.50 to $20/hr" (card) and "$16.50–$20/hour" (facts)
function rateStrings(rate, unit) {
  // People often type the unit into the rate box as well ("$22 - $27/hr"), so strip
  // any trailing unit before appending the one from the "Rate is" answer.
  var raw = tidy(rate)
    .replace(/\s*(\/|per\s+)\s*(hourly|hours|hour|hrs|hr|annually|annum|years|year|yrs|yr)\.?\s*$/i, "")
    .trim();
  var u = String(unit || "").toLowerCase();
  var shortUnit = u.indexOf("year") >= 0 ? "/yr" : u.indexOf("hour") >= 0 ? "/hr" : "";
  var longUnit = u.indexOf("year") >= 0 ? "/year" : u.indexOf("hour") >= 0 ? "/hour" : "";
  return {
    card: raw.replace(/\s*[-–]\s*/g, " to ") + shortUnit,
    fact: raw.replace(/\s*[-–]\s*/g, "–") + longUnit
  };
}

function rowToJob(row) {
  var brand = resolveBrand(row[COL.brand]);
  var terms = tidy(row[COL.terms]);
  var rate = rateStrings(row[COL.rate], row[COL.rateUnit]);

  // Terms already supplies the second tag; drop it from the category answer if ticked twice.
  var categories = multi(row[COL.category]).filter(function (c) {
    return c.toLowerCase() !== terms.toLowerCase();
  });

  var tags = categories.slice(0, 1).map(function (c) {
    return { text: c, variant: "tag--outline" };
  });
  if (terms) tags.push({ text: terms.toLowerCase(), variant: "" });

  var meta = [{ icon: "assets/icon-location.svg", label: brand.label, w: 11, h: 14 }];
  if (rate.card) meta.push({ icon: "assets/icon-pay.svg", label: rate.card, w: 15, h: 11 });
  var schedule = tidy(row[COL.schedule] || "");
  if (schedule) meta.push({ icon: "assets/icon-shift.svg", label: schedule, w: 15, h: 15 });

  var payFacts = [];
  if (terms) payFacts.push({ label: "Terms:", value: terms });
  if (tidy(row[COL.reportsTo] || "")) payFacts.push({ label: "Reports to:", value: tidy(row[COL.reportsTo]) });
  if (rate.fact) payFacts.push({ label: "Rate:", value: rate.fact });

  var standout = toHtml(row[COL.standout]);
  var title = tidy(row[COL.title]);

  var job = {
    id: slugify(title),
    title: title,
    formTitle: title,
    formBadge: terms.toLowerCase(),
    formLead: "Please complete this short application so we understand your availability, experience, " +
              "location, and fit for the " + title + " role.",
    isAdmin: false,
    summary: tidy(row[COL.summary]),
    tags: tags,
    meta: meta,
    introHtml: '<p class="section-label">About us</p>' + brand.aboutUs +
               '<p class="section-label">About the role</p>' + toHtml(row[COL.about]),
    willDoLabel: "Responsibilities/Tasks:",
    willDo: splitList(row[COL.responsibilities]),
    fit: splitList(row[COL.requirements]),
    _category: (categories[0] || "").toLowerCase(),
    _pinned: isTruthy(row[COL.pinned])
  };

  var benefits = splitList(row[COL.benefits]);
  if (benefits.length) job.benefits = benefits;
  if (standout) job.differentHtml = "<p><strong>What makes this role different:</strong></p>" + standout;
  if (tidy(row[COL.notes] || "")) job.payLine = tidy(row[COL.notes]);
  if (payFacts.length) job.payFacts = payFacts;

  return job;
}

// A role is identified by its job title and brand, so re-posting the same title
// for the same brand updates that role rather than duplicating it. The last row
// for a role wins; a Close row removes it entirely.
function buildJobs(rows) {
  var latest = {};     // "title|brand" -> the most recent posting for that role
  var closedAt = {};   // title -> row of the latest Close for it
  rows.forEach(function (row, index) {
    var slug = slugify(row[COL.title]);
    if (!slug) return;
    // Closing skips the brand question, so a Close matches on job title alone.
    if (String(row[COL.action] || "").toLowerCase().indexOf("close") >= 0) {
      if (closedAt[slug] == null || index > closedAt[slug]) closedAt[slug] = index;
      return;
    }
    var brandLabel = resolveBrand(row[COL.brand]).label;
    latest[slug + "|" + brandLabel] = { row: row, index: index, slug: slug, brandLabel: brandLabel };
  });

  // A role is gone only if it was closed *after* it was last posted, so
  // re-posting a title later brings it back.
  var open = Object.keys(latest).map(function (key) { return latest[key]; })
    .filter(function (entry) {
      return closedAt[entry.slug] == null || closedAt[entry.slug] < entry.index;
    });

  // Same title under two brands (a Host at each, say) would collide on one id,
  // so when that happens every clashing role carries its brand.
  var slugCounts = {};
  open.forEach(function (entry) {
    slugCounts[entry.slug] = (slugCounts[entry.slug] || 0) + 1;
  });

  var jobs = open.map(function (entry) {
    var job = rowToJob(entry.row);
    if (slugCounts[entry.slug] > 1) job.id = entry.slug + "-" + slugify(entry.brandLabel);
    job._index = entry.index;
    return job.title ? job : null;
  }).filter(Boolean);

  jobs.sort(function (a, b) {
    if (a._pinned !== b._pinned) return a._pinned ? -1 : 1;
    var ai = CATEGORY_ORDER.indexOf(a._category), bi = CATEGORY_ORDER.indexOf(b._category);
    if (ai < 0) ai = CATEGORY_ORDER.length;
    if (bi < 0) bi = CATEGORY_ORDER.length;
    if (ai !== bi) return ai - bi;
    return b._index - a._index;   // newest first within a category
  });

  return jobs;
}

module.exports = { buildJobs: buildJobs, rowToJob: rowToJob, splitList: splitList, esc: esc, COL: COL };
