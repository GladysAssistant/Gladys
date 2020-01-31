import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

@connect('', {})
class WaitActionParams extends Component {
  handleChangeDuration = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'value', e.target.value);
  };
  handleChangeUnit = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', e.target.value);
  };
  componentDidMount() {
    if (!this.props.unit) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', 'seconds');
    }
  }
  render(props, {}) {
    return (
      <div>
        <p>This block will wait the specified duration.</p>
        <div class="row">
          <div class="col-md-6">
            <input
              type="text"
              class="form-control"
              value={props.action.value}
              onChange={this.handleChangeDuration}
              placeholder="Duration"
            />
          </div>
          <div class="col-md-6">
            <select class="custom-select" value={props.action.unit} onChange={this.handleChangeUnit}>
              <option value="seconds">
                <Text id="" />
              </option>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
        </div>
      </div>
    );
  }
}

export default WaitActionParams;
