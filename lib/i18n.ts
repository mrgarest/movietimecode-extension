import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import uk from "../locales/uk/translation.json";

i18n
  .use(LanguageDetector)
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