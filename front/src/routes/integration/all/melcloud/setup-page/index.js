import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SetupTab from './SetupTab';
import MELCloudPage from '../MELCloudPage';

class MELCloudSetupPage extends Component {
  render(props, {}) {
    return (
      <MELCloudPage user={props.user}>
        <SetupTab {...props} />
      </MELCloudPage>
    );
  }
}

export default connect('user', {})(MELCloudSetupPage);
