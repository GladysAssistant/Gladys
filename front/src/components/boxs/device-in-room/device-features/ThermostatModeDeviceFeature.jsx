import { Text } from 'preact-i18n';
import cx from 'classnames';

import { getDeviceName } from '../../../../utils/device';
import { THERMOSTAT_MODE } from '../../../../../../server/utils/constants';

const ThermostatModeDeviceType = ({ children, ...props }) => {
  const { device, deviceFeature } = props;
  const { last_value: lastValue } = deviceFeature;

  function updateValue(value) {
    props.updateValue(
      props.x,
      props.y,
      device,
      deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      value,
      lastValue
    );
  }

  function setOffMode() {
    updateValue(THERMOSTAT_MODE.OFF);
  }
  function setEcoMode() {
    updateValue(THERMOSTAT_MODE.ECO);
  }
  function setComfortMode() {
    updateValue(THERMOSTAT_MODE.COMFORT);
  }

  return (
    <tr>
      <td>
        <i class="fe fe-toggle-right" />
      </td>
      <td>{getDeviceName(props.device, props.deviceFeature)}</td>
      <td class="text-right">
        <button
          type="submit"
          class={cx('btn btn-sm btn-secondary', {
            active: lastValue === THERMOSTAT_MODE.OFF
          })}
          onClick={setOffMode}
        >
          <Text id="dashboard.boxes.devicesInRoom.offMode" />
        </button>
        <button
          type="submit"
          class={cx('btn btn-sm btn-secondary', {
            active: lastValue === THERMOSTAT_MODE.ECO
          })}
          onClick={setEcoMode}
        >
          <Text id="dashboard.boxes.devicesInRoom.ecoMode" />
        </button>
        <button
          type="submit"
          class={cx('btn btn-sm btn-secondary', {
            active: lastValue === THERMOSTAT_MODE.COMFORT
          })}
          onClick={setComfortMode}
        >
          <Text id="dashboard.boxes.devicesInRoom.comfortMode" />
        </button>
      </td>
    </tr>
  );
};

export default ThermostatModeDeviceType;
