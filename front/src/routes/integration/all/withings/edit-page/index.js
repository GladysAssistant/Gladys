import { Component } from 'preact';
import { connect } from 'unistore/preact';
import WithingsPage from '../WithingsPage';
import UpdateDevice from '../../../../../components/device';

const WITHINGS_PAGE_PATH = '/dashboard/integration/health/withings/device';

@connect('user,session,httpClient,currentIntegration,houses', {})
class WithingsEditDevicePage extends Component {
  render(props, {}) {
    return (
      <WithingsPage user={props.user} {...props} >
        <UpdateDevice
          {...props}
          integrationName="withings"
          allowModifyFeatures={false}
          previousPage={WITHINGS_PAGE_PATH}
        />
      </WithingsPage>
    );
  }
}

export default WithingsEditDevicePage;
