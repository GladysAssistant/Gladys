import { Component } from 'preact';
import { connect } from 'unistore/preact';
// import actions from '../actions';
import ZwaveJSUIPage from '../ZwaveJSUIPage';
import UpdateDevice from '../../../../../components/device';

const ZWAVE_PAGE_PATH = '/dashboard/integration/device/zwave-js-ui';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditZwaveJSUIDevice extends Component {
  render(props, {}) {
    return (
      <ZwaveJSUIPage>
        <UpdateDevice
          {...props}
          integrationName="zwave-js-ui"
          allowModifyFeatures={false}
          previousPage={ZWAVE_PAGE_PATH}
        />
      </ZwaveJSUIPage>
    );
  }
}

export default EditZwaveJSUIDevice;
