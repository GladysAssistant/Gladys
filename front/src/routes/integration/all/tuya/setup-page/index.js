import { connect } from 'unistore/preact';
import SetupTab from './SetupTab';
import TuyaPage from '../TuyaPage';

const TuyaSetupPage = props => (
  <TuyaPage user={props.user}>
    <SetupTab {...props} />
  </TuyaPage>
);

export default connect('user', {})(TuyaSetupPage);
