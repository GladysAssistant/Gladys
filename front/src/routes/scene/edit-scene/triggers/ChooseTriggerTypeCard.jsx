import { Component } from 'preact';
import { connect } from 'unistore/preact';
const TRIGGER_LIST = ['device.new-state'];

@connect('httpClient', {})
class ChooseTriggerType extends Component {
  state = {
    currentTrigger: null
  };
  handleChange = e => {
    this.setState({
      currentTrigger: e.target.value
    });
  };
  changeBoxType = () => {
    if (this.state.currentTrigger && this.state.currentTrigger.length) {
      this.props.updateTriggerProperty(this.props.index, 'type', this.state.currentTrigger);
    }
  };
  render(props, {}) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">Select a trigger type</label>
          <select class="custom-select" onChange={this.handleChange}>
            <option value="">-------</option>
            {TRIGGER_LIST.map(trigger => (
              <option value={trigger}>{trigger}</option>
            ))}
          </select>
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
