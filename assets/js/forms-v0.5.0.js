function validateContact(form) {
  const email = form.querySelector('[name="email"]');
  const phone = form.querySelector('[name="phone"]');
  const error = form.querySelector('[data-contact-error]');
  if (!email || !phone) return true;
  const valid = email.value.trim() || phone.value.trim();
  [email, phone].forEach(el => el.setAttribute('aria-invalid', valid ? 'false' : 'true'));
  if (error) error.classList.toggle('is-visible', !valid);
  return Boolean(valid);
}

document.querySelectorAll('[data-lead-form]').forEach(form => {
  const email = form.querySelector('[name="email"]');
  const phone = form.querySelector('[name="phone"]');
  [email, phone].forEach(el => el?.addEventListener('input', () => validateContact(form)));
  form.addEventListener('submit', event => {
    if (!validateContact(form)) {
      event.preventDefault();
      (email || phone)?.focus();
    }
  });
});
