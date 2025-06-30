import { Component } from 'preact';

class DarkModeToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDarkMode: false
    };
  }

  componentDidMount() {
    // Check for saved preference or system preference
    const savedMode = localStorage.getItem('dark-mode');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial dark mode based on saved preference or system preference
    const darkMode = savedMode !== null ? savedMode === 'true' : prefersDarkMode.matches;
    
    // Set state
    this.setState({ isDarkMode: darkMode });
    
    // Apply or remove dark mode class from html and body
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
    
    // Listen for system preference change
    prefersDarkMode.addEventListener('change', this.handleSystemPreferenceChange);
  }
  
  componentWillUnmount() {
    // Remove event listener to prevent memory leaks
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.handleSystemPreferenceChange);
  }
  
  handleSystemPreferenceChange = (event) => {
    const savedMode = localStorage.getItem('dark-mode');
    
    // Only update if user hasn't set a preference
    if (savedMode === null) {
      this.setState({ isDarkMode: event.matches });
      
      if (event.matches) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }
    }
  };

  toggleDarkMode = () => {
    const newDarkModeState = !this.state.isDarkMode;
    
    // Set state
    this.setState({ isDarkMode: newDarkModeState });
    
    // Save to localStorage
    localStorage.setItem('dark-mode', newDarkModeState);
    
    // Apply or remove dark mode class on html and body
    if (newDarkModeState) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  };

  render() {
    const { isDarkMode } = this.state;
    
    return (
      <div class="mode-toggle" onClick={this.toggleDarkMode} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
        {isDarkMode ? (
          <i class="fe fe-sun" aria-hidden="true"></i>
        ) : (
          <i class="fe fe-moon" aria-hidden="true"></i>
        )}
      </div>
    );
  }
}

export default DarkModeToggle;
