import { Component } from 'preact';
import { connect } from 'unistore/preact';
import W215Page from '../W215Page';
import UpdateDevice from '../../../../../components/device';

@connect('user,w215Device,session,httpClient,currentIntegration,houses', {})
class EditW215Device extends Component {
  render(props, {}) {
    return (
      <W215Page user={props.user}>
        <UpdateDevice
          {...props}
          integrationName="w215"
          allowModifyFeatures={false}
          previousPage="/dashboard/integration/device/w215"
        />
      </W215Page>
    );
  }
}

export default EditW215Device;
