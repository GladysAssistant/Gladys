import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import Select from '../../../../components/form/Select';

@connect('', {})
class WaitActionParams extends Component {
  handleChangeDuration = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'value', newValue);
  };
  handleChangeUnit = unit => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', unit.value);
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
            <Select
              value={props.action.unit}
              onChange={this.handleChangeUnit}
              uniqueKey="value"
              options={[
                {
                  value: 'milliseconds',
                  label: <Text id="editScene.actionsCard.delay.milliseconds" />
                },
                {
                  value: 'seconds',
                  label: <Text id="editScene.actionsCard.delay.seconds" />
                },
                {
                  value: 'minutes',
                  label: <Text id="editScene.actionsCard.delay.minutes" />
                },
                {
                  value: 'hours',
                  label: <Text id="editScene.actionsCard.delay.hours" />
                }
              ]}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default WaitActionParams;
