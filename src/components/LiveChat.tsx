import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Phone, ExternalLink } from "lucide-react";

type Msg = { from: "concierge" | "you"; text: string; ts: number; isWhatsappLink?: boolean };

const WHATSAPP_PHONE = "919829145129";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  "Hello Raajsi Jewels! I would like to inquire about your jewellery / custom jewellery."
)}`;

const QUICK_ACTIONS = [
  { label: "✨ Custom Jewellery", query: "Can you make customized jewellery with reference?" },
  { label: "🚚 Shipping & Delivery", query: "What is your shipping cost and delivery policy?" },
  { label: "💎 925 Silver & Hallmark", query: "Are your silver pieces certified 925 Sterling Silver?" },
  { label: "💬 Chat on WhatsApp", isWhatsapp: true },
];

function getBotReply(userText: string): { text: string; isWhatsappLink?: boolean } {
  const t = userText.toLowerCase();

  if (t.includes("custom") || t.includes("reference") || t.includes("bespoke") || t.includes("order")) {
    return {
      text: "WE MAKE CUSTOMIZED JEWELLERY WITH REFERENCE TOO! ✨\n\nShare your reference photo, sketch, or design ideas with us on WhatsApp (+91 98291 45129 or +91 70149 38562) or email raajsiforms@gmail.com. Our Jaipur artisans will craft your custom piece to perfection!",
      isWhatsappLink: true,
    };
  }

  if (t.includes("ship") || t.includes("deliver") || t.includes("cost") || t.includes("charges") || t.includes("999") || t.includes("free")) {
    return {
      text: "Free Delivery is provided on all orders above ₹999 across India! 🚚\n\nFor orders under ₹999, a nominal standard delivery charge of ₹99 is applicable. All parcels are 100% transit-insured from our Jaipur atelier.",
    };
  }

  if (t.includes("exchange") || t.includes("return")) {
    return {
      text: "We offer an easy 7-day exchange window from the date of delivery for all unworn jewellery in its original packaging with tags intact. Contact us via WhatsApp or email to initiate an exchange.",
    };
  }

  if (t.includes("silver") || t.includes("hallmark") || t.includes("authentic") || t.includes("pure") || t.includes("certificate")) {
    return {
      text: "Every piece in our collection is crafted in genuine 925 Sterling Silver or authentic Kundan/Polki gold craftsmanship, complete with official BIS Hallmarking certification.",
    };
  }

  if (t.includes("contact") || t.includes("number") || t.includes("phone") || t.includes("call") || t.includes("location") || t.includes("jaipur")) {
    return {
      text: "📍 Raajsi Jewels, Jaipur, Rajasthan, India.\n📞 Phone / WhatsApp: +91 98291 45129 or +91 70149 38562\n✉️ Email: raajsiforms@gmail.com\n\nWe are happy to assist you anytime!",
      isWhatsappLink: true,
    };
  }

  return {
    text: "Thank you for contacting Raajsi Jewels! A jewellery specialist is here to assist you. WE MAKE CUSTOMIZED JEWELLERY WITH REFERENCE TOO. You can also chat with us directly on WhatsApp for real-time video walkthroughs & custom design consultations.",
    isWhatsappLink: true,
  };
}

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([
        {
          from: "concierge",
          text: "Namaste! Welcome to Raajsi Jewels, Jaipur.\n\nHow can we assist you with our 925 Sterling Silver & Handcrafted Jewellery collections today? ✨",
          ts: Date.now(),
        },
      ]);
    }
  }, [open, msgs.length]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [msgs, open]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;
    setInput("");

    setMsgs((prev) => [...prev, { from: "you", text, ts: Date.now() }]);

    setTimeout(() => {
      const reply = getBotReply(text);
      setMsgs((prev) => [
        ...prev,
        {
          from: "concierge",
          text: reply.text,
          isWhatsappLink: reply.isWhatsappLink,
          ts: Date.now(),
        },
      ]);
    }, 600);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-paper/95 text-ink border border-hairline shadow-lg text-xs font-serif italic hover:shadow-xl transition-all hover:scale-102 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Chat with us · Jaipur Atelier</span>
          </button>
        )}

        <button
          type="button"
          aria-label="Open live chat concierge"
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-ink text-paper shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-hairline relative group"
          style={{ background: open ? "var(--ink)" : "var(--gold, #b8860b)" }}
        >
          {open ? (
            <X size={22} className="text-paper" />
          ) : (
            <>
              <MessageCircle size={24} className="text-paper" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-paper rounded-full" />
            </>
          )}
        </button>
      </div>

      {/* Chat Window Modal */}
      {open && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[92vw] max-w-sm h-[72vh] max-h-[560px] bg-paper border border-hairline shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 border-b border-hairline bg-mist/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[color:var(--gold)]/20 border border-[color:var(--gold)]/40 flex items-center justify-center text-[color:var(--gold)]">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="font-serif font-semibold text-ink text-sm leading-tight">
                  Raajsi Jewellery Concierge
                </div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Online · Jaipur, India</span>
                </div>
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1.5 bg-emerald-600 text-white rounded-xs hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
              title="Open WhatsApp chat"
            >
              <span>WhatsApp</span>
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Quick Notice */}
          <div className="bg-ink text-[#fcf9f2] text-[10px] py-1.5 px-3 text-center tracking-wide border-b border-hairline">
            ✦ Free Delivery Above ₹999 · Customized Jewellery with Reference ✦
          </div>

          {/* Messages Area */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfbf7]/60">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={m.from === "you" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.from === "you"
                      ? "bg-ink text-paper rounded-xs"
                      : "bg-paper text-ink border border-hairline shadow-xs rounded-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.isWhatsappLink && (
                    <div className="mt-2.5 pt-2 border-t border-hairline">
                      <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        <Phone size={11} />
                        <span>Chat directly on WhatsApp (+91 98291 45129) →</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Chips */}
          <div className="p-2.5 border-t border-hairline bg-paper/95 overflow-x-auto flex gap-1.5 scrollbar-none">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (action.isWhatsapp) {
                    window.open(WHATSAPP_URL, "_blank");
                  } else if (action.query) {
                    handleSend(action.query);
                  }
                }}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] border border-hairline bg-mist/40 hover:bg-mist text-ink/80 hover:text-ink transition-colors rounded-xs shrink-0"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-hairline p-2.5 bg-paper flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about 925 silver, custom jewellery, shipping…"
              className="flex-1 bg-transparent border border-hairline px-3 py-2 text-xs focus:outline-none focus:border-ink placeholder:text-ink/40"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="w-9 h-9 flex items-center justify-center bg-ink text-paper hover:bg-ink/90 transition-colors disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
