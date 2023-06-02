import { connect } from 'unistore/preact';

import LANManagerPage from '../LANManagerPage';
import LANManagerSettingsTab from './LANManagerSettingsTab';

const LANManagerSettingsPage = props => (
  <LANManagerPage>
    <LANManagerSettingsTab {...props} />
  </LANManagerPage>
);

export default connect('user,httpClient')(LANManagerSettingsPage);
