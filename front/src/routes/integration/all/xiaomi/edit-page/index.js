import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import XiaomiLayout from '../XiaomiLayout';
import EditPage from './EditPage';

const XIAOMI_PAGE_PATH = '/dashboard/integration/device/xiaomi';

@connect(
  'user,session,httpClient,currentIntegration,houses',
  actions
)
class EditXiaomiDevice extends Component {
  render(props, {}) {
    return (
      <XiaomiLayout>
        <EditPage integrationName="xiaomi" allowModifyFeatures={false} previousPage={XIAOMI_PAGE_PATH} {...props} />
      </XiaomiLayout>
    );
  }
}

export default EditXiaomiDevice;
