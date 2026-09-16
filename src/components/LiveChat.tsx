import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Msg = { from: "gallery" | "you"; text: string; ts: number };

const REPLIES: Record<string, string[]> = {
  en: [
    "Thank you — a jewellery specialist will be with you shortly. Meanwhile, feel free to browse our collection or share the work you're interested in.",
    "That's a beautiful choice. Would you like more details on provenance, framing, or shipping?",
    "We're happy to arrange a private viewing at the gallery, or a video walkthrough — whichever you prefer.",
  ],
  hi: [
    "धन्यवाद — गैलरी निदेशक शीघ्र ही आपसे संपर्क करेंगे। तब तक हमारा संग्रह देखें।",
    "बहुत सुंदर चुनाव है। क्या आप प्रामाणिकता, फ़्रेमिंग या शिपिंग के बारे में और जानना चाहेंगे?",
    "हम व्यक्तिगत दर्शन या वीडियो टूर का आयोजन ख़ुशी से कर सकते हैं।",
  ],
  fr: [
    "Merci — un directeur de la galerie vous répondra sous peu. En attendant, parcourez notre collection.",
    "Un très beau choix. Souhaitez-vous plus de détails sur la provenance, l'encadrement ou l'expédition ?",
    "Nous pouvons organiser une visite privée à la galerie ou une visite vidéo, selon votre préférence.",
  ],
};

export function LiveChat() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ from: "gallery", text: REPLIES[lang]?.[0] ?? REPLIES.en[0], ts: Date.now() }]);
    }
  }, [open, lang, msgs.length]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { from: "you", text, ts: Date.now() }]);
    const bank = REPLIES[lang] ?? REPLIES.en;
    const reply = bank[Math.min(msgs.filter((m) => m.from === "gallery").length, bank.length - 1)];
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "gallery", text: reply, ts: Date.now() }]);
    }, 900);
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("cta.chat")}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-[color:var(--accent)] text-[color:var(--accent-foreground)] shadow-lg flex items-center justify-center hover:brightness-110 transition"
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-4 z-40 w-[92vw] max-w-sm h-[70vh] max-h-[520px] bg-paper border border-hairline shadow-2xl flex flex-col">
          <div className="p-4 border-b border-hairline">
            <div className="eyebrow">Raajsi Jewels · Live</div>
            <div className="font-serif text-lg">{t("cta.chat")}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Typically replies in a few minutes.
            </div>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "you" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[80%] px-3 py-2 text-sm leading-snug " +
                    (m.from === "you"
                      ? "bg-ink text-paper"
                      : "bg-mist text-ink border border-hairline")
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="border-t border-hairline p-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 bg-transparent border border-hairline px-3 py-2 text-sm focus:outline-none focus:border-ink"
            />
            <button
              type="submit"
              aria-label="Send"
              className="w-10 h-10 flex items-center justify-center bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
