import { connect } from 'unistore/preact';
import SetupTab from './SetupTab';
import MELCloudHomePage from '../MELCloudHomePage';

const MELCloudHomeSetupPage = props => (
  <MELCloudHomePage user={props.user}>
    <SetupTab {...props} />
  </MELCloudHomePage>
);

export default connect('user', {})(MELCloudHomeSetupPage);
