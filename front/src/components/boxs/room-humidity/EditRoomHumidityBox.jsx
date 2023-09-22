import { Component } from 'preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import ReactSlider from 'react-slider';

import { DEFAULT_VALUE_HUMIDITY } from '../../../../../server/utils/constants';
import RoomSelector from '../../house/RoomSelector';
import cx from 'classnames';

const updateBoxRoom = (updateBoxRoomFunc, x, y) => room => {
  updateBoxRoomFunc(x, y, room.selector);
};

const EditRoomHumidityBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.humidity-in-room">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.humidityInRoom.editRoomLabel" />
      </label>
      <RoomSelector
        selectedRoom={props.box.room}
        updateRoomSelection={updateBoxRoom(props.updateBoxRoom, props.x, props.y)}
      />
    </div>
    <div className="form-group form-check">
      <label className="form-check-label">
        <input
          type="checkbox"
          id="useCustomValue"
          className="form-check-input"
          checked={props.box.humidity_use_custom_value || false}
          onChange={props.updateBoxUseCustomValue}
        />
        <Text id="dashboard.boxes.humidityInRoom.thresholdsLabel" />
      </label>
    </div>

    <div class="form-group">
      <ReactSlider
        className={cx('humidity-slider', {
          'opacity-60': !(props.box.humidity_use_custom_value || false)
        })}
        thumbClassName="humidity-slider-thumb"
        trackClassName="humidity-slider-track"
        defaultValue={[props.humidityMin, props.humidityMax]}
        renderThumb={(props, state) => <div {...props}>{state.valueNow}%</div>}
        pearling
        minDistance={10}
        onAfterChange={props.updateBoxValue}
        value={[props.humidityMin, props.humidityMax]}
        disabled={!(props.box.humidity_use_custom_value || false)}
      />
    </div>
  </BaseEditBox>
);

class EditRoomHumidityBoxComponent extends Component {
  updateBoxRoom = (x, y, selector) => {
    this.props.updateBoxConfig(x, y, {
      room: selector
    });
  };

  updateBoxUseCustomValue = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      humidity_use_custom_value: e.target.checked
    });
  };

  updateBoxValue = values => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      humidity_min: values[0],
      humidity_max: values[1]
    });
  };

  render(props, {}) {
    let humidity_min = this.props.box.humidity_min;
    let humidity_max = this.props.box.humidity_max;

    if (!this.props.box.humidity_use_custom_value) {
      humidity_min = DEFAULT_VALUE_HUMIDITY.MINIMUM;
      humidity_max = DEFAULT_VALUE_HUMIDITY.MAXIMUM;
    }

    if (isNaN(humidity_min)) {
      humidity_min = DEFAULT_VALUE_HUMIDITY.MINIMUM;
    }
    if (isNaN(humidity_max)) {
      humidity_max = DEFAULT_VALUE_HUMIDITY.MAXIMUM;
    }

    return (
      <EditRoomHumidityBox
        {...props}
        updateBoxRoom={this.updateBoxRoom}
        updateBoxUseCustomValue={this.updateBoxUseCustomValue}
        updateBoxValue={this.updateBoxValue}
        humidityMin={humidity_min}
        humidityMax={humidity_max}
      />
    );
  }
}

export default EditRoomHumidityBoxComponent;
