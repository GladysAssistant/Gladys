import { Component } from 'preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import styles from './styles.css';

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
    <div className="form-group d-flex justify-content-start">
      <div
        class={cx(
          'd-flex',
          'flex-row',
          'flex-wrap',
          'justify-content-between',
          'align-items-center',
          styles.gapThreshold
        )}
      >
        <span
          class={cx('stamp', 'stamp-sm', 'bg-yellow', {
            [styles.alpha]: (props.box.humidity_use_custom_value || false) === false
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
        <span
          class={cx('stamp', 'stamp-sm', 'bg-green', {
            [styles.alpha]: (props.box.humidity_use_custom_value || false) === false
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
        <span
          class={cx('stamp', 'stamp-sm', 'bg-blue', {
            [styles.alpha]: (props.box.humidity_use_custom_value || false) === false
          })}
        >
          <i class="fe fe-droplet" />
        </span>
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
        humidityMin={humidity_min}
        humidityMax={humidity_max}
      />
    );
  }
}

export default EditRoomHumidityBoxComponent;
