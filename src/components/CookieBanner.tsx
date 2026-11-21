"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Cookie, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "welcome-cookie-consent";
const CONSENT_EVENT = "welcome-cookie-consent-change";
const GA_ID = "G-P877RD6HJH";

type ConsentChoice = "accepted" | "refused";

let currentChoice: ConsentChoice | null = null;

function readConsent(): ConsentChoice | null {
  if (currentChoice) return currentChoice;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "accepted" || saved === "refused" ? saved : null;
  } catch {
    return null;
  }
}

function updateGoogleConsent(choice: ConsentChoice | null) {
  const win = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
  };
  const accepted = choice === "accepted";

  Object.assign(win, { [`ga-disable-${GA_ID}`]: !accepted });
  win.gtag?.("consent", "update", {
    analytics_storage: accepted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function subscribeToConsent(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== STORAGE_KEY) return;

    currentChoice = null;
    updateGoogleConsent(readConsent());
    onChange();
  }

  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function saveConsent(choice: ConsentChoice) {
  currentChoice = choice;
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* Le choix reste disponible pour cette page. */
  }

  updateGoogleConsent(choice);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

const noSubscription = () => () => undefined;

export function CookieBanner({ manage = false }: { manage?: boolean }) {
  const t = useTranslations("cookieBanner");
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  const accept = () => saveConsent("accepted");
  const refuse = () => saveConsent("refused");

  if (manage) {
    return (
      <section className="mt-8 flex flex-wrap gap-3" aria-label={t("manage")}>
        <button
          type="button"
          onClick={refuse}
          aria-pressed={consent === "refused"}
          className="rounded-xl border border-welcome-black/10 px-5 py-3 font-semibold text-welcome-black aria-pressed:bg-welcome-cream"
        >
          {t("refuseAnalytics")}
        </button>
        <button
          type="button"
          onClick={accept}
          aria-pressed={consent === "accepted"}
          className="rounded-xl border border-welcome-black/10 px-5 py-3 font-semibold text-welcome-black aria-pressed:bg-welcome-gold"
        >
          {t("acceptAnalytics")}
        </button>
      </section>
    );
  }

  if (consent === "accepted") return <GoogleAnalytics gaId={GA_ID} />;
  if (!hydrated || consent === "refused") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-4 rounded-[20px] border border-welcome-black/[0.08] bg-welcome-white/95 p-5 shadow-[0_12px_40px_rgba(11,11,11,0.14)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-welcome-gold/15">
          <Cookie className="h-5 w-5 text-welcome-gold" strokeWidth={1.6} />
        </div>

        <div className="flex-1">
          <p className="font-manrope text-[15px] font-semibold text-welcome-black">{t("title")}</p>

          <p className="mt-1 font-inter text-[13.5px] leading-[1.6] text-welcome-body">
            {t("text")}{" "}
            <Link
              href="/politique-de-cookies"
              className="font-medium text-welcome-gold underline-offset-4 hover:underline"
            >
              {t("more")}
            </Link>
            {" · "}
            <Link
              href="/gestion-des-cookies"
              className="font-medium text-welcome-gold underline-offset-4 hover:underline"
            >
              {t("manage")}
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refuse}
            className="inline-flex h-[46px] items-center justify-center rounded-[12px] border border-welcome-black/10 px-5 font-manrope text-[14.5px] font-semibold text-welcome-black transition-colors hover:bg-welcome-cream"
          >
            {t("refuseAnalytics")}
          </button>

          <button
            type="button"
            onClick={accept}
            className="inline-flex h-[46px] items-center justify-center rounded-[12px] bg-welcome-gold px-6 font-manrope text-[14.5px] font-semibold text-[#0b0b0b] transition-transform duration-200 hover:-translate-y-[1px]"
          >
            {t("acceptAnalytics")}
          </button>

          <button
            type="button"
            onClick={refuse}
            aria-label={t("close")}
            className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-welcome-black/10 text-welcome-body transition-colors hover:bg-welcome-cream"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
