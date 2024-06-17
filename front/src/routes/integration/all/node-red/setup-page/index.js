import { connect } from 'unistore/preact';
import NodeRedPage from '../NodeRedPage';
import SetupTab from './SetupTab';

const NodeRedSetupPage = props => (
  <NodeRedPage user={props.user}>
    <SetupTab {...props} />
  </NodeRedPage>
);

export default connect('user,session,httpClient', {})(NodeRedSetupPage);
