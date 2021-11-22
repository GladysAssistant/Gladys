import { Text } from 'preact-i18n';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

const BluetoothPeripheralFeatures = ({ children, device }) => {
  const { features = [] } = device;

  return (
    <div class="form-group">
      <label class="form-label">
        <Text id="integration.bluetooth.device.featuresLabel" />
      </label>
      <div>{children || <DeviceFeatures features={features} />}</div>
    </div>
  );
};

export default BluetoothPeripheralFeatures;
