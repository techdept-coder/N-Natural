// "About us" boilerplate, keyed by the Brand / location answer.
// Lifted verbatim from the hand-built postings so form-created roles read identically.

var TWST_CLOSER =
  "<p>TWST Bar is more than a salon. It is a cultural homecoming, a place where natural beauty, " +
  "meaningful connection, and joyful experiences come together every day.</p>";

var N_NATURAL_BODY =
  "<p>At N Natural Hair Studio, a full-service natural hair salon focused on textured hair care, we honor " +
  "the integrity of our naturally textured hair. Here, we take pride in promoting an afro-centered aesthetic " +
  "that makes space for your beautiful kinks, coils, and curls to flourish.</p>" +
  "<p>We are on a mission to build the most powerful and innovative team in this industry, and we are looking " +
  "for team members who are ready for a change. If you possess and demonstrate our Core Values, you will fit right in at N.</p>";

var TWST_BODY =
  "<p>At TWST Bar, teamwork is a shared rhythm — intentional, collaborative, and essential to how we serve " +
  "our clients and each other. We believe that when good-hearted, like-minded people come together with a shared " +
  "purpose, great things are inevitable.</p>";

var BRANDS = {
  both: {
    label: "N Beauty Holdings",
    aboutUs:
      "<p><strong>N Beauty Holdings stands at the intersection of beauty, creativity, community, and science.</strong></p>" +
      "<p>Our spaces are fertile ground for positive changes. We believe in the power of education and building leaders " +
      "rooted in our purpose, and we activate our brands to champion those specific efforts.</p>" +
      "<p>Whether it is the mom on the go, the young woman experiencing alopecia, or the little girl who wants to mimic " +
      "the positive natural hair images that she sees, we use hair as a tool to empower women who come into our space. " +
      "Most importantly, we use it to empower ourselves and create meaningful livelihoods.</p>" +
      '<p class="subhead">Our Brands</p>' +
      '<p class="brand-name">N Natural Hair Studio</p>' + N_NATURAL_BODY +
      '<p class="brand-name">TWST Bar</p>' + TWST_BODY + TWST_CLOSER
  },
  twst: {
    label: "TWST Bar",
    aboutUs:
      "<p><strong>We do natural hair the TWST way: timeless natural styles. Culture. Community. Connection.</strong></p>" +
      TWST_BODY +
      '<p class="subhead">The TWST Bar 7 C’s</p>' +
      "<p>Our culture is built on seven core values that guide everything we do:</p>" +
      "<ul><li>Culture</li><li>Celebrate</li><li>Curious</li><li>Conversation</li><li>Creative</li><li>Community</li><li>Care</li></ul>" +
      TWST_CLOSER
  },
  nnatural: {
    label: "N Natural Hair Studio",
    aboutUs:
      "<p><strong>At N Natural Hair Studio, we honor the integrity of our naturally textured hair.</strong></p>" +
      N_NATURAL_BODY
  }
};

// Order matters: "N Natural Holdings (both brands)" must match `both`, not `nnatural`.
function resolveBrand(value) {
  var v = String(value || "").toLowerCase();
  if (v.indexOf("both") >= 0 || v.indexOf("beauty holdings") >= 0) return BRANDS.both;
  if (v.indexOf("twst") >= 0) return BRANDS.twst;
  if (v.indexOf("n natural") >= 0) return BRANDS.nnatural;
  return BRANDS.both; // unrecognised brand still gets a valid About us
}

module.exports = { BRANDS: BRANDS, resolveBrand: resolveBrand };
