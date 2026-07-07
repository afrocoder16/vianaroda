import { SignInForm } from "./signin-form";

export default function SignInPage() {
  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="brand-gradient section-shell relative overflow-hidden p-8 md:p-10">
        <div className="purple-grid absolute inset-0 opacity-70" />
        <div className="relative space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand)]">
            Welcome back
          </p>
          <h1 className="max-w-xl text-5xl font-black leading-none tracking-[-0.06em] text-[#231f4f] md:text-6xl">
            Sign in and keep shopping fast.
          </h1>
          <p className="max-w-lg text-base leading-7 text-[#5f5b74]">
            Pick up where you left off, track your orders, and check out in seconds.
            Everything you saved is waiting for you.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/84 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-bold text-[#231f4f]">Saved cart</p>
              <p className="mt-1 text-sm text-[#5f5b74]">Jump back into what you were ready to buy.</p>
            </div>
            <div className="rounded-2xl bg-white/84 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-bold text-[#231f4f]">Order tracking</p>
              <p className="mt-1 text-sm text-[#5f5b74]">See shipping updates the moment they land.</p>
            </div>
            <div className="rounded-2xl bg-white/84 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-bold text-[#231f4f]">Faster checkout</p>
              <p className="mt-1 text-sm text-[#5f5b74]">Get in, buy, and move on without friction.</p>
            </div>
          </div>
        </div>
      </section>
      <SignInForm />
    </div>
  );
}
