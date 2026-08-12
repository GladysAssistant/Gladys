const DARK_MODE_PREFERENCE_KEY = 'dark-mode-preference';
const LEGACY_DARK_MODE_KEY = 'dark-mode';

const DARK_MODE_PREFERENCE_LIGHT = 'light';
const DARK_MODE_PREFERENCE_DARK = 'dark';
const DARK_MODE_PREFERENCE_SYSTEM = 'system';

const VALID_PREFERENCES = [DARK_MODE_PREFERENCE_LIGHT, DARK_MODE_PREFERENCE_DARK, DARK_MODE_PREFERENCE_SYSTEM];

function systemPrefersDarkMode() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
}

function migrateLegacyDarkModePreference() {
  const legacyValue = localStorage.getItem(LEGACY_DARK_MODE_KEY);
  if (legacyValue === null) {
    return null;
  }

  const migratedPreference = legacyValue === 'true' ? DARK_MODE_PREFERENCE_DARK : DARK_MODE_PREFERENCE_LIGHT;
  localStorage.setItem(DARK_MODE_PREFERENCE_KEY, migratedPreference);
  localStorage.removeItem(LEGACY_DARK_MODE_KEY);
  return migratedPreference;
}

function getDarkModePreference() {
  try {
    const savedPreference = localStorage.getItem(DARK_MODE_PREFERENCE_KEY);
    if (VALID_PREFERENCES.includes(savedPreference)) {
      return savedPreference;
    }

    const migratedPreference = migrateLegacyDarkModePreference();
    if (migratedPreference) {
      return migratedPreference;
    }
  } catch (e) {}

  return DARK_MODE_PREFERENCE_SYSTEM;
}

function setDarkModePreference(preference) {
  try {
    localStorage.setItem(DARK_MODE_PREFERENCE_KEY, preference);
    localStorage.removeItem(LEGACY_DARK_MODE_KEY);
  } catch (e) {}
}

function isDarkModeEnabled(preference = getDarkModePreference()) {
  if (preference === DARK_MODE_PREFERENCE_DARK) {
    return true;
  }
  if (preference === DARK_MODE_PREFERENCE_LIGHT) {
    return false;
  }
  return systemPrefersDarkMode();
}

function applyDarkModeToDom(darkMode) {
  if (darkMode) {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
  }
}

export {
  DARK_MODE_PREFERENCE_DARK,
  DARK_MODE_PREFERENCE_KEY,
  DARK_MODE_PREFERENCE_LIGHT,
  DARK_MODE_PREFERENCE_SYSTEM,
  LEGACY_DARK_MODE_KEY,
  VALID_PREFERENCES,
  applyDarkModeToDom,
  getDarkModePreference,
  isDarkModeEnabled,
  setDarkModePreference,
  systemPrefersDarkMode
};
