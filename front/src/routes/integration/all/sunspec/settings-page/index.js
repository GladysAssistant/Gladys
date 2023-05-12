import { Component } from 'preact';
import { connect } from 'unistore/preact';

import SunSpecPage from '../SunSpecPage';
import SunSpecSettingsTab from './SunSpecSettingsTab';

class SunSpecSettingsPage extends Component {
  render(props) {
    return (
      <SunSpecPage>
        <SunSpecSettingsTab {...props} />
      </SunSpecPage>
    );
  }
}

export default connect('user,httpClient')(SunSpecSettingsPage);
