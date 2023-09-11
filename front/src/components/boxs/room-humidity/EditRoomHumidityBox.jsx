import { Component } from 'preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import ReactSlider from 'react-slider';

import { DEFAULT_VALUE_HUMIDITY } from '../../../../../server/utils/constants';

import RoomSelector from '../../house/RoomSelector';
import InputWithUnit from './InputWithUnit';
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
        className="horizontal-slider"
        thumbClassName="example-thumb"
        trackClassName="example-track"
        defaultValue={[props.humidityMin, props.humidityMax]}
        ariaLabel={['Lower thumb', 'Upper thumb']}
        ariaValuetext={state => `Thumb value ${state.valueNow}`}
        renderThumb={(props, state) => <div {...props}>{state.valueNow}%</div>}
        pearling
        minDistance={10}
        onAfterChange={props.updateBoxValue}
        value={[props.humidityMin, props.humidityMax]}
      />
    </div>

    <div style="gap: 1em" class="form-group d-flex flex-column">
      <div style="gap: 1em" class="d-flex flex-nowrap">
        <span
          class={cx('stamp', 'stamp-sm', 'bg-green', {
            'opacity-60': (props.box.humidity_use_custom_value || false) === false
          })}
        >
          <i class="fe fe-droplet" />
        </span>
        <InputWithUnit
          unit="global.percent"
          value={props.humidityMin}
          onChange={props.updateBoxMinValue}
          classNames=""
          disabled={(props.box.humidity_use_custom_value || false) === false}
        />
      </div>
      <div style="gap: 1em" class="d-flex flex-nowrap">
        <span
          class={cx('stamp', 'stamp-sm', 'bg-red', {
            'opacity-60': (props.box.humidity_use_custom_value || false) === false
          })}
        >
          <i class="fe fe-droplet" />
        </span>
        <InputWithUnit
          unit="global.percent"
          value={props.humidityMax}
          onChange={props.updateBoxMaxValue}
          classNames=""
          disabled={(props.box.humidity_use_custom_value || false) === false}
        />
      </div>
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

  updateBoxMinValue = minValue => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      humidity_min: parseInt(minValue, 10)
    });
  };

  updateBoxMaxValue = maxValue => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      humidity_max: parseInt(maxValue, 10)
    });
  };

  updateBoxValue = (values, index) => {
    console.log(values, index);
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

    return (
      <EditRoomHumidityBox
        {...props}
        updateBoxRoom={this.updateBoxRoom}
        updateBoxUseCustomValue={this.updateBoxUseCustomValue}
        updateBoxMinValue={this.updateBoxMinValue}
        updateBoxMaxValue={this.updateBoxMaxValue}
        updateBoxValue={this.updateBoxValue}
        humidityMin={humidity_min}
        humidityMax={humidity_max}
      />
    );
  }
}

export default EditRoomHumidityBoxComponent;
