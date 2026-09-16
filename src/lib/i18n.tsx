import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "fr";

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    "nav.collection": "Collection",
    "nav.lookbooks": "Lookbooks",
    "nav.exhibitions": "Lookbooks",
    "nav.craftsmen": "Craftsmen",
    "nav.artists": "Craftsmen",
    "nav.services": "Services",
    "nav.journal": "Journal",
    "nav.about": "About",
    "nav.visit": "Showroom",
    "cta.buy": "Shop Now",
    "cta.acquire": "Shop Now",
    "cta.inquire": "Enquire",
    "cta.signIn": "Sign in",
    "cta.signOut": "Sign out",
    "cta.viewCollection": "View collection",
    "cta.compare": "Compare",
    "cta.addCompare": "Add to compare",
    "cta.remove": "Remove",
    "cta.chat": "Chat with us",
    "cta.view360": "View 360°",
    "cta.viewAR": "Try on your look",
    "footer.tagline": "Where Tradition Meets Timeless Elegance",
    "footer.authenticity": "Where Tradition Meets Timeless Elegance",
    "footer.visit": "Showroom",
    "footer.gallery": "Jewellery",
    "footer.services": "Services",
    "footer.policies": "Policies",
    "footer.contact": "Contact",
  },
  hi: {
    "nav.collection": "संग्रह",
    "nav.lookbooks": "लुकबुक",
    "nav.exhibitions": "लुकबुक",
    "nav.craftsmen": "कारीगर",
    "nav.artists": "कारीगर",
    "nav.services": "सेवाएँ",
    "nav.journal": "जर्नल",
    "nav.about": "परिचय",
    "nav.visit": "शोरूम",
    "cta.buy": "अभी खरीदें",
    "cta.acquire": "अभी खरीदें",
    "cta.inquire": "पूछताछ",
    "cta.signIn": "साइन इन",
    "cta.signOut": "साइन आउट",
    "cta.viewCollection": "संग्रह देखें",
    "cta.compare": "तुलना करें",
    "cta.addCompare": "तुलना में जोड़ें",
    "cta.remove": "हटाएँ",
    "cta.chat": "हमसे बात करें",
    "cta.view360": "360° देखें",
    "cta.viewAR": "पहन कर देखें",
    "footer.tagline": "परंपरा और समयहीन सौंदर्य का मिलन",
    "footer.authenticity": "परंपरा और समयहीन सौंदर्य का मिलन",
    "footer.visit": "शोरूम",
    "footer.gallery": "आभूषण",
    "footer.services": "सेवाएँ",
    "footer.policies": "नीतियाँ",
    "footer.contact": "संपर्क",
  },
  fr: {
    "nav.collection": "Collection",
    "nav.lookbooks": "Lookbooks",
    "nav.exhibitions": "Lookbooks",
    "nav.craftsmen": "Artisans",
    "nav.artists": "Artisans",
    "nav.services": "Services",
    "nav.journal": "Journal",
    "nav.about": "À propos",
    "nav.visit": "Showroom",
    "cta.buy": "Acheter",
    "cta.acquire": "Acheter",
    "cta.inquire": "Renseignement",
    "cta.signIn": "Connexion",
    "cta.signOut": "Déconnexion",
    "cta.viewCollection": "Voir la collection",
    "cta.compare": "Comparer",
    "cta.addCompare": "Ajouter à la comparaison",
    "cta.remove": "Retirer",
    "cta.chat": "Nous contacter",
    "cta.view360": "Vue 360°",
    "cta.viewAR": "Essayer le look",
    "footer.tagline": "Là où la tradition rencontre l'élégance intemporelle",
    "footer.authenticity": "Là où la tradition rencontre l'élégance intemporelle",
    "footer.visit": "Showroom",
    "footer.gallery": "Bijouterie",
    "footer.services": "Services",
    "footer.policies": "Politiques",
    "footer.contact": "Contact",
  },
};

const LABEL: Record<Lang, string> = { en: "EN", hi: "हिं", fr: "FR" };
const LOCALE: Record<Lang, string> = { en: "en", hi: "hi-IN", fr: "fr-FR" };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string; locale: string };
const I18nContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "raajsi.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (v && v in DICT) setLangState(v);
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = LOCALE[lang];
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };
  const t = (k: string) => DICT[lang][k] ?? DICT.en[k] ?? k;
  return (
    <I18nContext.Provider value={{ lang, setLang, t, locale: LOCALE[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx)
    return {
      lang: "en" as Lang,
      setLang: () => {},
      t: (k: string) => DICT.en[k] ?? k,
      locale: "en",
    };
  return ctx;
}

export const LANGS: Lang[] = ["en", "hi", "fr"];

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <label
      className={`inline-flex items-center gap-1 text-[11px] tracking-widest uppercase ${className}`}
    >
      <span className="sr-only">Language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="bg-transparent border-0 focus:outline-none cursor-pointer font-medium"
        aria-label="Language"
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {LABEL[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
