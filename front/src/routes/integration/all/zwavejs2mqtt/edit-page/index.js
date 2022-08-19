import { Component } from 'preact';
import { connect } from 'unistore/preact';
// import actions from '../actions';
import Zwavejs2mqttPage from '../Zwavejs2mqttPage';
import UpdateDevice from '../../../../../components/device';

const ZWAVE_PAGE_PATH = '/dashboard/integration/device/zwavejs2mqtt';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditZwavejs2mqttDevice extends Component {
  render(props, {}) {
    return (
      <Zwavejs2mqttPage>
        <UpdateDevice {...props} integrationName="zwavejs2mqtt" allowModifyFeatures={false} previousPage={ZWAVE_PAGE_PATH} />
      </Zwavejs2mqttPage>
    );
  }
}

export default EditZwavejs2mqttDevice;
