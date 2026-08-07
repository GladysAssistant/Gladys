import {
  applyDarkModeToDom,
  DARK_MODE_PREFERENCE_DARK,
  DARK_MODE_PREFERENCE_LIGHT,
  DARK_MODE_PREFERENCE_SYSTEM,
  getDarkModePreference,
  setDarkModePreference,
  systemPrefersDarkMode
} from '../utils/darkModePreference';

function createActionsDarkMode(store) {
  const actions = {
    initDarkMode(state) {
      applyDarkModeToDom(state.darkMode);
    },
    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
      const currentDarkMode = store.getState().darkMode;
      const newDarkMode = !currentDarkMode;

      setDarkModePreference(newDarkMode ? DARK_MODE_PREFERENCE_DARK : DARK_MODE_PREFERENCE_LIGHT);
      applyDarkModeToDom(newDarkMode);

      return { darkMode: newDarkMode };
    },

    /**
     * Set dark mode to a specific value
     */
    setDarkMode(state, darkMode) {
      setDarkModePreference(darkMode ? DARK_MODE_PREFERENCE_DARK : DARK_MODE_PREFERENCE_LIGHT);
      applyDarkModeToDom(darkMode);

      return { darkMode };
    },

    /**
     * Update dark mode based on system preference.
     * Only applies when the user has not set an explicit preference.
     */
    updateDarkModeFromSystem() {
      if (getDarkModePreference() !== DARK_MODE_PREFERENCE_SYSTEM) {
        return null;
      }

      const darkMode = systemPrefersDarkMode();
      applyDarkModeToDom(darkMode);

      return { darkMode };
    }
  };

  return actions;
}

export default createActionsDarkMode;
