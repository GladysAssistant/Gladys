import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import Layout from '../Layout';
import EditPage from './EditPage';

const MAGIC_DEVICES_PAGE_PATH = '/dashboard/integration/device/magic-devices';

@connect('user,session,httpClient,currentIntegration,houses', actions)
class EditDevice extends Component {
  render(props, {}) {
    return (
      <Layout>
        <EditPage integrationName="magic-devices" allowModifyFeatures={false} previousPage={MAGIC_DEVICES_PAGE_PATH} {...props} />
      </Layout>
    );
  }
}

export default EditDevice;
