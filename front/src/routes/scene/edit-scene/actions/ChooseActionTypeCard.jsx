import { Component } from 'preact';
import { connect } from 'unistore/preact';
const ACTION_LIST = ['light.turn-on', 'delay', 'telegram.send'];

@connect('httpClient', {})
class ChooseActionType extends Component {
  state = {
    currentAction: null
  };
  handleChange = e => {
    this.setState({
      currentAction: e.target.value
    });
  };
  changeBoxType = () => {
    if (this.state.currentAction && this.state.currentAction.length) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'type', this.state.currentAction);
    }
  };
  render(props, {}) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">Select an action type</label>
          <select class="custom-select" onChange={this.handleChange}>
            <option value="">-------</option>
            {ACTION_LIST.map(action => (
              <option value={action}>{action}</option>
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

export default ChooseActionType;
