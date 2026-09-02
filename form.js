(() => {
  'use strict';

  // TODO: after deploying apps-script.gs as a Web App (Deploy > New deployment >
  // type "Web app" > execute as yourself > who has access "Anyone"), paste the
  // resulting URL here. See apps-script.gs for the matching doPost(e) handler.
  const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbzED6h4lc36BCPKf3aNKfJbxqh2-72dwz3XCV_EVN9EOpzBaNnkd9FzFGFFzmdw7SEVWg/exec";

  const modal = document.getElementById('regModal');
  if (!modal) return;

  const dialog = modal.querySelector('.reg-modal-dialog');
  const backdrop = modal.querySelector('[data-modal-backdrop]');
  const closeBtn = modal.querySelector('[data-modal-close]');
  const form = document.getElementById('regForm');
  const submitBtn = document.getElementById('regSubmit');
  const formError = document.getElementById('regFormError');

  const fields = {
    name: { input: document.getElementById('regName'), error: document.getElementById('regNameError') },
    phone: { input: document.getElementById('regPhone'), error: document.getElementById('regPhoneError') },
    email: { input: document.getElementById('regEmail'), error: document.getElementById('regEmailError') }
  };
  const countryCode = document.getElementById('regCountryCode');

  let lastFocusedTrigger = null;

  function getFocusable() {
    return Array.from(
      dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => el.offsetParent !== null);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openModal(trigger) {
    lastFocusedTrigger = trigger || document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKeydown, true);
    // Double rAF: the modal's visibility only lands after the browser paints
    // the class change, so focusing on the very next frame can silently no-op.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => fields.name.input.focus());
    });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKeydown, true);
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }
  }

  document.querySelectorAll('[data-open-register]').forEach(trigger => {
    trigger.addEventListener('click', () => openModal(trigger));
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // -------- validation --------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Country code is chosen separately, so this only validates the national number.
  const PHONE_RE = /^[0-9\s-]{6,13}$/;

  function setFieldError(key, message) {
    const f = fields[key];
    f.input.closest('.reg-field').classList.toggle('has-error', Boolean(message));
    f.input.setAttribute('aria-invalid', message ? 'true' : 'false');
    f.error.textContent = message || '';
  }

  function validateField(key) {
    const value = fields[key].input.value.trim();

    if (key === 'name') {
      if (!value) { setFieldError('name', 'Please enter your full name.'); return false; }
      setFieldError('name', '');
      return true;
    }

    if (key === 'phone') {
      if (!value) { setFieldError('phone', 'Please enter your phone number.'); return false; }
      const digitCount = value.replace(/[^0-9]/g, '').length;
      if (!PHONE_RE.test(value) || digitCount < 6) {
        setFieldError('phone', 'Enter a valid phone number, e.g. 12-345 6789.');
        return false;
      }
      setFieldError('phone', '');
      return true;
    }

    if (key === 'email') {
      if (!value) { setFieldError('email', 'Please enter your email.'); return false; }
      if (!EMAIL_RE.test(value)) { setFieldError('email', 'Enter a valid email address.'); return false; }
      setFieldError('email', '');
      return true;
    }

    return true;
  }

  Object.keys(fields).forEach(key => {
    fields[key].input.addEventListener('blur', () => validateField(key));
    fields[key].input.addEventListener('input', () => {
      if (fields[key].input.closest('.reg-field').classList.contains('has-error')) validateField(key);
    });
  });

  function setLoading(isLoading) {
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
  }

  function showFormError(message) {
    if (!message) {
      formError.hidden = true;
      formError.textContent = '';
      return;
    }
    formError.hidden = false;
    formError.textContent = message;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showFormError('');

    const validName = validateField('name');
    const validPhone = validateField('phone');
    const validEmail = validateField('email');
    if (!validName || !validPhone || !validEmail) {
      const firstInvalidKey = ['name', 'phone', 'email'].find(
        key => fields[key].input.closest('.reg-field').classList.contains('has-error')
      );
      if (firstInvalidKey) fields[firstInvalidKey].input.focus();
      return;
    }

    if (SHEET_ENDPOINT.indexOf('PASTE_') === 0) {
      showFormError("Registration isn't connected yet — the site owner still needs to add the Google Sheets endpoint.");
      return;
    }

    setLoading(true);

    const payload = new URLSearchParams({
      name: fields.name.input.value.trim(),
      phone: `${countryCode.value} ${fields.phone.input.value.trim()}`,
      email: fields.email.input.value.trim(),
      timestamp: new Date().toISOString()
    });

    fetch(SHEET_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString()
    })
      .then(() => {
        // no-cors returns an opaque response, so we can't read a real status —
        // a resolved fetch promise is the only success signal available here;
        // network-level failures (offline, DNS, blocked request) reject below.
        window.location.href = 'thankyou.html';
      })
      .catch(() => {
        setLoading(false);
        showFormError('Something went wrong sending your details. Please check your connection and try again.');
      });
  });
})();
