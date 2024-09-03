import {
  LanguageChangeListener,
  LanguageType,
  addLanguageChangeListener,
  getCurrentLanguage,
} from "./lueftenLocalizationCore";

const LocalizableStrings = [
  "siteTitle",
  "temperature",
  "humidity",
  "absoluteHumidity",
  "interior",
  "exterior",
] as const;
type LocalizedStringsType = (typeof LocalizableStrings)[number];

// Annotate an HTML element with this attribute (e.g. data-loc="temperature")
const localizedStringIdDataKey = "data-loc";

type LocalizedStringValuesForLanguage = { [Property in LocalizedStringsType]: string };
type LocalizedStringValues = { [Property in LanguageType]: LocalizedStringValuesForLanguage };

const localizedStringValues: LocalizedStringValues = {
  en: {
    siteTitle: "Should I ventilate?",
    temperature: "Temperature",
    humidity: "Humidity",
    absoluteHumidity: "Absolute humidity",
    interior: "Interior",
    exterior: "Exterior",
  },
  de: {
    siteTitle: "Soll ich l&uuml;ften?",
    temperature: "Temperatur",
    humidity: "Luftfeuchtigkeit",
    absoluteHumidity: "Absolute Feuchtigkeit",
    interior: "Innen",
    exterior: "Au&szlig;en",
  },
};

const applyLocalizedStrings: LanguageChangeListener = (language: LanguageType) => {
  const currentLanguageLocalizedStringValues = localizedStringValues[language];
  const localizedElements = document.querySelectorAll(`[${localizedStringIdDataKey}]`);

  localizedElements.forEach((localizedElement) => {
    const localizedStringId = localizedElement.getAttribute(localizedStringIdDataKey);

    if (!localizedStringId) {
      return;
    }

    if (!(localizedStringId in currentLanguageLocalizedStringValues)) {
      console.warn(`Localized string ID ${localizedStringId} not recognized.`);
      return;
    }

    localizedElement.innerHTML =
      currentLanguageLocalizedStringValues[localizedStringId as keyof typeof currentLanguageLocalizedStringValues];
  });
};

export function initializeLocalizedStrings() {
  addLanguageChangeListener(applyLocalizedStrings);
  applyLocalizedStrings(getCurrentLanguage());
}
