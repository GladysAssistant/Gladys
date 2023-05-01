import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SignupLayout from '../layout';
import PreferencesTab from './PreferencesTab';
import actions from '../../../actions/signup/signupSetPreferences';

class Preferences extends Component {
  componentWillMount() {
    this.props.resetPreferences();
  }

  render(props, {}) {
    return (
      <SignupLayout currentUrl="/signup/preference">
        {props.signupUserPreferences && props.signupSystemPreferences && (
          <PreferencesTab
            signupUserPreferences={props.signupUserPreferences}
            signupSystemPreferences={props.signupSystemPreferences}
            updateUserPreferences={props.updateUserPreferences}
            updateSystemPreferences={props.updateSystemPreferences}
            savePreferences={props.savePreferences}
          />
        )}
      </SignupLayout>
    );
  }
}

export default connect('signupUserPreferences,signupSystemPreferences', actions)(Preferences);
