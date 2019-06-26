import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SignupLayout from '../layout';
import CreateAccountGladysGatewayTab from './CreateAccountGladysGatewayTab';
import actions from '../../../actions/signup/signupCreateLocalAccount';

@connect(
  '',
  actions
)
class CreateAccountGladysGateway extends Component {
  componentWillMount() {
    this.props.checkIfInstanceIsConfigured();
  }

  render({}, {}) {
    return (
      <SignupLayout currentUrl="/signup/create-account-gladys-gateway">
        <CreateAccountGladysGatewayTab />
      </SignupLayout>
    );
  }
}

export default CreateAccountGladysGateway;
