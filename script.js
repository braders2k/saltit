const form = document.querySelector("#contact-form");
const status = document.querySelector("#form-status");
const interest = document.querySelector("#interest");
const year = document.querySelector("#year");

year.textContent = new Date().getFullYear();

document.querySelectorAll("[data-interest]").forEach((link) => {
  link.addEventListener("click", () => {
    interest.value = link.dataset.interest;
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const fields = [...form.querySelectorAll("[required]")];
  let firstInvalid;

  fields.forEach((field) => {
    const isValid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!isValid));
    if (!isValid && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    status.textContent = "Please complete the highlighted fields.";
    firstInvalid.focus();
    return;
  }

  const data = new FormData(form);
  const subject = encodeURIComponent(`${data.get("interest")} enquiry from ${data.get("name")}`);
  const body = encodeURIComponent(
    `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nInterested in: ${data.get("interest")}\n\n${data.get("message")}`
  );

  status.textContent = "Opening your email app…";
  window.location.href = `mailto:hello@saltit.co.uk?subject=${subject}&body=${body}`;
});
