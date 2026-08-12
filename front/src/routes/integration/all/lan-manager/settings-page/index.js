import { connect } from 'unistore/preact';

import LANManagerPage from '../LANManagerPage';
import LANManagerSettingsTab from './LANManagerSettingsTab';

const LANManagerSettingsPage = props => (
  <LANManagerPage user={props.user}>
    <LANManagerSettingsTab {...props} />
  </LANManagerPage>
);

export default connect('user,httpClient')(LANManagerSettingsPage);
