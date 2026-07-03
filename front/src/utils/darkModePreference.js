const DARK_MODE_PREFERENCE_KEY = 'dark-mode-preference';
const LEGACY_DARK_MODE_KEY = 'dark-mode';

const VALID_PREFERENCES = ['light', 'dark', 'system'];

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

  const migratedPreference = legacyValue === 'true' ? 'dark' : 'light';
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

  return 'system';
}

function setDarkModePreference(preference) {
  localStorage.setItem(DARK_MODE_PREFERENCE_KEY, preference);
  localStorage.removeItem(LEGACY_DARK_MODE_KEY);
}

function isDarkModeEnabled(preference = getDarkModePreference()) {
  if (preference === 'dark') {
    return true;
  }
  if (preference === 'light') {
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
  DARK_MODE_PREFERENCE_KEY,
  LEGACY_DARK_MODE_KEY,
  VALID_PREFERENCES,
  applyDarkModeToDom,
  getDarkModePreference,
  isDarkModeEnabled,
  setDarkModePreference,
  systemPrefersDarkMode
};
