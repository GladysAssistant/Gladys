import { Component } from 'preact';
import { connect } from 'unistore/preact';
import EweLinkPage from '../EweLinkPage';
import UpdateDevice from '../../../../../components/device';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditEweLinkDevice extends Component {
  render(props, {}) {
    return (
      <EweLinkPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="ewelink"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/ewelink"
        />
      </EweLinkPage>
    );
  }
}

export default EditEweLinkDevice;
