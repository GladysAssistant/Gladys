import { useCallback, useState } from 'preact/hooks';

import { Text } from 'preact-i18n';
import cx from 'classnames';

import Device from '../Device';

const AddTab = ({ houses, createDevice }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [device, setDevice] = useState({
    room_id: null,
    name: ''
  });

  const updateDeviceProperty = useCallback((device, property, value) => {
    setDevice({
      ...device,
      [property]: value
    });
  });

  const onDeviceUpdate = useCallback(device => {
    (async () => {
      setIsLoading(true);
      await createDevice(device);
      setIsLoading(false);
    })();
  });

  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.lgtv.add.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: isLoading
          })}
        >
          <div class="loader" />
          <div class={cx('dimmer-content')}>
            <div class="row">
              <Device
                updateDeviceProperty={updateDeviceProperty}
                onDeviceUpdate={onDeviceUpdate}
                houses={houses}
                device={device}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTab;
