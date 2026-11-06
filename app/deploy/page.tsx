import type { Metadata } from "next";
import DeployForm from "@/components/DeployForm";
import Reveal from "@/components/Reveal";
import { Heading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Deploy",
  description:
    "Configure a fee-funded mining rig for a new coin and see, before you launch it, whether the thing pays for itself.",
};

export default function Deploy() {
  return (
    <section className="room min-h-svh pt-24">
      <div className="mx-auto max-w-[1320px] px-4 py-12 md:px-6 md:py-16">
        <Reveal>
          <Heading kicker="Deploy">Configure the rig.</Heading>
          <p className="mt-4 max-w-2xl font-mono text-[13px] leading-relaxed text-label">
            A launch form that is mostly a calculator. Set the fee, split it, pick what to rent and what to
            point it at, and the panel on the right will tell you what the rig actually returns — including,
            most of the time, that it returns less than it costs.
          </p>
        </Reveal>
        <div className="mt-12">
          <DeployForm />
        </div>
      </div>
    </section>
  );
}
