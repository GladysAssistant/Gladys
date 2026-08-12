import { Component } from 'preact';
import { connect } from 'unistore/preact';
import BaseEditBox from '../baseEditBox';
import { Text } from 'preact-i18n';
import { CLOCK_TYPES_LIST } from './ClockTypes';

class EditClock extends Component {
  updateClockType = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { clock_type: e.target.value });
  };
  updateClockDisplaySecond = e => {
    const valueBoolean = e.target.value === 'yes';
    this.props.updateBoxConfig(this.props.x, this.props.y, { clock_display_second: valueBoolean });
  };

  render(props, {}) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.clock">
        <div className="form-group">
          <label>
            <Text id="dashboard.boxes.clock.type" />
          </label>
          <select value={props.box.clock_type} onChange={this.updateClockType} className="form-control">
            {CLOCK_TYPES_LIST.map(clockType => (
              <option value={clockType}>
                <Text id={`dashboard.boxes.clock.${clockType}`} />
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>
            <Text id="dashboard.boxes.clock.displaySecond" />
          </label>
          <select
            value={props.box.clock_display_second ? 'yes' : 'no'}
            onChange={this.updateClockDisplaySecond}
            className="form-control"
          >
            <option value="yes">
              <Text id="dashboard.boxes.clock.yes" />
            </option>
            <option value="no">
              <Text id="dashboard.boxes.clock.no" />
            </option>
          </select>
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('', {})(EditClock);
