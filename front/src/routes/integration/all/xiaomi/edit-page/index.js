import { connect } from 'unistore/preact';
import actions from '../actions';
import XiaomiLayout from '../XiaomiLayout';
import EditPage from './EditPage';

const XIAOMI_PAGE_PATH = '/dashboard/integration/device/xiaomi';

const EditXiaomiDevice = props => (
  // the layout links to the documentation in the language of the user: without
  // it, opening a Xiaomi device for edit crashes the page
  <XiaomiLayout user={props.user}>
    <EditPage integrationName="xiaomi" allowModifyFeatures={false} previousPage={XIAOMI_PAGE_PATH} {...props} />
  </XiaomiLayout>
);

export default connect('user,session,httpClient,currentIntegration,houses', actions)(EditXiaomiDevice);
