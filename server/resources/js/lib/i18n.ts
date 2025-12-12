import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import uk from "../../../lang/uk/react.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uk: { translation: uk },
    },
    fallbackLng: "uk",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator'],
    }
  });

export default i18n;
