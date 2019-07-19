import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiPage from '../XiaomiPage';
import XiaomiSettingPage from './XiaomiSetting';

@connect(actions)
class XiaomiSensorSetting extends Component {
  componentWillMount() {}

  render(props, {}) {
    return (
      <XiaomiPage>
        <XiaomiSettingPage {...props} />
      </XiaomiPage>
    );
  }
}

export default XiaomiSensorSetting;
