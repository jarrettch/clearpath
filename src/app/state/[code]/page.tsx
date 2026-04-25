import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_BY_KEY, getState, type ReliefCategoryKey } from "@/lib/states";
import { StateChat } from "@/components/StateChat";
import { Footer } from "@/components/Footer";

export default async function StatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const state = getState(code);
  if (!state) notFound();

  const category = state.relief_category
    ? CATEGORY_BY_KEY[state.relief_category as ReliefCategoryKey]
    : null;

  return (
    <>
      <main className="flex-1 w-full">
        <header className="max-w-3xl mx-auto px-6 pt-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-fg hover:text-foreground"
          >
            <span aria-hidden>←</span> Back to map
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-fg grid place-items-center font-semibold text-xs">
              CP
            </div>
            <span className="font-semibold text-foreground text-sm">
              ClearPath
            </span>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 pt-8 pb-8">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {state.name}
            </h1>
            {category && (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-fg">
                <span
                  className="inline-block w-3 h-3 rounded-sm border border-black/5"
                  style={{ backgroundColor: category.color }}
                  aria-hidden
                />
                {category.label}
              </p>
            )}
          </div>

          <StateChat state={state} />

          <p className="mt-4 text-xs text-muted-fg">
            ClearPath does not save your answers. Closing this page clears
            the conversation.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export async function generateStaticParams() {
  // Pre-render the state pages we know about so the dynamic route is fast.
  const codes = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
                 "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
                 "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
                 "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
                 "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
                 "WY", "FED"];
  return codes.map((code) => ({ code }));
}
