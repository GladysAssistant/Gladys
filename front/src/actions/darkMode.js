import {
  applyDarkModeToDom,
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

      setDarkModePreference(newDarkMode ? 'dark' : 'light');
      applyDarkModeToDom(newDarkMode);

      return { darkMode: newDarkMode };
    },

    /**
     * Set dark mode to a specific value
     */
    setDarkMode(state, darkMode) {
      setDarkModePreference(darkMode ? 'dark' : 'light');
      applyDarkModeToDom(darkMode);

      return { darkMode };
    },

    /**
     * Update dark mode based on system preference.
     * Only applies when the user has not set an explicit preference.
     */
    updateDarkModeFromSystem() {
      if (getDarkModePreference() !== 'system') {
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
