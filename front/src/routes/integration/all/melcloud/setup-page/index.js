import { connect } from 'unistore/preact';
import SetupTab from './SetupTab';
import MELCloudPage from '../MELCloudPage';

const MELCloudSetupPage = props => (
  <MELCloudPage user={props.user}>
    <SetupTab {...props} />
  </MELCloudPage>
);

export default connect('user', {})(MELCloudSetupPage);
