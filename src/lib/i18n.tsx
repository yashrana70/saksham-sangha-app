import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Lang = "en" | "hi";

const dict: Record<string, { en: string; hi: string }> = {
  app_name: { en: "Saksham Sadhu Sang", hi: "सक्षम साधु संग" },
  app_tagline: { en: "Aapka Saksham Path", hi: "आपका सक्षम पथ" },
  inspired_by: {
    en: "🌿 Inspired by the teachings of His Divine Grace A.C. Bhaktivedanta Swami Srila Prabhupada",
    hi: "🌿 परम पूज्य ए.सी. भक्तिवेदान्त स्वामी श्रील प्रभुपाद की शिक्षाओं से प्रेरित",
  },
  initiative: {
    en: "🏛️ A Devotional Initiative under ISKCON Ayodhya",
    hi: "🏛️ इस्कॉन अयोध्या के अंतर्गत एक भक्तिमय पहल",
  },
  hare_krishna: { en: "Hare Krishna 🙏", hi: "हरे कृष्ण 🙏" },
  welcome: { en: "Welcome", hi: "स्वागत है" },
  language: { en: "Language", hi: "भाषा" },
  english: { en: "English", hi: "अंग्रेज़ी" },
  hindi: { en: "Hindi", hi: "हिन्दी" },

  nav_dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  nav_profile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल" },
  nav_submit: { en: "Submit Sadhna", hi: "साधना भरें" },
  nav_reports: { en: "Sadhna Reports", hi: "साधना रिपोर्ट" },
  nav_sadhna_cal: { en: "Sadhna Calendar", hi: "साधना कैलेंडर" },
  nav_vaishnav_cal: { en: "Vaishnav Calendar", hi: "वैष्णव कैलेंडर" },
  nav_todo: { en: "My To-Do List", hi: "मेरी कार्य सूची" },
  nav_leaderboard: { en: "Leaderboard", hi: "लीडरबोर्ड" },
  nav_hierarchy: { en: "Hierarchy", hi: "पदानुक्रम" },
  nav_aarti: { en: "Aarti Library", hi: "आरती संग्रह" },
  nav_admin: { en: "Admin", hi: "व्यवस्थापक" },
  sign_out: { en: "Sign out", hi: "साइन आउट" },

  aarti_title: { en: "ISKCON Aarti & PDF Library", hi: "इस्कॉन आरती एवं पीडीएफ संग्रह" },
  aarti_sub: { en: "Devotional aartis & prayers — read or download.", hi: "भक्ति आरती एवं प्रार्थनाएँ — पढ़ें या डाउनलोड करें।" },
  search: { en: "Search aartis…", hi: "आरती खोजें…" },
  read: { en: "Read", hi: "पढ़ें" },
  download_pdf: { en: "Download PDF", hi: "पीडीएफ डाउनलोड" },
  no_pdf_yet: { en: "PDF coming soon", hi: "पीडीएफ शीघ्र उपलब्ध" },
  bookmark: { en: "Bookmark", hi: "बुकमार्क" },
  bookmarked: { en: "Bookmarked", hi: "बुकमार्क किया" },
  all: { en: "All", hi: "सभी" },
  morning: { en: "Morning", hi: "प्रातः" },
  evening: { en: "Evening", hi: "संध्या" },
  prayer: { en: "Prayer", hi: "प्रार्थना" },
  mantra: { en: "Mantra", hi: "मंत्र" },
};

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string; }
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "en");
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { localStorage.setItem("lang", l); setLangState(l); };
  const t = (k: string) => dict[k]?.[lang] ?? k;
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
