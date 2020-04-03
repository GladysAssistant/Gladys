import { Component } from 'preact';
import { connect } from 'unistore/preact';
import TasmotaPage from '../TasmotaPage';
import UpdateDevice from '../../../../../components/device';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditTasmotaDevice extends Component {
  render(props, {}) {
    return (
      <TasmotaPage user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="tasmota"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/tasmota"
        />
      </TasmotaPage>
    );
  }
}

export default EditTasmotaDevice;
