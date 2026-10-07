/* Salt I.T. analytics consent.
   Cloudflare Web Analytics is cookie-free and always on (loaded in each page footer).
   Google Analytics 4 only loads after the visitor clicks Accept.
   Choice is stored in localStorage as saltit-analytics-consent = accepted | rejected. */
(function () {
  "use strict";

  var KEY = "saltit-analytics-consent";
  var GA_ID = "G-X32NFC62HG";
  var d = document;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: choice lasts this page only */ }
  }

  function addScript(src, async) {
    var s = d.createElement("script");
    s.src = src;
    if (async) s.async = true;
    d.head.appendChild(s);
  }

  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return;
    gaLoaded = true;
    addScript("/ga4.js?v=55855c27", false);
    addScript("https://www.googletagmanager.com/gtag/js?id=" + GA_ID, true);
  }

  function showBar() {
    var bar = d.createElement("section");
    bar.className = "consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Analytics choice");

    var text = d.createElement("p");
    text.className = "consent-text";
    text.textContent =
      "Salt I.T. would like to use Google Analytics, which sets cookies, to see how the site is used and improve it. " +
      "Cloudflare’s cookie-free, privacy-friendly visit counts stay on either way.";

    var actions = d.createElement("div");
    actions.className = "consent-actions";

    function button(label, value) {
      var b = d.createElement("button");
      b.type = "button";
      b.className = "btn btn-line btn-sm consent-btn";
      b.textContent = label;
      b.addEventListener("click", function () {
        save(value);
        if (value === "accepted") loadGA();
        bar.remove();
        d.documentElement.classList.remove("has-consent-bar");
      });
      return b;
    }

    actions.appendChild(button("Reject", "rejected"));
    actions.appendChild(button("Accept", "accepted"));
    bar.appendChild(text);
    bar.appendChild(actions);
    d.body.appendChild(bar);
    d.documentElement.classList.add("has-consent-bar");
  }

  var choice = read();
  if (choice === "accepted") {
    loadGA();
  } else if (choice !== "rejected") {
    if (d.body) showBar();
    else d.addEventListener("DOMContentLoaded", showBar);
  }
})();
