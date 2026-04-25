import { StatePicker } from "@/components/StatePicker";
import { Legend } from "@/components/Legend";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main className="flex-1 w-full">
        <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-fg grid place-items-center font-semibold text-sm shadow-sm">
              CP
            </div>
            <span className="font-semibold tracking-tight text-foreground">
              ClearPath
            </span>
          </div>
          <a
            href="https://github.com/jarrettch/clearpath"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-fg hover:text-foreground"
          >
            GitHub
          </a>
        </header>

        <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
          <span className="inline-block text-xs uppercase tracking-wider text-primary font-semibold mb-4">
            Record Relief, Decoded
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground max-w-3xl leading-[1.05]">
            Find out if your record can be cleared.
          </h1>

          <p className="mt-6 text-lg text-muted-fg max-w-2xl leading-relaxed">
            Answer a few plain-language questions, get a state-specific
            starting-point read, and connect with legal help that can confirm
            your options.
          </p>

          <div className="mt-8 rounded-xl bg-surface border border-border px-5 py-4 text-sm text-foreground max-w-2xl shadow-sm">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 inline-block w-1.5 h-6 rounded-full bg-primary"
              />
              <p>
                <strong className="font-semibold">
                  The second chance gap:
                </strong>{" "}
                research shows fewer than 10% of people eligible for
                petition-based record relief actually receive it.{" "}
                <a
                  href="https://paperprisons.org/SecondChanceGap.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Paper Prisons Initiative
                </a>
                . ClearPath exists to help close that gap.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xl font-semibold text-foreground">
                Pick your state
              </p>
            </div>
            <p className="text-sm text-muted-fg hidden sm:block">
              Hover to preview · click to select
            </p>
          </div>

          <div className="rounded-xl bg-surface border border-border p-4 sm:p-6 shadow-sm">
            <StatePicker />

            <div className="mt-8 pt-6 border-t border-border">
              <Legend />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-sm uppercase tracking-wider text-muted-fg font-semibold mb-2">
            How it works
          </h2>
          <p className="text-xl font-semibold text-foreground mb-6">
            A guided check, then a real human handoff.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                n: "1",
                title: "Plain-language intake",
                body: "We ask one question at a time, adapted to your state's rules. No PII required — just rough timeline and offense category.",
              },
              {
                n: "2",
                title: "A starting-point verdict",
                body: "You get a clear read — likely qualifies, doesn't, or unclear — with a confidence line and references back to the state profile.",
              },
              {
                n: "3",
                title: "Free or low-cost legal help",
                body: "We connect you with vetted legal aid in your state, plus a national clearinghouse fallback. ClearPath isn't your lawyer — but we know who is.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-xl bg-surface border border-border p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold">
                    {s.n}
                  </span>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-fg leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
