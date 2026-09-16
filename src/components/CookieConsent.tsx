import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, Shield, X, Check, Settings } from "lucide-react";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

const STORAGE_KEY = "kalaneri_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    preferences: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Show banner after short delay for smooth page entrance
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (preferences: CookiePreferences) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...preferences, timestamp: new Date().toISOString() }),
    );
    setVisible(false);
    setModalOpen(false);
  };

  const handleAcceptAll = () => {
    const all = { essential: true, analytics: true, preferences: true };
    setPrefs(all);
    saveConsent(all);
  };

  const handleEssentialOnly = () => {
    const essentialOnly = { essential: true, analytics: false, preferences: false };
    setPrefs(essentialOnly);
    saveConsent(essentialOnly);
  };

  const handleSaveCustom = () => {
    saveConsent(prefs);
  };

  if (!visible) return null;

  return (
    <>
      {/* Floating Bottom Banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-paper border border-hairline p-5 shadow-2xl rounded-sm text-ink space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Cookie size={16} className="text-[color:var(--accent)] shrink-0" />
              <h4 className="font-serif text-base font-medium">Cookie Preferences</h4>
            </div>
            <button
              onClick={handleEssentialOnly}
              className="text-ink/40 hover:text-ink transition-colors p-1"
              aria-label="Close cookie banner"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-ink/70 leading-relaxed">
            We use cookies to maintain your active cart, session state, currency choices, and
            enhance gallery browsing.{" "}
            <Link
              to="/policies/$doc"
              params={{ doc: "privacy" }}
              className="underline hover:text-ink"
            >
              Read Privacy Policy
            </Link>
            .
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-hairline">
            <button onClick={handleAcceptAll} className="cta-red !py-1.5 !px-3 text-[10px]">
              Accept All
            </button>
            <button onClick={handleEssentialOnly} className="cta-ghost !py-1.5 !px-3 text-[10px]">
              Essential Only
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="text-[10px] tracking-widest uppercase text-ink/60 hover:text-ink px-2 py-1.5 flex items-center gap-1 transition-colors ml-auto"
            >
              <Settings size={12} /> Customise
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-paper border border-hairline p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[color:var(--accent)]" />
                <h3 className="font-serif text-lg text-ink">Customise Privacy Preferences</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-ink/40 hover:text-ink p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Essential */}
              <div className="p-3 border border-hairline bg-mist/40 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink flex items-center gap-1.5">
                    Essential Cookies{" "}
                    <span className="text-[9px] uppercase tracking-wider text-ink/40 bg-hairline px-1.5 py-0.5">
                      Required
                    </span>
                  </div>
                  <p className="text-ink/60 mt-1 text-[11px]">
                    Required for basic site operations including login session, shopping cart state,
                    and currency preferences.
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
              </div>

              {/* Analytics */}
              <div className="p-3 border border-hairline flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">Analytics & Performance</div>
                  <p className="text-ink/60 mt-1 text-[11px]">
                    Helps us understand artwork views and gallery engagement to improve curation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                  className="w-4 h-4 accent-[color:var(--accent)] shrink-0 mt-0.5 cursor-pointer"
                />
              </div>

              {/* Preferences */}
              <div className="p-3 border border-hairline flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">Personalisation</div>
                  <p className="text-ink/60 mt-1 text-[11px]">
                    Remembers your recently viewed works and wishlist items across sessions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.preferences}
                  onChange={(e) => setPrefs({ ...prefs, preferences: e.target.checked })}
                  className="w-4 h-4 accent-[color:var(--accent)] shrink-0 mt-0.5 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-hairline flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="cta-ghost text-xs">
                Cancel
              </button>
              <button onClick={handleSaveCustom} className="cta-red text-xs">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
