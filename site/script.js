(() => {
  const d = document;

  const year = d.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  const hdr = d.querySelector("[data-hdr]");
  if (hdr) {
    const onScroll = () => hdr.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

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
  const submit = form.querySelector("[type=submit]");
  const labelFor = (el) => {
    const label = form.querySelector(`label[for="${el.id}"]`);
    return label ? label.childNodes[0].textContent.trim() : el.name;
  };

  const openMailto = (fields) => {
    const subject = `Home visit enquiry — ${fields.area} — ${fields.name}`;
    const body = [
      `Name: ${fields.name}`,
      `Phone: ${fields.phone}`,
      `Area: ${fields.area}`,
      `Booking for someone else: ${fields.forSomeoneElse ? "Yes" : "No"}`,
      "",
      "What's gone wrong:",
      fields.problem,
    ].join("\n");
    status.textContent = "Your email app should now open with the message ready to send. If it doesn't, email support@saltit.co.uk.";
    window.location.href =
      `mailto:support@saltit.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const markSent = () => {
    form.reset();
    status.textContent = "Sent. I'll read this and ring you back.";
  };

  // Web3Forms rejects the Vercel function. The handler then asks this page to submit.
  const submitViaWeb3Forms = async (fields, accessKey) => {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Home visit enquiry — ${fields.area} — ${fields.name}`,
        from_name: fields.name,
        name: fields.name,
        phone: fields.phone,
        area: fields.area,
        booking_for_someone_else: fields.forSomeoneElse ? "Yes" : "No",
        message: fields.problem,
      }),
    });
    let data = {};
    try { data = await res.json(); } catch { data = {}; }
    return res.ok && data.success === true;
  };

  form.addEventListener("submit", async (event) => {
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

    const fields = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      area: form.elements.area.value.trim(),
      problem: form.elements.problem.value.trim(),
      forSomeoneElse: form.elements.for_someone_else.checked,
      company: form.elements.hp_field ? form.elements.hp_field.value.trim() : "",
    };

    if (fields.company) {
      markSent();
      return;
    }

    if (submit) submit.disabled = true;
    status.textContent = "Sending.";
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: fields.name,
          phone: fields.phone,
          area: fields.area,
          problem: fields.problem,
          for_someone_else: fields.forSomeoneElse ? "yes" : "",
          hp_field: "",
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { data = {}; }
      if (res.ok && data.ok) {
        markSent();
        return;
      }
      if (data.fallback === "client" && data.accessKey) {
        const source = data.submission && typeof data.submission === "object" ? data.submission : fields;
        const sent = await submitViaWeb3Forms({
          name: source.name,
          phone: source.phone,
          area: source.area,
          problem: source.problem,
          forSomeoneElse: source.forSomeoneElse === true || source.forSomeoneElse === "yes",
        }, data.accessKey);
        if (sent) {
          markSent();
          return;
        }
      }
      if (res.status === 400) {
        status.textContent = "Please check the form and try again, or email support@saltit.co.uk.";
        return;
      }
      openMailto(fields);
    } catch {
      openMailto(fields);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
})();
