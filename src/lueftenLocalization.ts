import { appendChildren, createElementWithInitializerAndChildren } from "./display-tools";

const Languages = ["de", "en"] as const;
type LanguageType = (typeof Languages)[number];

//
// Localized descriptors
//

// Values to localize
const LocalizableStrings = ["siteTitle", "temperature", "humidity", "interior", "exterior"] as const;
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
    interior: "Interior",
    exterior: "Exterior",
  },
  de: {
    siteTitle: "Soll ich l&uuml;ften?",
    temperature: "Temperatur",
    humidity: "Luftfeuchtigkeit",
    interior: "Innen",
    exterior: "Au&szlig;en",
  },
};

function applyLocalizedStrings(language: LanguageType) {
  const currentLanguageLocalizedStringValues = localizedStringValues[language];
  const localizedElements = document.querySelectorAll(`[${localizedStringIdDataKey}]`);

  localizedElements.forEach((localizedElement) => {
    const localizedStringId = localizedElement.getAttribute(localizedStringIdDataKey);

    if (!localizedStringId) {
      return;
    }

    localizedElement.innerHTML =
      localizedStringId in currentLanguageLocalizedStringValues
        ? currentLanguageLocalizedStringValues[localizedStringId as keyof typeof currentLanguageLocalizedStringValues]
        : "";
  });
}

//
// Language preference storage
//

const preferredLanguageStorageKey = "lueften-language";

const defaultLanguage: LanguageType = "en";

function getPreferredLanguage(): LanguageType {
  const preferredLanguageName = localStorage.getItem(preferredLanguageStorageKey);

  for (const language of Languages) {
    if (language === preferredLanguageName) {
      return language;
    }
  }

  return defaultLanguage;
}

function setPreferredLanguage(language: LanguageType) {
  localStorage.setItem(preferredLanguageStorageKey, language);
}

//
// Global state
//

var currentLanguage = getPreferredLanguage();

//
// Language selectors
//

const languageSelectorElementClass = "languageFlag";
const languageSelectorDataKey = "data-language";

function setCurrentLanguage(language: LanguageType) {
  // Update global setting
  currentLanguage = language;

  // Save preference
  setPreferredLanguage(language);

  // Update selector visibility
  document.querySelectorAll<HTMLSpanElement>(`.${languageSelectorElementClass}`).forEach((selectorSpan) => {
    const flagLanguage = selectorSpan.getAttribute(languageSelectorDataKey);
    const isActiveLanguage = flagLanguage === currentLanguage;

    selectorSpan.style.opacity = isActiveLanguage ? "100%" : "50%";
  });

  // Update localized content
  applyLocalizedStrings(currentLanguage);
}

export function createLanguageSelectors() {
  // Find element to host language selectors
  const languageSelectorsElement = document.querySelector<HTMLSpanElement>("#languageSelectors");

  if (!languageSelectorsElement) {
    return;
  }

  // Inject language selectors
  type LanguageToFlag = { [Property in LanguageType]: string };

  const languageToFlag: LanguageToFlag = {
    de: "🇩🇪",
    en: "🇺🇸",
  };

  appendChildren(
    languageSelectorsElement,
    Languages.map((language) =>
      createElementWithInitializerAndChildren(
        "span",
        (element) => {
          element.classList.add(languageSelectorElementClass);
          element.setAttribute(languageSelectorDataKey, language);

          element.onclick = () => {
            setCurrentLanguage(language);
          };
        },
        languageToFlag[language],
      ),
    ),
  );

  // Re-select current language to update selector state
  setCurrentLanguage(currentLanguage);
}
