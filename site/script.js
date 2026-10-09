(() => {
  const d = document;

  // Logo intro: any tap or key skips it. Once it lifts it stays in the page,
  // hidden, because the hero's timing in styles.css keys on html:has(.intro).
  const intro = d.querySelector("[data-intro]");
  if (intro) {
    const skip = () => d.documentElement.classList.add("intro-skip");
    intro.addEventListener("pointerdown", skip);
    d.addEventListener("keydown", skip, { once: true });
    intro.addEventListener("animationend", (e) => {
      if (e.target !== intro) return;
      d.removeEventListener("keydown", skip);
    });
  }

  const year = d.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  const hdr = d.querySelector("[data-hdr]");
  if (hdr) {
    const onScroll = () => hdr.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Phone/tablet menu: the section links sit behind a "Menu" button below 1240px.
  // Escape closes it and returns focus to the button; picking a link closes it.
  const menuBtn = d.querySelector("[data-menu-btn]");
  const menu = menuBtn && d.getElementById(menuBtn.getAttribute("aria-controls"));
  if (menuBtn && menu && hdr) {
    const wide = window.matchMedia("(min-width: 1240px)");
    const setOpen = (open) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      hdr.classList.toggle("is-menu-open", open);
    };
    const isOpen = () => menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.hidden = false;
    menuBtn.addEventListener("click", () => {
      const open = !isOpen();
      setOpen(open);
      if (open) {
        const first = menu.querySelector("a");
        if (first) first.focus();
      }
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a") && isOpen()) setOpen(false);
    });
    d.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !isOpen()) return;
      setOpen(false);
      menuBtn.focus();
    });
    d.addEventListener("click", (e) => {
      if (isOpen() && !menu.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
    });
    hdr.addEventListener("focusout", (e) => {
      if (isOpen() && e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== menuBtn) setOpen(false);
    });
    wide.addEventListener("change", () => setOpen(false));
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

  // Booking page (/book/): a request form with its own handling. This block does
  // nothing unless [data-booking] exists, so the contact form below is unaffected.
  {
    const booking = d.querySelector("[data-booking]");
    if (booking) {
      const bookStatus = booking.querySelector("[data-status]");
      const bookSend = booking.querySelector("[type=submit]");
      const bookTitle = booking.querySelector("h3");
      const bookStarted = booking.querySelector("[data-started]");
      const bookWrap = d.querySelector("[data-booking-wrap]");
      const bookDone = d.querySelector("[data-booking-done]");
      const bookDoneTitle = bookDone.querySelector("[data-done-title]");
      const bookDonePhone = bookDone.querySelector("[data-done-phone]");
      const bookDonePhoneLine = bookDone.querySelector("[data-done-phone-line]");
      const bookAgain = bookDone.querySelector("[data-booking-again]");
      const field = (name) => booking.elements.namedItem(name);
      const ticked = (name) => Array.from(booking.querySelectorAll(`input[name="${name}"]:checked`), (el) => el.value);
      // Each required field, then email (optional, but must be valid if given).
      const rules = [
        ["b-name", "Please enter your name."],
        ["b-phone", "Please enter a phone number."],
        ["b-email", "Please enter a valid email, or leave it blank."],
        ["b-area", "Please choose where you are."],
        ["b-type", "Please choose what you need help with."],
        ["b-desc", "Please say briefly what's gone wrong."],
      ];
      const isValid = (el) => {
        const value = el.value.trim();
        if (el.type === "email") return value === "" || el.checkValidity();
        return value !== "" && el.checkValidity();
      };
      // Status text is built from DOM nodes. The phone link is made here, never from input.
      const say = (...parts) => {
        bookStatus.textContent = "";
        bookStatus.append(...parts);
      };
      const phoneLink = () => {
        const a = d.createElement("a");
        a.href = "tel:+447843468904";
        a.textContent = "call 07843 468904";
        return a;
      };
      const startClock = () => {
        bookStarted.value = String(Date.now());
      };
      const clearErrors = () => {
        for (const el of booking.querySelectorAll("[aria-invalid]")) el.removeAttribute("aria-invalid");
        for (const err of booking.querySelectorAll(".field-error")) {
          err.hidden = true;
          err.textContent = "";
        }
      };
      const showDone = (sentPhone) => {
        booking.reset();
        clearErrors();
        say();
        bookDonePhone.textContent = sentPhone;
        bookDonePhoneLine.hidden = false;
        booking.hidden = true;
        booking.setAttribute("inert", "");
        bookDone.hidden = false;
        if (bookWrap.getBoundingClientRect().top < 8) bookWrap.scrollIntoView({ block: "start" });
        bookDoneTitle.focus({ preventScroll: true });
      };
      // Email app fallback: the same details as a labelled draft to support@saltit.co.uk.
      const mailtoFallback = (f) => {
        const subject = `Visit request — ${f.area} — ${f.name}`;
        const body = [
          `Name: ${f.name}`,
          `Phone: ${f.phone}`,
          `Email: ${f.email || "Not given"}`,
          `Area: ${f.area}`,
          `Help with: ${f.problemType}`,
          `Preferred days: ${f.days.join(", ") || "No preference"}`,
          `Preferred times: ${f.times.join(", ") || "No preference"}`,
          "",
          "What's gone wrong:",
          f.description,
          "",
          "This is a request. Nothing is booked until Simon calls or texts to confirm.",
        ].join("\n");
        say("Your email app should open with the request ready to send. If it doesn't, ", phoneLink(), ".");
        window.location.href =
          `mailto:support@saltit.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      };
      // Web3Forms, called from the page when the server asks for it (fallback "client").
      const handoff = async (data, local) => {
        const sub = data.submission && typeof data.submission === "object" ? data.submission : {};
        const s = { ...local, ...sub };
        const days = Array.isArray(s.days) ? s.days : [];
        const times = Array.isArray(s.times) ? s.times : [];
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: data.accessKey,
            subject: `Visit request — ${s.area} — ${s.name}`,
            from_name: s.name,
            request: "Visit request (not confirmed until Simon calls or texts)",
            name: s.name,
            phone: s.phone,
            customer_email: s.email || "Not given",
            area: s.area,
            problem_type: s.problemType,
            preferred_days: days.join(", ") || "No preference",
            preferred_times: times.join(", ") || "No preference",
            message: s.description,
          }),
        });
        let out = {};
        try { out = (await res.json()) || {}; } catch { out = {}; }
        return res.ok && out.success === true;
      };

      booking.hidden = false;
      startClock();
      bookTitle.tabIndex = -1;
      bookAgain.addEventListener("click", () => {
        say();
        bookDone.hidden = true;
        booking.hidden = false;
        booking.removeAttribute("inert");
        startClock();
        bookTitle.focus();
      });

      booking.addEventListener("submit", async (event) => {
        event.preventDefault();
        let first = null;
        for (const [id, message] of rules) {
          const el = booking.querySelector(`#${id}`);
          const err = booking.querySelector(`#${id}-err`);
          const ok = isValid(el);
          el.setAttribute("aria-invalid", ok ? "false" : "true");
          err.textContent = ok ? "" : message;
          err.hidden = ok;
          if (!ok && !first) first = el;
        }
        if (first) {
          say("Please check the highlighted fields.");
          first.focus();
          return;
        }

        const local = {
          name: field("name").value.trim(),
          phone: field("phone").value.trim(),
          email: field("email").value.trim(),
          area: field("area").value,
          problemType: field("problem_type").value,
          days: ticked("days"),
          times: ticked("times"),
          description: field("description").value.trim(),
        };

        // Honeypot filled: show the success panel and send nothing, as the contact form does.
        if (field("hp_field").value.trim() !== "") {
          showDone(local.phone);
          return;
        }

        bookSend.disabled = true;
        say("Sending.");
        try {
          const res = await fetch("/api/enquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              kind: "booking",
              name: local.name,
              phone: local.phone,
              email: local.email,
              area: local.area,
              problem_type: local.problemType,
              description: local.description,
              days: local.days,
              times: local.times,
              elapsed_ms: Date.now() - Number(bookStarted.value),
              hp_field: "",
            }),
          });
          let data = {};
          try { data = (await res.json()) || {}; } catch { data = {}; }
          if (res.ok && data.ok) {
            showDone(local.phone);
            return;
          }
          if (data.fallback === "client" && data.accessKey) {
            if (await handoff(data, local)) {
              showDone(local.phone);
            } else {
              mailtoFallback(local);
            }
            return;
          }
          if (res.status === 429) {
            say("Too many requests. Please wait a few minutes, or ", phoneLink(), ".");
            return;
          }
          if (res.status === 400) {
            say("Please check the form and try again, or ", phoneLink(), ".");
            return;
          }
          mailtoFallback(local);
        } catch {
          mailtoFallback(local);
        } finally {
          bookSend.disabled = false;
        }
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
