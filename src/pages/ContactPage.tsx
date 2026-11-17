import { useState } from 'react';
import { Check, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { submitContactMessage } from '../utils/api';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{
    state: 'idle' | 'submitting' | 'success' | 'error';
    text?: string;
  }>({ state: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ state: 'submitting' });
    try {
      const res = await submitContactMessage({ name, email, subject, message });
      setStatus({ state: 'success', text: res.message });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus({
        state: 'error',
        text: err instanceof Error ? err.message : 'Unable to send message.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="border-b border-black/[0.08] pb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#9A7835]">Client Concierge</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#0B0B0C]">
          Contact THE BLACK LABEL
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-[#54534F]">
          Speak with our private stylists, horology specialists, or order concierge for bespoke sizing, private viewings, or international courier inquiries.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6 bg-[#0B0B0C] text-[#FAF9F6] p-8">
          <h2 className="font-display text-2xl font-semibold text-white">Mayfair Flagship</h2>
          <div className="space-y-4 text-sm text-neutral-300">
            <p className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#C5A059] shrink-0 mt-1" aria-hidden="true" />
              <span>18 Mount Street, Mayfair, London W1K 2TH</span>
            </p>
            <p className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-[#C5A059] shrink-0 mt-1" aria-hidden="true" />
              <span>+44 20 7946 0821</span>
            </p>
            <p className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-[#C5A059] shrink-0 mt-1" aria-hidden="true" />
              <span>concierge@theblacklabel.com</span>
            </p>
            <p className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-[#C5A059] shrink-0 mt-1" aria-hidden="true" />
              <span>Monday – Saturday: 10:00 – 19:00 GMT</span>
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-black/[0.08] p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-display text-2xl font-semibold text-[#0B0B0C]">Send an Inquiry</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-subject"
              className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
            >
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Private appointment, sizing guidance, or order support"
              className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
            >
              Message
            </label>
            <textarea
              id="contact-message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
            />
          </div>

          {status.state === 'success' && (
            <p className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{status.text}</span>
            </p>
          )}
          {status.state === 'error' && (
            <p className="text-xs font-medium text-red-700">{status.text}</p>
          )}

          <button
            type="submit"
            disabled={status.state === 'submitting'}
            className="bg-[#0B0B0C] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:opacity-60"
          >
            {status.state === 'submitting' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
