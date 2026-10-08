/* Salt I.T. analytics consent.
   Cloudflare Web Analytics is cookie-free and always on (loaded in each page footer).
   Google Analytics 4 only loads after the visitor clicks Accept.
   Choice is stored in localStorage as saltit-analytics-consent = accepted | rejected.
   Any [data-consent-open] button ("Cookie settings") reopens the bar so the choice can be changed. */
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
    if (gaLoaded) {
      // Accepted again after Reject on this page: lift the opt-out and grant analytics storage.
      window["ga-disable-" + GA_ID] = false;
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "granted" });
      return;
    }
    gaLoaded = true;
    addScript("/ga4.js?v=55855c27", false);
    addScript("https://www.googletagmanager.com/gtag/js?id=" + GA_ID, true);
  }

  // Reject after Accept. Google's opt-out flag stops gtag.js sending data or setting cookies,
  // the consent update revokes storage, and the existing _ga / _ga_<id> cookies are deleted.
  // gtag.js sets them on the highest domain it can (e.g. .saltit.co.uk), so try each level.
  function stopGA() {
    window["ga-disable-" + GA_ID] = true;
    if (gaLoaded && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
    }
    var parts = location.hostname.split(".");
    var domains = [""];
    for (var i = 0; i < parts.length - 1; i++) domains.push("; domain=." + parts.slice(i).join("."));
    d.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (!/^_ga(_|$)/.test(name)) return;
      domains.forEach(function (domain) {
        d.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + domain;
      });
    });
  }

  var bar = null;
  var opener = null;

  function closeBar() {
    if (!bar) return;
    bar.remove();
    bar = null;
    d.documentElement.classList.remove("has-consent-bar");
    if (opener && opener.isConnected) opener.focus();
    opener = null;
  }

  function showBar(fromButton) {
    if (bar) {
      bar.querySelector("button").focus();
      return;
    }
    bar = d.createElement("section");
    bar.className = "consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Analytics choice");

    var text = d.createElement("p");
    text.className = "consent-text";
    text.textContent =
      "Salt I.T. would like to use Google Analytics, which sets cookies, to see how the site is used and improve it. " +
      "Cloudflare’s cookie-free, privacy-friendly visit counts stay on either way. ";
    var current = read();
    if (current === "accepted" || current === "rejected") {
      text.appendChild(d.createTextNode("Your current choice: " + (current === "accepted" ? "Accept" : "Reject") + ". "));
    }
    var more = d.createElement("a");
    more.href = "/privacy/";
    more.textContent = "Privacy notice";
    text.appendChild(more);

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
        else stopGA();
        closeBar();
      });
      return b;
    }

    actions.appendChild(button("Reject", "rejected"));
    actions.appendChild(button("Accept", "accepted"));
    bar.appendChild(text);
    bar.appendChild(actions);
    d.body.appendChild(bar);
    d.documentElement.classList.add("has-consent-bar");
    if (fromButton) {
      opener = fromButton;
      actions.firstChild.focus();
    }
  }

  // The footer link is hidden in the HTML so it only shows when this script can run it.
  function wireSettings() {
    var wraps = d.querySelectorAll("[data-consent-settings]");
    for (var i = 0; i < wraps.length; i++) wraps[i].hidden = false;
    var buttons = d.querySelectorAll("[data-consent-open]");
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener("click", function (e) { showBar(e.currentTarget); });
    }
  }

  function ready(fn) {
    if (d.readyState !== "loading") fn();
    else d.addEventListener("DOMContentLoaded", fn);
  }

  var choice = read();
  if (choice === "accepted") {
    loadGA();
  } else if (choice !== "rejected") {
    ready(function () { showBar(null); });
  }
  ready(wireSettings);
})();
