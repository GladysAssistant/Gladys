import { Component } from 'preact';
import { connect } from 'unistore/preact';
// import actions from '../actions';
import ZwavePage from '../ZwavePage';
import UpdateDevice from '../../../../../components/device';

const ZWAVE_PAGE_PATH = '/dashboard/integration/device/zwave';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditZwaveDevice extends Component {
  render(props, {}) {
    return (
      <ZwavePage>
        <UpdateDevice {...props} integrationName="zwave" allowModifyFeatures={false} previousPage={ZWAVE_PAGE_PATH} />
      </ZwavePage>
    );
  }
}

export default EditZwaveDevice;
