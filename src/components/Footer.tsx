export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 py-8 text-xs text-zinc-500">
      <div className="max-w-5xl mx-auto px-6 flex flex-col gap-2">
        <p>
          <strong className="font-semibold text-zinc-700">
            Not legal advice.
          </strong>{" "}
          ClearPath gives a starting-point read on whether you may qualify
          for record relief. An attorney needs to confirm your eligibility
          and file any petition.
        </p>
        <p>
          Eligibility data adapted from the{" "}
          <a
            href="https://ccresourcecenter.org"
            className="underline hover:text-zinc-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Restoration of Rights Project (RRP)
          </a>
          , a project of the Collateral Consequences Resource Center, with
          attribution per their republishing terms.
        </p>
      </div>
    </footer>
  );
}
