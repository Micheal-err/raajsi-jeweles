import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHero, KineticTitle } from "@/components/PageHero";

const DOCS: Record<string, { title: string; lede: string; body: string }> = {
  privacy: {
    title: "Privacy",
    lede: "What we collect, why, and how you can ask us to forget it.",
    body: `We collect only what we need to serve you — your name, contact, and the works you inquire about. We do not sell data. We share it only with the delivery partners required to fulfill your order.\n\nWrite to hello@raajsijewels.com to review or delete anything we hold.`,
  },
  terms: {
    title: "Terms",
    lede: "The quiet agreement behind every acquisition.",
    body: `All prices displayed are indicative unless confirmed by a director. Works remain the property of Raajsi Jewels until payment is cleared. Provenance certificates are issued in the buyer's name and are non-transferrable without our endorsement.`,
  },
  shipping: {
    title: "Shipping",
    lede: "White-glove crating, insured freight, and installation.",
    body: `Within India: 7–14 working days from confirmation, fully insured. International: 3–5 weeks, DDP quotes on request. All works are crated to museum standards; installation is included in six Indian cities.`,
  },
  returns: {
    title: "Returns",
    lede: "Two weeks, no questions.",
    body: `Every acquisition may be returned within 14 days of receipt for a full refund, less freight. Bespoke commissions are non-returnable but may be reviewed for restoration or exchange within the same artist's studio.`,
  },
};

export const Route = createFileRoute("/policies/$doc")({
  loader: ({ params }) => {
    const d = DOCS[params.doc];
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Raajsi Jewels` : "Policies — Raajsi Jewels" },
      { name: "description", content: loaderData?.lede ?? "Raajsi Jewels policies." },
      { property: "og:title", content: loaderData?.title ?? "Policies" },
      { property: "og:description", content: loaderData?.lede ?? "Raajsi Jewels policies." },
    ],
  }),
  component: PolicyPage,
  notFoundComponent: () => <div className="container-editorial py-24">Not found.</div>,
});

function PolicyPage() {
  const d = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="Policies"
        title={<KineticTitle>{d.title}</KineticTitle>}
        lede={d.lede}
        visual="about"
      />
      <section className="container-editorial py-16 md:py-24 max-w-2xl">
        <div className="whitespace-pre-line text-lg leading-relaxed">{d.body}</div>
      </section>
    </>
  );
}
