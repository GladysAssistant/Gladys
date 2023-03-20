import { Component } from 'preact';
import { Text } from 'preact-i18n';

class ThresholdDeviceState extends Component {
  handleThresholdOnlyModeChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'threshold_only', e.target.checked);
  };

  render({ trigger }) {
    return (
      <div class="row">
        <div class="col-12">
          <label class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              checked={trigger.threshold_only}
              onChange={this.handleThresholdOnlyModeChange}
            />
            <span class="form-check-label">
              <Text id="editScene.triggersCard.newState.onlyExecuteAtThreshold" />
            </span>
          </label>
        </div>
      </div>
    );
  }
}

export default ThresholdDeviceState;
