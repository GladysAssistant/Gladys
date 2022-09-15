import { Component } from 'preact';
import { connect } from 'unistore/preact';
import YeelightPage from '../YeelightPage';
import UpdateDevice from '../../../../../components/device';

class EditYeelightDevice extends Component {
  render(props, {}) {
    return (
      <YeelightPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="yeelight"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/yeelight"
        />
      </YeelightPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditYeelightDevice);
