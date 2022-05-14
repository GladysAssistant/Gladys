import { Fragment } from 'preact';
import { Text } from 'preact-i18n';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

const DevicePeripheralForm = ({ peripheral, updateName, saveDevice }) => (
  <Fragment>
    <div class="form-group">
      <label class="form-label" for="name">
        <Text id="integration.broadlink.peripheral.nameLabel" />
      </label>
      <input
        type="text"
        class="form-control"
        data-cy="peripheral-name"
        disabled={!peripheral.connectable || peripheral.device.created_at}
        value={peripheral.device.name}
        onInput={updateName}
      />
    </div>
    <div class="form-group">
      <label class="form-label" for="macAddress">
        <Text id="integration.broadlink.peripheral.macAddressLabel" />
      </label>
      <input type="text" class="form-control" data-cy="peripheral-address" disabled value={peripheral.mac} />
    </div>
    <div class="form-group">
      <label class="form-label">
        <Text id="integration.broadlink.peripheral.featuresLabel" />
      </label>
      <DeviceFeatures features={peripheral.device.features} />
    </div>
    <div class="form-group">
      {peripheral.connectable && peripheral.device.created_at && (
        <button class="btn btn-primary mr-2" disabled data-cy="peripheral-submit">
          <Text id="integration.broadlink.peripheral.alreadyCreatedButton" />
        </button>
      )}
      {peripheral.connectable && !peripheral.device.created_at && (
        <button onClick={saveDevice} class="btn btn-success mr-2" data-cy="peripheral-submit">
          <Text id="integration.broadlink.peripheral.saveButton" />
        </button>
      )}
      {!peripheral.connectable && (
        <button class="btn btn-danger mr-2" data-cy="peripheral-submit" disabled>
          <Text id="integration.broadlink.peripheral.notConnectable" />
        </button>
      )}
    </div>
  </Fragment>
);

export default DevicePeripheralForm;
