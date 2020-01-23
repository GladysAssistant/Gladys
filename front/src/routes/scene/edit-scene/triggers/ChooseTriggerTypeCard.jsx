import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
const TRIGGER_LIST = ['device.new-state'];
import Select from 'react-select';

@connect('httpClient', {})
class ChooseTriggerType extends Component {
  state = {
    currentTrigger: null
  };
  handleChange = selectedOption => {
    if (selectedOption) {
      this.setState({
        currentTrigger: selectedOption
      });
    } else {
      this.setState({
        currentTrigger: null
      });
    }
  };
  changeBoxType = () => {
    if (this.state.currentTrigger) {
      this.props.updateTriggerProperty(this.props.index, 'type', this.state.currentTrigger.value);
    }
  };
  render(props, { currentTrigger }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.selectTriggerLabel" />
          </label>
          <Select
            value={currentTrigger}
            options={TRIGGER_LIST.map(trigger => ({
              value: trigger,
              label: <Text id={`editScene.triggers.${trigger}`} />
            }))}
            onChange={this.handleChange}
          />
        </div>
        <div class="form-group">
          <button onClick={this.changeBoxType} class="btn btn-success">
            <Text id="editScene.addTriggerButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default ChooseTriggerType;
