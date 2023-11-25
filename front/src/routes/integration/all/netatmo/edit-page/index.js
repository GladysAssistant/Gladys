import { Component } from 'preact';
import { connect } from 'unistore/preact';
import NetatmoPage from '../NetatmoPage';
import UpdateDevice from '../../../../../components/device';

class EditNetatmoDevice extends Component {
  render(props, {}) {
    return (
      <NetatmoPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="netatmo"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/netatmo"
        />
      </NetatmoPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditNetatmoDevice);
