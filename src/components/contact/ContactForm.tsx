'use client';

// Contact form that works on a static host: the browser posts JSON straight to Web3Forms (no backend needed).
// The access key is public by design (it only allows sending to the inbox it was registered with).
// Until a real key is set, the API answers with an error and the visitor gets the email / WhatsApp fallbacks.
import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import { flushSync } from 'react-dom';
import { toast } from '@/lib/client';
import { AlertIcon, MailIcon, SendIcon, WhatsappIcon } from '@/components/icons';

type Field = 'name' | 'email' | 'subject' | 'message';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'sending' | 'success' | 'error';

const ENDPOINT = 'https://api.web3forms.com/submit';
const MESSAGE_MAX = 2000;
const MESSAGE_MIN = 10;
const TIMEOUT_MS = 15_000;
const EMPTY: Values = { name: '', email: '', subject: '', message: '' };
const ORDER: Field[] = ['name', 'email', 'subject', 'message'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Values): Errors {
  const e: Errors = {};
  const name = v.name.trim();
  const email = v.email.trim();
  const message = v.message.trim();
  if (!name) e.name = 'Please enter your name.';
  if (!email) e.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(email)) e.email = 'Please enter a valid email address, like name@company.com.';
  if (!message) e.message = 'Please write a message.';
  else if (message.length < MESSAGE_MIN) e.message = `Please write at least ${MESSAGE_MIN} characters (${message.length} so far).`;
  return e;
}

