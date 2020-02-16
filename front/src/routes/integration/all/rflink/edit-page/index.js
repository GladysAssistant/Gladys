import { Component } from 'preact';
import { connect } from 'unistore/preact';
// import actions from '../actions';
import RflinkPage from '../RflinkPage';
import UpdateDevice from '../../../../../components/device';

const RFLINK_PAGE_PATH = '/dashboard/integration/device/rflink';

@connect('user,session,httpClient,currentIntegration,houses', {})
class EditRflinkDevice extends Component {
  render(props, {}) {
    return (
      <RflinkPage>
        <UpdateDevice {...props} integrationName="rflink" allowModifyFeatures={false} previousPage={RFLINK_PAGE_PATH} />
      </RflinkPage>
    );
  }
}

export default EditRflinkDevice;
