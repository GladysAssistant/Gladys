import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SignupLayout from '../layout';
import WelcomeTab from './WelcomeTab';
import actions from '../../../actions/signup/welcome';

class WelcomePage extends Component {
  componentWillMount() {
    this.props.checkIfInstanceIsConfigured();
  }

  render({}, {}) {
    return (
      <SignupLayout currentUrl="/signup">
        <WelcomeTab />
      </SignupLayout>
    );
  }
}

export default connect('', actions)(WelcomePage);
