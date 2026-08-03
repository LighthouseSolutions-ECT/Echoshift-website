
const dialog = document.querySelector('[data-pilot-enquiry-dialog]');
const form = document.querySelector('[data-pilot-enquiry-form]');
const status = document.querySelector('[data-pilot-enquiry-status]');
const openers = [...document.querySelectorAll('[data-pilot-enquiry-open]')];
const closeButton = document.querySelector('[data-pilot-enquiry-close]');
const recipient = 'aaronpatrickferguson@outlook.com';
let returnFocus = null;

const openDialog = (event) => {
  if (!dialog || typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  returnFocus = event.currentTarget;
  dialog.showModal();
  document.body.classList.add('has-pilot-dialog');
  requestAnimationFrame(() => dialog.querySelector('input, select, textarea, button')?.focus());
};

const closeDialog = () => {
  if (!dialog?.open) return;
  dialog.close();
};

openers.forEach((opener) => opener.addEventListener('click', openDialog));
closeButton?.addEventListener('click', closeDialog);

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog();
});

dialog?.addEventListener('close', () => {
  document.body.classList.remove('has-pilot-dialog');
  status.textContent = '';
  returnFocus?.focus();
});

const clean = (value) => String(value || '').trim();

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  status.textContent = '';
  if (!form.checkValidity()) {
    form.reportValidity();
    status.textContent = 'Please complete the required fields before continuing.';
    return;
  }

  const data = new FormData(form);
  const contactName = clean(data.get('contact_name'));
  const businessName = clean(data.get('business_name'));
  const lines = [
    'EchoShift pilot enquiry',
    '',
    `Contact name: ${contactName}`,
    `Business / organisation: ${businessName}`,
    `Email: ${clean(data.get('email'))}`,
    `Phone: ${clean(data.get('phone')) || 'Not provided'}`,
    `Role: ${clean(data.get('role')) || 'Not provided'}`,
    `Business sector: ${clean(data.get('sector')) || 'Not provided'}`,
    `Monitoring interest: ${clean(data.get('asset_interest')) || 'Not provided'}`,
    '',
    'Notes:',
    clean(data.get('notes')) || 'No additional notes provided.'
  ];

  const subject = `EchoShift pilot enquiry — ${businessName}`;
  const href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  status.textContent = 'Opening your email app with the completed enquiry…';
  window.location.href = href;
});
