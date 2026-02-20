import { connect } from 'unistore/preact';
import MatterbridgePage from '../MatterbridgePage';
import SetupTab from './SetupTab';

const MatterbridgeSetupPage = props => (
  <MatterbridgePage user={props.user}>
    <SetupTab {...props} />
  </MatterbridgePage>
);

export default connect('user,session,httpClient', {})(MatterbridgeSetupPage);
