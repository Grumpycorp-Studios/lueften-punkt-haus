import { appendChildren, createElementWithInitializerAndChildren } from "./display-tools";

const Languages = ["de", "en"] as const;
type LanguageType = (typeof Languages)[number];

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
  const languageSelector = `:lang(${language})`;

  // Hide non-matching elements
  document
    .querySelectorAll(`[lang]:not(${languageSelector})`)
    .forEach((element) => ((element as HTMLElement).style.display = "none"));

  // Show matching elements
  document
    .querySelectorAll(`[lang]${languageSelector}`)
    .forEach((element) => ((element as HTMLElement).style.display = "unset"));

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
