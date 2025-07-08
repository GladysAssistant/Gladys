function createActionsDarkMode(store) {
  const actions = {
    initDarkMode(state) {
      const { darkMode } = state;
      // Apply or remove dark mode class from DOM
      if (darkMode) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }
    },
    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
      const currentDarkMode = store.getState().darkMode;
      const newDarkMode = !currentDarkMode;

      // Save to localStorage
      localStorage.setItem('dark-mode', newDarkMode);

      // Apply or remove dark mode class from DOM
      if (newDarkMode) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }

      return { darkMode: newDarkMode };
    },

    /**
     * Set dark mode to a specific value
     */
    setDarkMode(state, darkMode) {
      // Save to localStorage
      localStorage.setItem('dark-mode', darkMode);

      // Apply or remove dark mode class from DOM
      if (darkMode) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }

      return { darkMode };
    },

    /**
     * Update dark mode based on system preference
     */
    updateDarkModeFromSystem() {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Save to localStorage
      localStorage.setItem('dark-mode', systemPrefersDark);

      // Apply or remove dark mode class from DOM
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }

      return { darkMode: systemPrefersDark };
    }
  };

  return actions;
}

export default createActionsDarkMode;
