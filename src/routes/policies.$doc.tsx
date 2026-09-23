import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHero, KineticTitle } from "@/components/PageHero";

import {
  SITE_NAME,
  SITE_LOCALE,
  canonical,
  defaultOgImage,
  breadcrumbSchema,
  faqSchema,
} from "@/components/seo-head";

// ── Per-doc SEO titles and descriptions ──────────────────────────────
const DOC_SEO: Record<string, { seoTitle: string; seoDesc: string }> = {
  terms: {
    seoTitle: "Terms & Conditions — Raajsi Jewels | Jaipur Jewellery Store",
    seoDesc:
      "Read the Terms & Conditions for shopping at Raajsi Jewels. Policies on orders, payments, pricing, and more.",
  },
  privacy: {
    seoTitle: "Privacy Policy — Raajsi Jewels | Data Protection",
    seoDesc:
      "Raajsi Jewels privacy policy. How we collect, use, and protect your personal data when you shop with us.",
  },
  shipping: {
    seoTitle:
      "Shipping & Delivery Policy — Raajsi Jewels | Free Delivery Above ₹999",
    seoDesc:
      "Free delivery on orders above ₹999 across India. Learn about Raajsi Jewels shipping timelines, tracking, and delivery policy.",
  },
  returns: {
    seoTitle: "Returns & Exchange Policy — Raajsi Jewels | 7 Days Exchange",
    seoDesc:
      "Easy 7-day exchange policy at Raajsi Jewels. Learn about our returns process, eligibility, and refund timelines.",
  },
  faqs: {
    seoTitle:
      "FAQs — Raajsi Jewels | Sterling Silver & Handcrafted Jewellery Questions",
    seoDesc:
      "Frequently asked questions about Raajsi Jewels collections, 925 Sterling Silver, shipping, exchanges, and contacting us.",
  },
};

// ── FAQ structured data (extracted for JSON-LD) ──────────────────────
const FAQ_ITEMS = [
  {
    question: "What are the two core collections at Raajsi?",
    answer:
      "Raajsi features two distinct collections: 1) 925 Silver (Sterling Silver 925) — Modern, minimal, and elegant everyday jewellery. 2) Handcrafted Jewels — Artisanal, expressive Kundan, Polki, and Meenakari masterpieces.",
  },
  {
    question: "Are your silver pieces genuine 925 Sterling Silver?",
    answer:
      "Yes! Every piece in our silver collection is crafted in genuine 925 Sterling Silver and certified.",
  },
  {
    question: "Is shipping free?",
    answer:
      "Free Delivery is provided on all orders above ₹999 across India.",
  },
  {
    question: "Can I exchange my order?",
    answer:
      "Yes, we provide an easy 7-day exchange policy from the date of purchase.",
  },
  {
    question: "How can I reach the Raajsi team?",
    answer:
      "You can reach us via WhatsApp/Phone at +91 98291 45129 or +91 70149 38562, or by email at raajsiforms@gmail.com. We are located in Jaipur, Rajasthan, India.",
  },
];

