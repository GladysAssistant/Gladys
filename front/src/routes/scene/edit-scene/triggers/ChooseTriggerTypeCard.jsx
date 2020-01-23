import { Component } from 'preact';
import { connect } from 'unistore/preact';
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
          <label class="form-label">Select a trigger type</label>
          <Select
            value={currentTrigger}
            options={TRIGGER_LIST.map(trigger => ({
              value: trigger,
              label: trigger
            }))}
            onChange={this.handleChange}
          />
        </div>
        <div class="form-group">
          <button onClick={this.changeBoxType} class="btn btn-success">
            Add
          </button>
        </div>
      </div>
    );
  }
}

export default ChooseTriggerType;
