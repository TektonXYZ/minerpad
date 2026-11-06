import { Key, Stencil } from "@/components/ui";
import Mark from "@/components/Mark";

export default function NotFound() {
  return (
    <section className="room flex min-h-svh items-center justify-center px-5 pt-16">
      <div className="text-center">
        <Mark size={44} className="mx-auto opacity-60" />
        <Stencil className="mt-8 block">404 · no such rack unit</Stencil>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-bone md:text-5xl">
          Empty slot.
        </h1>
        <p className="mx-auto mt-4 max-w-sm font-mono text-[12px] leading-relaxed text-dim">
          Nothing is racked here. The aisle is that way.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Key href="/" tone="hot">Home</Key>
          <Key href="/farm">The farm</Key>
        </div>
      </div>
    </section>
  );
}
