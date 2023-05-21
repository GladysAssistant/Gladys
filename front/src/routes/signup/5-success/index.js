import { Component } from 'preact';
import SignupLayout from '../layout';
import SuccessTab from './SuccessTab';

class Success extends Component {
  componentDidMount() {}

  render({}, {}) {
    return (
      <SignupLayout currentUrl="/signup/success">
        <SuccessTab />
      </SignupLayout>
    );
  }
}

export default Success;
