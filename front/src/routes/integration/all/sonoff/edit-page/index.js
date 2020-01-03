import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SonoffPage from '../SonoffPage';
import UpdateDevice from '../../../../../components/device';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditSonoffDevice extends Component {
  render(props, {}) {
    return (
      <SonoffPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="sonoff"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/sonoff"
        />
      </SonoffPage>
    );
  }
}

export default EditSonoffDevice;
