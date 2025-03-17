import { connect } from 'unistore/preact';
import CallMeBotPage from '../CallMeBot';
import SetupTab from './SetupTab';

const CallMeBotSetupPage = props => (
  <CallMeBotPage user={props.user}>
    <SetupTab {...props} />
  </CallMeBotPage>
);

export default connect('user,httpClient')(CallMeBotSetupPage);
