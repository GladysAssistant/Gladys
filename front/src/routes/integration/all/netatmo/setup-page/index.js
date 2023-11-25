import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SetupTab from './SetupTab';
import NetatmoPage from '../NetatmoPage';

class NetatmoSetupPage extends Component {
  render(props, {}) {
    return (
      <NetatmoPage user={props.user}>
        <SetupTab {...props} />
      </NetatmoPage>
    );
  }
}

export default connect('user', {})(NetatmoSetupPage);
