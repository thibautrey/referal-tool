import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { z } from "zod";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "preferredLanguage",
    },
    returnNull: false,
  })
  .catch((error) => {
    console.error("Failed to initialize i18next", error);
  });

z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined") {
        return { message: String(i18n.t("validation.required")) };
      }
      return {
        message: String(
          i18n.t("validation.invalid_type", {
            expected: issue.expected,
            received: issue.received,
          })
        ),
      };
    case "invalid_string":
      if (issue.validation === "email") {
        return { message: String(i18n.t("validation.email")) };
      }
      if (issue.validation === "url") {
        return { message: String(i18n.t("validation.url")) };
      }
      break;
    case "too_small":
      if (issue.type === "string") {
        if (issue.minimum === 1 && issue.inclusive) {
          return { message: String(i18n.t("validation.required")) };
        }
        return {
          message: String(
            i18n.t("validation.string_min", { min: issue.minimum })
          ),
        };
      }
      if (issue.type === "number") {
        return {
          message: String(
            i18n.t("validation.number_min", { min: issue.minimum })
          ),
        };
      }
      if (issue.type === "array") {
        return {
          message: String(
            i18n.t("validation.array_min", { min: issue.minimum })
          ),
        };
      }
      break;
    case "too_big":
      if (issue.type === "string") {
        return {
          message: String(
            i18n.t("validation.string_max", { max: issue.maximum })
          ),
        };
      }
      if (issue.type === "number") {
        return {
          message: String(
            i18n.t("validation.number_max", { max: issue.maximum })
          ),
        };
      }
      if (issue.type === "array") {
        return {
          message: String(
            i18n.t("validation.array_max", { max: issue.maximum })
          ),
        };
      }
      break;
    case "invalid_enum_value":
      return {
        message: String(
          i18n.t("validation.invalid_enum", {
            options: (issue.options || []).join(", "),
          })
        ),
      };
    case "custom":
      if (typeof issue.params?.i18nKey === "string") {
        return {
          message: String(i18n.t(issue.params.i18nKey, issue.params)),
        };
      }
      break;
    default:
      break;
  }

  return { message: ctx.defaultError };
});

export const supportedLanguages = ["en", "fr"] as const;

export const languageNames: Record<(typeof supportedLanguages)[number], string> = {
  en: "English",
  fr: "Français",
};

export const useAppTranslation = useTranslation;
export { Trans } from "react-i18next";

export const useLanguage = () => {
  const { i18n: instance } = useTranslation();
  return {
    language: instance.resolvedLanguage,
    changeLanguage: (lng: string) => instance.changeLanguage(lng),
    availableLanguages: supportedLanguages,
  };
};

export default i18n;