const DOCS: Record<string, { title: string; lede: string; body: string }> = {
  terms: {
    title: "Terms & Conditions",
    lede: "Welcome to Raajsi Jewels. These Terms & Conditions govern your use of our website and purchase of products.",
    body: `Welcome to Raajsi Jewels. These Terms & Conditions govern your use of our website and your purchase of any products from us. By accessing this website or placing an order, you agree to be bound by these terms. Please read them carefully.

1. About Us
Raajsi Jewels is a Jaipur-based fine jewellery brand dealing in Kundan, Polki, Meenakari and related handcrafted jewellery, as well as 925 Sterling Silver. Our GST registration number is 08UQDPS5127K1ZY.

2. Eligibility
By using this website and placing an order, you confirm that you are at least 18 years of age or are placing an order under the supervision of a parent or legal guardian, and that you have the legal capacity to enter into a binding contract.

3. Products & Descriptions
• We make every effort to display our products, their colours, and details as accurately as possible. However, slight variations in colour, finish, or stone placement may occur due to the handcrafted nature of the jewellery, photography, or screen display settings.
• All jewellery listed as hallmarked is BIS Hallmark certified where applicable.
• Product images are for illustrative purposes; minor variations from the actual product are possible.

4. Pricing
• All prices listed on the website are in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.
• We reserve the right to change prices at any time without prior notice. The price applicable at the time of order confirmation will be honoured.
• In the event of a pricing error on the website, we reserve the right to cancel the order and issue a full refund.

5. Orders & Payment
• Orders are confirmed only after successful payment through our payment partner, Razorpay.
• We accept payments via cards, UPI, net banking, and wallets, as supported by Razorpay.
• We reserve the right to refuse or cancel any order at our discretion, including in cases of suspected fraud, pricing errors, or unavailability of stock. In such cases, a full refund will be processed.

6. Shipping, Exchange & Returns
Shipping timelines and our exchange policy are as it is available to exchange in under 7 days of purchase. Free delivery is provided on all orders above ₹999.

7. Intellectual Property
All content on this website, including but not limited to images, logos, product designs, text, and graphics, is the property of Raajsi Jewels and is protected under applicable intellectual property laws. No content may be copied, reproduced, or used without our prior written consent.

8. Limitation of Liability
Raajsi Jewels shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or products purchased, except as required under applicable Indian law.

9. Governing Law & Jurisdiction
These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan.

10. Changes to These Terms
We reserve the right to update or modify these Terms & Conditions at any time without prior notice. Continued use of the website after changes are posted constitutes your acceptance of the revised terms.

11. Contact Us
Raajsi Jewels
Jaipur, Rajasthan, India
Email: raajsiforms@gmail.com
Phone: +91 98291 45129 / +91 70149 38562
GST: 08UQDPS5127K1ZY`,
  },
  privacy: {
    title: "Privacy Policy",
    lede: "How Raajsi Jewels collects, protects, and respects your privacy.",
    body: `At Raajsi Jewels, we value your trust and are committed to safeguarding your privacy.

1. Information We Collect
We collect personal details you provide during order placement, account registration, or contact inquiries — including your name, contact phone number, shipping address, and email address.

2. How We Use Your Information
Your data is used strictly to process orders, facilitate secure delivery through reputed shipping carriers, issue order updates, provide customer support, and communicate important service notifications.

3. Payment Security
We do not store or process your credit/debit card numbers, UPI PINs, or net banking credentials on our servers. All financial transactions are securely processed by Razorpay through encrypted SSL channels.

4. Non-Disclosure
Raajsi Jewels does not sell, trade, or rent your personal information to third parties. Data is shared exclusively with logistics partners solely for delivery purposes.

5. Your Rights & Contact
You have the right to request access to or deletion of your personal details stored with us. For inquiries, email raajsiforms@gmail.com or call +91 98291 45129.`,
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    lede: "Complimentary delivery on orders above ₹999, insured directly from our Jaipur atelier.",
    body: `1. Free Delivery Threshold
Enjoy FREE insured doorstep delivery across India on all orders above ₹999. For orders under ₹999, a nominal standard delivery charge of ₹99 is applicable.

2. Dispatch Timelines
All in-stock pieces are dispatched within 1–2 business days from our Jaipur workshop. Custom orders or personalized handcrafted creations are crafted to perfection and dispatched within 5–7 business days.

3. Transit & Tracking
Domestic orders typically arrive within 3–6 business days depending on location. Once your order is dispatched, you will receive a real-time tracking number (e.g., RJ-XXXXXX) viewable in your "My Orders" dashboard.

4. Insured Packaging
Every Raajsi parcel is packed in tamper-evident, secure luxury packaging and is 100% transit-insured until signed for at your door.`,
  },
  returns: {
    title: "7 Days Exchange & Returns",
    lede: "Shop with peace of mind. Exchange within 7 days of purchase.",
    body: `1. 7 Days Exchange Guarantee
We want you to love your Raajsi creation. We offer a hassle-free 7-day exchange window from the date of purchase/delivery for unworn, unaltered jewellery in original packaging with all security tags intact.

2. Exchange Procedure
To initiate an exchange:
• Email us at raajsiforms@gmail.com or WhatsApp us at +91 98291 45129 / +91 70149 38562.
• Provide your Order Number and photos of the item you wish to exchange.
• Our team will arrange pickup or provide return transit instructions.

3. Eligibility Criteria
Items must show no signs of wear, sizing modifications, or damage. Custom commissions and engraved pieces are subject to specific review.

4. Refunds
In case of accepted cancellation or verified product defect, refunds are processed via Razorpay directly back to your original payment method within 5–7 banking days.`,
  },
  faqs: {
    title: "Frequently Asked Questions",
    lede: "Common inquiries regarding 925 Sterling Silver, Handcrafted Jewels, and orders.",
    body: `Q: What are the two core collections at Raajsi?
A: Raajsi features two distinct collections:
1. 925 Silver (Sterling Silver 925): Modern, minimal, and elegant everyday jewellery.
2. Handcrafted Jewels: Artisanal, expressive Kundan, Polki, and Meenakari masterpieces.

Q: Are your silver pieces genuine 925 Sterling Silver?
A: Yes! Every piece in our silver collection is crafted in genuine 925 Sterling Silver and certified.

Q: Is shipping free?
A: Free Delivery is provided on all orders above ₹999 across India.

Q: Can I exchange my order?
A: Yes, we provide an easy 7-day exchange policy from the date of purchase.

Q: How can I reach the Raajsi team?
A: You can reach us via WhatsApp/Phone at +91 98291 45129 or +91 70149 38562, or by email at raajsiforms@gmail.com. We are located in Jaipur, Rajasthan, India.`,
  },
};

export const Route = createFileRoute("/policies/$doc")({
  loader: ({ params }) => {
    const d = DOCS[params.doc];
    if (!d) throw notFound();
    return { ...d, docKey: params.doc };
  },
  head: ({ loaderData, params }) => {
    const seo = DOC_SEO[params.doc];
    const title = seo?.seoTitle ?? (loaderData ? `${loaderData.title} — Raajsi Jewels` : "Policies — Raajsi Jewels");
    const description = seo?.seoDesc ?? loaderData?.lede ?? "Raajsi Jewels policies.";
    const url = canonical(`/policies/${params.doc}`);

    const scripts: Array<{ type: string; children: string }> = [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", url: canonical("/") },
            { name: loaderData?.title ?? "Policy", url },
          ]),
        ),
      },
    ];

    // Add FAQPage JSON-LD for the FAQs page
    if (params.doc === "faqs") {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(faqSchema(FAQ_ITEMS)),
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: defaultOgImage() },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: SITE_LOCALE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: defaultOgImage() },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
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
