// Decides, before first paint, whether the logo intro plays. Once per browser
// session, never for reduced motion or a deep link. The animation itself is
// CSS and ends on its own, so a failure here only means no intro.
try {
  if (!location.hash
    && !matchMedia("(prefers-reduced-motion: reduce)").matches
    && !sessionStorage.getItem("saltit-intro")) {
    sessionStorage.setItem("saltit-intro", "1");
    document.documentElement.classList.add("has-intro");
  }
} catch (e) {}
