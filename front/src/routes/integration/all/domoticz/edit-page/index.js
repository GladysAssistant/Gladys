import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DomoticzPage from '../DomoticzPage';
import UpdateDevice from '../../../../../components/device';

const DOMOTICZ_PAGE_PATH = '/dashboard/integration/device/domoticz';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditDomoticzDevice extends Component {
  render(props, {}) {
    return (
      <DomoticzPage>
        <UpdateDevice
          {...props}
          integrationName="domoticz"
          allowModifyFeatures={false}
          previousPage={DOMOTICZ_PAGE_PATH}
        />
      </DomoticzPage>
    );
  }
}

export default EditDomoticzDevice;
