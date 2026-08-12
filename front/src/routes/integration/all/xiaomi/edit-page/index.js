import { connect } from 'unistore/preact';
import actions from '../actions';
import XiaomiLayout from '../XiaomiLayout';
import EditPage from './EditPage';

const XIAOMI_PAGE_PATH = '/dashboard/integration/device/xiaomi';

const EditXiaomiDevice = props => (
  <XiaomiLayout>
    <EditPage integrationName="xiaomi" allowModifyFeatures={false} previousPage={XIAOMI_PAGE_PATH} {...props} />
  </XiaomiLayout>
);

export default connect('user,session,httpClient,currentIntegration,houses', actions)(EditXiaomiDevice);
