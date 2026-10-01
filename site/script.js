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

  // Every WhatsApp href is https://wa.me/<number>?text=<draft>, encoded once.
  // That redirect keeps the draft for WhatsApp Web. On a phone, iOS and some
  // in-app browsers open the wa.me universal link and drop the query, so the
  // chat arrives empty. whatsapp://send is the scheme that fills the composer.
  // If the app is not installed, fall back to the https link.
  const mobileWhatsApp = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (mobileWhatsApp) {
    for (const a of d.querySelectorAll('a[href^="https://wa.me/"]')) {
      a.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        let url;
        try { url = new URL(a.href); } catch { return; }
        const phone = url.pathname.replace(/\D/g, "");
        const text = url.searchParams.get("text");
        if (!phone || !text) return;
        event.preventDefault();
        const deep = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
        const started = Date.now();
        const timer = window.setTimeout(() => {
          if (!document.hidden && Date.now() - started < 2500) window.location.assign(a.href);
        }, 1200);
        const cancel = () => window.clearTimeout(timer);
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) cancel();
        }, { once: true });
        window.addEventListener("pagehide", cancel, { once: true });
        window.location.href = deep;
      });
    }
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

  // On success the form swaps for a large "sent" panel; "Send another message" swaps back.
  const wrap = d.querySelector("[data-enquiry-wrap]");
  const done = d.querySelector("[data-enquiry-done]");
  const formTitle = form.querySelector("h3");
  const doneTitle = done && done.querySelector("[data-done-title]");
  const donePhone = done && done.querySelector("[data-done-phone]");
  const donePhoneLine = done && done.querySelector("[data-done-phone-line]");
  const again = done && done.querySelector("[data-enquiry-again]");
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let swapping = false;

  // Fade one panel out, ease the wrapper to the other's height, then fade it in.
  const swap = async (from, to, focusEl) => {
    if (swapping || !from || !to || !wrap) return;
    swapping = true;
    const still = reduceMotion();
    if (!still) {
      wrap.style.height = `${wrap.offsetHeight}px`;
      wrap.classList.add("is-swapping");
      from.classList.add("is-out");
      await wait(240);
      to.classList.add("is-out");
    }
    from.hidden = true;
    from.classList.remove("is-out");
    to.hidden = false;
    if (!still) wrap.style.height = `${to.offsetHeight}px`;
    if (wrap.getBoundingClientRect().top < 8) {
      wrap.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    }
    if (focusEl) focusEl.focus({ preventScroll: true });
    if (!still) {
      requestAnimationFrame(() => requestAnimationFrame(() => to.classList.remove("is-out")));
      await wait(360);
      wrap.style.height = "";
      wrap.classList.remove("is-swapping");
    }
    swapping = false;
  };

  const markSent = (phone) => {
    form.reset();
    if (!done || !wrap) {
      status.textContent = "Sent. I'll read this and ring you back.";
      return;
    }
    status.textContent = "";
    donePhone.textContent = phone || "";
    donePhoneLine.hidden = !phone;
    form.setAttribute("inert", "");
    swap(form, done, doneTitle);
  };

  if (again && formTitle) {
    formTitle.tabIndex = -1;
    again.addEventListener("click", () => {
      status.textContent = "";
      form.removeAttribute("inert");
      for (const el of form.querySelectorAll("[aria-invalid]")) el.removeAttribute("aria-invalid");
      swap(done, form, formTitle);
    });
  }

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
      markSent(fields.phone);
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
        markSent(fields.phone);
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
          markSent(fields.phone);
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
