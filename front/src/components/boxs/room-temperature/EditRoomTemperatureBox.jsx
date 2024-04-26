import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import ReactSlider from 'react-slider';

import { DEFAULT_VALUE_TEMPERATURE, DEVICE_FEATURE_UNITS } from '../../../../../server/utils/constants';
import RoomSelector from '../../house/RoomSelector';
import cx from 'classnames';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../../../../../server/utils/units';

const updateBoxRoom = (updateBoxRoomFunc, x, y) => room => {
  updateBoxRoomFunc(x, y, room.selector);
};

const EditRoomTemperatureBox = ({ children, unit, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.temperature-in-room">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.temperatureInRoom.editRoomLabel" />
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
          checked={props.box.temperature_use_custom_value || false}
          onChange={props.updateBoxUseCustomValue}
        />
        <Text id="dashboard.boxes.temperatureInRoom.thresholdsLabel" />
      </label>
    </div>
    <div class="form-group">
      <ReactSlider
        className={cx('temperature-slider', {
          'opacity-60': !(props.box.temperature_use_custom_value || false)
        })}
        thumbClassName="temperature-slider-thumb"
        trackClassName="temperature-slider-track"
        defaultValue={[props.temperatureMin, props.temperatureMax]}
        renderThumb={(props, state) => (
          <div {...props}>
            <Text id="global.degreeValue" fields={{ value: state.valueNow }} />
            <Text id={`global.${unit}`} />
          </div>
        )}
        pearling
        minDistance={10}
        max={unit === DEVICE_FEATURE_UNITS.CELSIUS ? 50 : 122}
        min={unit === DEVICE_FEATURE_UNITS.CELSIUS ? -20 : -4}
        onAfterChange={props.updateBoxValue}
        value={[props.temperatureMin, props.temperatureMax]}
        disabled={!(props.box.temperature_use_custom_value || false)}
      />
    </div>
  </BaseEditBox>
);

class EditRoomTemperatureBoxComponent extends Component {
  updateBoxRoom = (x, y, room) => {
    this.props.updateBoxConfig(x, y, {
      room
    });
  };

  updateBoxUseCustomValue = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      temperature_use_custom_value: e.target.checked
    });
  };

  updateBoxValue = values => {
    let temperature_min = values[0];
    let temperature_max = values[1];

    if (this.props.user.temperature_unit_preference === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
      temperature_min = fahrenheitToCelsius(temperature_min);
      temperature_max = fahrenheitToCelsius(temperature_max);
    }

    this.props.updateBoxConfig(this.props.x, this.props.y, {
      temperature_min,
      temperature_max
    });
  };

  render(props, {}) {
    let temperature_min = this.props.box.temperature_min;
    let temperature_max = this.props.box.temperature_max;

    const unit = this.props.user.temperature_unit_preference;

    if (!this.props.box.temperature_use_custom_value) {
      temperature_min = DEFAULT_VALUE_TEMPERATURE.MINIMUM;
      temperature_max = DEFAULT_VALUE_TEMPERATURE.MAXIMUM;
    }

    if (isNaN(temperature_min)) {
      temperature_min = DEFAULT_VALUE_TEMPERATURE.MINIMUM;
    }
    if (isNaN(temperature_max)) {
      temperature_max = DEFAULT_VALUE_TEMPERATURE.MAXIMUM;
    }

    if (this.props.user.temperature_unit_preference === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
      temperature_min = celsiusToFahrenheit(temperature_min);
      temperature_max = celsiusToFahrenheit(temperature_max);
    }

    return (
      <EditRoomTemperatureBox
        {...props}
        updateBoxRoom={this.updateBoxRoom}
        updateBoxUseCustomValue={this.updateBoxUseCustomValue}
        updateBoxValue={this.updateBoxValue}
        temperatureMin={temperature_min}
        temperatureMax={temperature_max}
        unit={unit}
      />
    );
  }
}

export default connect('user', {})(EditRoomTemperatureBoxComponent);
