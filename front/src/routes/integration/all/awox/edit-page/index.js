import { Component } from 'preact';
import { connect } from 'unistore/preact';
import AwoxPage from '../AwoxPage';
import UpdateDevice from '../../../../../components/device';

const BLUETOOTH_PAGE_PATH = '/dashboard/integration/device/awox';

@connect('user,session,httpClient,currentIntegration,houses', {})
class AwoxEditDevicePage extends Component {
  render(props, {}) {
    return (
      <AwoxPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="awox"
          allowModifyFeatures={false}
          previousPage={BLUETOOTH_PAGE_PATH}
        />
      </AwoxPage>
    );
  }
}

export default AwoxEditDevicePage;
