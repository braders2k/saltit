(() => {
  const d = document;

  const year = d.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  const bar = d.querySelector("[data-callbar]");
  const heroCall = d.querySelector("[data-hero-call]");
  if (bar && heroCall && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      bar.classList.toggle("is-off", entry.isIntersecting);
    }).observe(heroCall);
  }

  const form = d.querySelector("[data-enquiry]");
  if (!form) return;
  form.hidden = false;
  form.noValidate = true;
  const status = form.querySelector("[data-status]");
  const labelFor = (el) => {
    const label = form.querySelector(`label[for="${el.id}"]`);
    return label ? label.childNodes[0].textContent.trim() : el.name;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const missing = [];
    for (const el of form.querySelectorAll("[required]")) {
      const ok = el.value.trim() !== "" && el.checkValidity();
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) missing.push(el);
    }
    if (missing.length) {
      status.textContent = `Please fill in: ${missing.map(labelFor).join(", ")}.`;
      missing[0].focus();
      return;
    }

    const v = (name) => form.elements[name].value.trim();
    const forSomeoneElse = form.elements.for_someone_else.checked;
    const subject = `Home visit enquiry — ${v("area")} — ${v("name")}`;
    const body = [
      `Name: ${v("name")}`,
      `Phone: ${v("phone")}`,
      `Area: ${v("area")}`,
      `Booking for someone else: ${forSomeoneElse ? "Yes" : "No"}`,
      "",
      "What's gone wrong:",
      v("problem"),
    ].join("\n");

    status.textContent = "Your email app should now open with the message ready to send. If it doesn't, email hello@saltit.co.uk.";
    window.location.href =
      `mailto:hello@saltit.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
