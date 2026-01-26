import { Component } from 'preact';
import { connect } from 'unistore/preact';
import NukiPage from '../NukiPage';
import SetupTab from './SetupTab';

class NukiSetupPage extends Component {
  render(props, {}) {
    return (
      <NukiPage user={props.user}>
        <SetupTab {...props} />
      </NukiPage>
    );
  }
}

export default connect('user', {})(NukiSetupPage);
