import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions';
import NetatmoLayout from '../NetatmoLayout';
import EditPage from './EditPage';

const NETATMO_PAGE_PATH = '/dashboard/integration/device/netatmo';

@connect('user,session,httpClient,currentIntegration,houses', actions)
class NetatmoEditDevice extends Component {
  render(props, {}) {
    return (
      <NetatmoLayout>
        <EditPage integrationName="netatmo" allowModifyFeatures={false} previousPage={NETATMO_PAGE_PATH} {...props} />
      </NetatmoLayout>
    );
  }
}

export default NetatmoEditDevice;
