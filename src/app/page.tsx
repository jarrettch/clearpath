import { USMap } from "@/components/USMap";
import { StateSelect } from "@/components/StateSelect";
import { Legend } from "@/components/Legend";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-md bg-zinc-900 text-white grid place-items-center font-semibold text-sm">
              CP
            </div>
            <span className="font-semibold tracking-tight text-zinc-900">
              ClearPath
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 max-w-3xl">
            Find out if your record can be cleared.
          </h1>

          <p className="mt-5 text-lg text-zinc-700 max-w-2xl leading-relaxed">
            Answer a few plain-language questions, get a state-specific
            starting-point read, and connect with legal help that can confirm
            your options.
          </p>

          <div className="mt-8 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 max-w-2xl">
            <strong className="font-semibold">The second chance gap:</strong>{" "}
            research shows fewer than 10% of people eligible for petition-based
            record relief actually receive it.{" "}
            <a
              href="https://paperprisons.org/SecondChanceGap.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-700"
            >
              Paper Prisons Initiative
            </a>
            . ClearPath exists to help close that gap.
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-4">
          <h2 className="sr-only">Pick your state</h2>
          {/* Desktop map */}
          <div className="hidden md:block">
            <USMap />
          </div>
          {/* Mobile placeholder explains why no map */}
          <div className="md:hidden rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Pick your state below to start a guided check.
          </div>

          <div className="mt-6">
            <StateSelect className="max-w-md" />
          </div>

          <div className="mt-8">
            <Legend />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
