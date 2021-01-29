import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import PhilipsHueLayout from '../PhilipsHueLayout';
import EditPage from './EditPage';

const PHILIPS_HUE_PAGE_PATH = '/dashboard/integration/device/philips-hue';

@connect('user,session,httpClient,currentIntegration,houses', actions)
class PhilipsHueEditPage extends Component {
  render(props, {}) {
    return (
      <PhilipsHueLayout>
        <EditPage
          integrationName="philips-hue"
          allowModifyFeatures={false}
          previousPage={PHILIPS_HUE_PAGE_PATH}
          {...props}
        />
      </PhilipsHueLayout>
    );
  }
}

export default PhilipsHueEditPage;
