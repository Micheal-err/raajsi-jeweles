import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHero, KineticTitle } from "@/components/PageHero";

const DOCS: Record<string, { title: string; lede: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    lede: "How we protect your personal information and respect your privacy.",
    body: `We collect only what is necessary to deliver an exceptional Raajsi experience — your name, shipping address, contact details, and inquiry preferences. We do not sell or rent your personal data to third parties. Information is securely shared only with verified logistics partners to fulfill your orders.\n\nTo update your preferences or request data deletion, contact our concierge at care@raajsi.com.`,
  },
  terms: {
    title: "Terms & Conditions",
    lede: "Guidelines governing your acquisitions and interactions with Raajsi.",
    body: `All jewellery specifications, metals (including 925 Sterling Silver), gemstones, and craftsmanship details are described with accuracy. Raajsi reserves the right to verify orders prior to dispatch. Each piece comes with our certificate of authenticity.\n\nFor custom or personalized commissions, production begins upon formal design confirmation.`,
  },
  shipping: {
    title: "Shipping & Delivery",
    lede: "Insured, tamper-evident delivery from our Jaipur atelier directly to your door.",
    body: `Domestic Shipping (India): Standard delivery arrives within 3–7 business days. Express shipping is available for major metropolitan cities (2–3 business days). All shipments are fully insured and tracked in real time.\n\nInternational Shipping: Orders are dispatched via reputed global couriers (DHL / FedEx) and typically arrive within 7–14 business days. Custom duties and local taxes, if applicable, are handled as per destination country regulations.`,
  },
  returns: {
    title: "Returns & Exchange",
    lede: "Our commitment to your complete satisfaction with every Raajsi creation.",
    body: `We offer a 7-day return and exchange window from the date of delivery for unworn, unaltered jewellery in its original packaging with all security tags intact.\n\nTo initiate a return or exchange, simply contact our support team at care@raajsi.com or message us via WhatsApp with your order details. Once inspected at our Jaipur studio, refunds are processed within 5–7 business days to the original payment method.`,
  },
  faqs: {
    title: "Frequently Asked Questions",
    lede: "Answers to common questions about Raajsi jewellery, authenticity, care, and orders.",
    body: `Q: Are your silver pieces genuine 925 Sterling Silver?
A: Yes, every piece in our Sterling Silver collection is crafted in genuine 925 Sterling Silver, offering a refined, hypoallergenic, and timeless finish.

Q: What makes the Handcrafted Jewels collection unique?
A: Our Handcrafted collection celebrates artistic character and Jaipur's celebrated artisanal heritage. Each piece is inspired by distinctive forms, textures, colours, and traditional influences designed for modern wear.

Q: How can I care for my Raajsi jewellery?
A: Store each item individually in your Raajsi luxury box or moisture-free pouch. Avoid exposure to perfumes, lotions, and harsh chemicals. Gently buff silver with a soft microfiber cloth to preserve its radiant shine.

Q: Can I place an order for gifting?
A: Absolutely. Every Raajsi creation arrives in elegant gift-ready signature packaging. You can also include a personalized handwritten message at checkout.

Q: How do I contact the Raajsi team?
A: You can reach us via WhatsApp at +91 98290 12345, email us at care@raajsi.com, or send a message through our Contact page. We are delighted to assist you.`,
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
