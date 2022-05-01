import { Component } from 'preact';
import { connect } from 'unistore/preact';
import BaseEditBox from '../baseEditBox';
import { Text } from 'preact-i18n';
import { CLOCK_TYPES_LIST } from '../../../../../server/utils/constants';

@connect('', {})
class EditClock extends Component {
  updateSelection = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { clock_type: e.target.value });
  };

  render(props, {}) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.clock">
        <select value={props.box.clock_type} onChange={this.updateSelection} className="form-control">
          {CLOCK_TYPES_LIST.map(clockType => (
            <option value={clockType}>
              <Text id={`dashboard.boxes.clock.${clockType}`} />
            </option>
          ))}
        </select>
      </BaseEditBox>
    );
  }
}

export default EditClock;
