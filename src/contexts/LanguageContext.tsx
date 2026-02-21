"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Locale, Dir } from "@/types";
import enMessages from "@/locales/en.json";
import arMessages from "@/locales/ar.json";

type Messages = typeof enMessages;

interface LanguageContextValue {
  locale: Locale;
  dir: Dir;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const messagesMap: Record<Locale, Messages> = {
  en: enMessages,
  ar: arMessages as unknown as Messages,
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  dir: "ltr",
  messages: enMessages,
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const dir: Dir = locale === "ar" ? "rtl" : "ltr";
  const messages = messagesMap[locale];

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("notifyus-locale", newLocale);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("notifyus-locale") as Locale | null;
    if (saved && (saved === "en" || saved === "ar")) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", locale);
  }, [locale, dir]);

  // Nested key accessor: "notifications.title" -> messages.notifications.title
  const t = useCallback(
    (key: string): string => {
      const parts = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = messages;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          return key;
        }
      }
      return typeof current === "string" ? current : key;
    },
    [messages]
  );

  return (
    <LanguageContext.Provider value={{ locale, dir, messages, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
