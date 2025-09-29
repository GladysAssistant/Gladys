import { Component } from 'preact';
import { connect } from 'unistore/preact';
import darkModeActions from '../../actions/darkMode';

class DarkModeToggle extends Component {
  toggleDarkMode = () => {
    // Use the global action to toggle dark mode
    this.props.toggleDarkMode();
  };

  render() {
    const { darkMode } = this.props;

    return (
      <div class="mode-toggle" onClick={this.toggleDarkMode} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
        {darkMode ? <i class="fe fe-sun" aria-hidden="true" /> : <i class="fe fe-moon" aria-hidden="true" />}
      </div>
    );
  }
}

// Connect component to global state
export default connect('darkMode', darkModeActions)(DarkModeToggle);
