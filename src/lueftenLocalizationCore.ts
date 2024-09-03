export const Languages = ["de", "en"] as const;
export type LanguageType = (typeof Languages)[number];

// Language change listeners
export type LanguageChangeListener = (language: LanguageType) => void;

const languageChangeListeners = new Array<Function>();

export function addLanguageChangeListener(listener: LanguageChangeListener) {
  languageChangeListeners.push(listener);
}

// State
var currentLanguage: LanguageType = "en"; // Initial guess, updating below under Storage

export function getCurrentLanguage(): LanguageType {
  return currentLanguage;
}

export function setCurrentLanguage(language: LanguageType) {
  currentLanguage = language;
  languageChangeListeners.forEach((updater) => updater(currentLanguage));
}

// Storage
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

currentLanguage = getPreferredLanguage();

addLanguageChangeListener((language) => {
  // Use listener to persist preference
  localStorage.setItem(preferredLanguageStorageKey, language);
});
