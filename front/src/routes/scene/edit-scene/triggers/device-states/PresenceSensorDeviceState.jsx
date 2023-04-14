import { Component } from 'preact';
import { Text } from 'preact-i18n';

class PresenceSensorDeviceState extends Component {
  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');
    this.props.updateTriggerProperty(this.props.index, 'value', 1);
    this.props.updateTriggerProperty(this.props.index, 'threshold_only', false);
  }

  render() {
    return (
      <div class="col-6">
        <button class="btn btn-block btn-secondary" disabled>
          <Text id="editScene.triggersCard.newState.deviceSeen" />
        </button>
      </div>
    );
  }
}

export default PresenceSensorDeviceState;
