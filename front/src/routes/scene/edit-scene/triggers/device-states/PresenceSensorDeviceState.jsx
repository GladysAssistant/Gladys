import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from '../style.css';

class PresenceSensorDeviceState extends Component {
  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');
    this.props.updateTriggerProperty(this.props.index, 'value', 1);
    this.props.updateTriggerProperty(this.props.index, 'threshold_only', false);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.selectedDeviceFeature &&
      this.props.selectedDeviceFeature &&
      prevProps.selectedDeviceFeature.selector !== this.props.selectedDeviceFeature.selector
    ) {
      this.props.updateTriggerProperty(this.props.index, 'operator', '=');
      this.props.updateTriggerProperty(this.props.index, 'value', 1);
      this.props.updateTriggerProperty(this.props.index, 'threshold_only', false);
    }
  }

  render() {
    return (
      <div class="col-6 d-flex">
        <button class={cx('btn', 'btn-block', 'btn-secondary', style.deviceStateButton)} disabled>
          <Text id="editScene.triggersCard.newState.deviceSeen" />
        </button>
      </div>
    );
  }
}

export default PresenceSensorDeviceState;
