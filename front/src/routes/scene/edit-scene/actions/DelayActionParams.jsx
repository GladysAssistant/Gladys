import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

class WaitActionParams extends Component {
  handleChangeDuration = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'value', newValue);
  };
  handleChangeUnit = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', e.target.value);
  };
  componentDidMount() {
    if (!this.props.action.unit) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', 'seconds');
    }
  }
  render(props, {}) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.delay.label" />
        </p>
        <div class="row">
          <div class="col-md-6">
            <Localizer>
              <input
                type="text"
                class="form-control"
                value={props.action.value}
                onChange={this.handleChangeDuration}
                placeholder={<Text id="editScene.actionsCard.delay.inputPlaceholder" />}
              />
            </Localizer>
          </div>
          <div class="col-md-6">
            <select class="custom-select" value={props.action.unit} onChange={this.handleChangeUnit}>
              <option value="milliseconds">
                <Text id="editScene.actionsCard.delay.milliseconds" />
              </option>
              <option value="seconds">
                <Text id="editScene.actionsCard.delay.seconds" />
              </option>
              <option value="minutes">
                <Text id="editScene.actionsCard.delay.minutes" />
              </option>
              <option value="hours">
                <Text id="editScene.actionsCard.delay.hours" />
              </option>
            </select>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('', {})(WaitActionParams);
