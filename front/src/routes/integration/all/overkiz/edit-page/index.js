import { Component } from 'preact';
import { connect } from 'unistore/preact';
import OverkizPage from '../OverkizPage';
import UpdateDevice from '../../../../../components/device';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditOverkizDevice extends Component {
  render(props, {}) {
    return (
      <OverkizPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="overkiz"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/overkiz"
        />
      </OverkizPage>
    );
  }
}

export default EditOverkizDevice;
