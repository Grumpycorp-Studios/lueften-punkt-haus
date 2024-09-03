import { appendChildren, createElementWithInitializerAndChildren } from "./display-tools";

import {
  addLanguageChangeListener,
  LanguageChangeListener,
  Languages,
  LanguageType,
  setCurrentLanguage,
  getCurrentLanguage,
} from "./lueftenLocalizationCore";

const languageSelectorElementClass = "languageFlag";
const languageSelectorDataKey = "data-language";

const onLanguageChange: LanguageChangeListener = (language: LanguageType) => {
  // Update selector visibility
  document.querySelectorAll<HTMLSpanElement>(`.${languageSelectorElementClass}`).forEach((selectorSpan) => {
    const flagLanguage = selectorSpan.getAttribute(languageSelectorDataKey);
    const isActiveLanguage = flagLanguage === language;

    selectorSpan.style.opacity = isActiveLanguage ? "100%" : "50%";
  });
};

addLanguageChangeListener(onLanguageChange);

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
  onLanguageChange(getCurrentLanguage());
}
