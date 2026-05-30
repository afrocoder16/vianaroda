const faqs = [
  {
    question: "How does shipping work?",
    answer:
      "After checkout, your order is forwarded to the supplier and shipped directly to you. Most orders arrive within 5-10 days.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes. You'll get a tracking link by email as soon as your order ships, and it also appears in your account.",
  },
  {
    question: "What is the return window?",
    answer:
      "Unused items can be returned within 30 days of delivery unless the product page says otherwise.",
  },
  {
    question: "Which payment methods are supported?",
    answer:
      "We support card checkout, Apple Pay, Google Pay, and PayPal selection in this MVP build.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <section className="brand-gradient rounded-[2rem] border border-[#d9d4ff] p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand)]">
          Support
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">
          We&apos;re here. Always.
        </h1>
        <p className="mt-3 max-w-2xl text-[#5f5b74]">
          Questions, concerns, or just need help? We&apos;ve got you covered.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="section-shell p-5">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Real Support</h2>
          <div className="mt-4 space-y-3 rounded-[1.5rem] bg-[#231f4f] p-4 text-sm text-white">
            <div className="rounded-2xl bg-white/10 p-3">
              Questions, concerns, or just need help? We&apos;ve got you covered.
            </div>
            <div className="grid gap-2">
              <button className="rounded-xl bg-white/10 px-3 py-2 text-left">
                Where is my order?
              </button>
              <button className="rounded-xl bg-white/10 px-3 py-2 text-left">
                How do I request a refund?
              </button>
              <button className="rounded-xl bg-white/10 px-3 py-2 text-left">
                What payment methods do you accept?
              </button>
            </div>
          </div>
        </div>

        <div id="contact" className="section-shell p-5">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Send Us a Message</h2>
          <p className="mt-2 text-sm text-[#5f5b74]">
            We typically respond within 24 hours.
          </p>
          <form className="mt-4 grid gap-3">
            <input
              required
              placeholder="Your name"
              className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
            />
            <input
              required
              type="email"
              placeholder="Email"
              className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
            />
            <input
              placeholder="Order number"
              className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
            />
            <textarea
              required
              rows={5}
              placeholder="How can we help?"
              className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
            />
            <button className="w-fit rounded-full bg-[var(--brand)] px-5 py-3 text-white">
              Send Us a Message
            </button>
          </form>
        </div>
      </section>

      <section id="faq" className="section-shell p-5">
        <h2 className="text-3xl font-black tracking-[-0.04em]">Common Questions</h2>
        <div className="mt-4 grid gap-3">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-2xl border border-[#d9d4ff] p-4"
            >
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm text-[#5f5b74]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="returns" className="section-shell p-5">
        <h2 className="text-3xl font-black tracking-[-0.04em]">Returns & Refunds</h2>
        <div className="mt-4 grid gap-3 text-sm text-[#5f5b74]">
          <p>Unused items can be returned within 30 days of delivery.</p>
          <p>Refund requests are reviewed quickly and forwarded to suppliers when needed.</p>
          <p>Tracking disputes and delivery issues are handled by real support, not silence.</p>
        </div>
      </section>
    </div>
  );
}