/** mailto: link with the visitor's subject and message filled in (RFC 6068: CRLF line breaks, percent-encoded). */
function mailtoHref(to: string, v: Values) {
  const subject = v.subject.trim() || 'Hello from your portfolio';
  const signature = [v.name.trim(), v.email.trim() && `<${v.email.trim()}>`].filter(Boolean).join(' ');
  const body = [v.message.trim(), signature && `\n— ${signature}`].filter(Boolean).join('\n').replace(/\r?\n/g, '\r\n');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ContactForm({ to, whatsapp, accessKey }: { to: string; whatsapp: string; accessKey: string }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const botRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const refs = { name: nameRef, email: emailRef, subject: subjectRef, message: messageRef };

  useEffect(() => {
    // Some browsers restore form state on reload/back (Firefox). The honeypot must always start unchecked.
    // (autocomplete="off" would do the same, but HTML does not allow it on checkboxes.)
    if (botRef.current) botRef.current.checked = false;
    // Hydrated: from here on, submitting goes through onSubmit (tests wait for this flag)
    formRef.current?.setAttribute('data-ready', 'true');
  }, []);

  const errors = validate(values);
  const errorFor = (f: Field) => (touched[f] ? errors[f] : undefined);
  const sending = status === 'sending';

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name as Field]: value }));
    if (status === 'success') setStatus('idle');
  }

  // Errors appear once a field has been left, then update live while typing
  function onBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const f = e.target.name as Field;
    if (!touched[f]) setTouched((t) => ({ ...t, [f]: true }));
  }

  function succeed() {
    setValues(EMPTY);
    setTouched({});
    if (botRef.current) botRef.current.checked = false;
    setStatus('success');
    toast('Message sent. Thanks for reaching out!', 'success');
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const firstInvalid = ORDER.find((f) => errors[f]);
    if (firstInvalid) {
      // Render the errors (aria-invalid + message) before moving focus, so screen readers read them
      flushSync(() => setTouched({ name: true, email: true, subject: true, message: true }));
      refs[firstInvalid].current?.focus();
      return;
    }
    // Honeypot: a human never sees this checkbox. Bots that tick it get a fake success and nothing is sent.
    if (botRef.current?.checked) return succeed();

    setStatus('sending');
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim() || `Portfolio message from ${values.name.trim()}`,
          message: values.message.trim(),
          from_name: 'Portfolio contact',
          botcheck: false,
        }),
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (!res.ok || data?.success !== true) throw new Error('not sent');
      succeed();
    } catch {
      // Network failure, timeout, missing/invalid key or { success: false }: same outcome for the visitor
      setStatus('error');
    } finally {
      window.clearTimeout(timer);
    }
  }

  function input(f: Exclude<Field, 'message'>, label: string, props: InputHTMLAttributes<HTMLInputElement>, required = true) {
    const error = errorFor(f);
    return (
      <div className="field-group">
        <div className="field" data-invalid={error ? 'true' : undefined}>
          <input
            ref={refs[f]}
            id={`contact-${f}`}
            name={f}
            className="field-control"
            placeholder=" "
            value={values[f]}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `contact-${f}-error` : undefined}
            {...props}
          />
          <label htmlFor={`contact-${f}`} className="field-label">
            {label}
            {required && (
              <span className="req" aria-hidden="true">
                {' '}*
              </span>
            )}
          </label>
        </div>
        <div className="field-meta">
          <span className="field-error" id={`contact-${f}-error`}>
            {error}
          </span>
        </div>
      </div>
    );
  }

  const messageError = errorFor('message');
  const count = values.message.length;

  return (
    // action/method + the hidden fields are a no-JavaScript fallback (the browser posts straight to Web3Forms);
    // with JavaScript, onSubmit takes over and nothing reloads.
    <form ref={formRef} className="contact-form" action={ENDPOINT} method="post" noValidate onSubmit={onSubmit} aria-label="Send a message">
      <input type="hidden" name="access_key" value={accessKey} />
      <input type="hidden" name="from_name" value="Portfolio contact" />
      <p className="form-note" aria-hidden="true">
        <span className="req">*</span> required
      </p>

      <div className="form-row">
        {input('name', 'Name', { type: 'text', autoComplete: 'name', maxLength: 100 })}
        {input('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email', maxLength: 254, spellCheck: false })}
      </div>
      {input('subject', 'Subject (optional)', { type: 'text', maxLength: 150 }, false)}

      <div className="field-group">
        <div className="field" data-invalid={messageError ? 'true' : undefined}>
          <textarea
            ref={messageRef}
            id="contact-message"
            name="message"
            className="field-control"
            placeholder=" "
            rows={6}
            maxLength={MESSAGE_MAX}
            value={values.message}
            onChange={onChange}
            onBlur={onBlur}
            required
            aria-invalid={messageError ? true : undefined}
            aria-describedby={messageError ? 'contact-message-error contact-message-count' : 'contact-message-count'}
          />
          <label htmlFor="contact-message" className="field-label">
            Message
            <span className="req" aria-hidden="true">
              {' '}*
            </span>
          </label>
        </div>
        <div className="field-meta">
          <span className="field-error" id="contact-message-error">
            {messageError}
          </span>
          <span className="field-hint tnum" id="contact-message-count" data-near={count >= MESSAGE_MAX * 0.9 ? 'true' : undefined}>
            <span aria-hidden="true">
              {count} / {MESSAGE_MAX}
            </span>
            <span className="sr-only">
              {count} of {MESSAGE_MAX} characters used
            </span>
          </span>
        </div>
      </div>

      {/* Honeypot (see onSubmit) */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="contact-botcheck">Leave this box unchecked</label>
        <input ref={botRef} id="contact-botcheck" type="checkbox" name="botcheck" tabIndex={-1} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary form-submit" aria-disabled={sending ? true : undefined} data-state={status}>
          {sending ? <span className="spinner" aria-hidden="true" /> : <SendIcon />}
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </div>

      <div className="form-status" aria-live="polite">
        {sending && <p className="sr-only">Sending your message…</p>}
        {status === 'success' && (
          <div className="form-result" data-kind="success">
            <svg className="form-check" viewBox="0 0 52 52" aria-hidden="true" focusable="false">
              <circle className="form-check-circle" cx="26" cy="26" r="24" />
              <path className="form-check-tick" d="M15 27.5l7.5 7.5L37.5 19" />
            </svg>
            <div>
              <p className="form-result-title">Message sent</p>
              <p className="form-result-text">Thanks for reaching out. Your message is on its way to my inbox.</p>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="form-result" data-kind="error">
            <AlertIcon />
            <div>
              <p className="form-result-title">Message not sent</p>
              <p className="form-result-text">
                Something went wrong on the way, so nothing was delivered. Your text is still in the form. You can reach me
                directly instead:
              </p>
              <div className="form-fallbacks">
                <a className="btn btn-secondary" href={mailtoHref(to, values)}>
                  <MailIcon />
                  Email me directly
                </a>
                <a className="btn btn-secondary" href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <WhatsappIcon />
                  Message on WhatsApp
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
