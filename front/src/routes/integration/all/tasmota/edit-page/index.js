import { Component } from 'preact';
import { connect } from 'unistore/preact';
import TasmotaPage from '../TasmotaPage';
import UpdateDevice from '../../../../../components/device';
import { LIGHT_MODULES } from '../../../../../../../server/services/tasmota/lib/features/modules';
import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

class EditTasmotaDevice extends Component {
  canEditCategory = (device, feature) => {
    if (feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
      return !LIGHT_MODULES.includes(device.model);
    }

    return false;
  };

  render(props, {}) {
    return (
      <TasmotaPage user={props.user}>
        <UpdateDevice
          {...props}
          canEditCategory={this.canEditCategory}
          integrationName="tasmota"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/tasmota"
        />
      </TasmotaPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(EditTasmotaDevice);
