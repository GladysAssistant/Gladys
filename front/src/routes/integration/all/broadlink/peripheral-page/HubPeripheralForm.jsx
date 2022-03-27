import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router';

const HubPeripheralForm = ({ peripheral }) => (
  <Fragment>
    <div class="form-group">
      <label class="form-label" for="ipAddress">
        <Text id="integration.broadlink.peripheral.ipAddressLabel" />
      </label>
      <input type="text" class="form-control" data-cy="peripheral-ip" disabled value={peripheral.address} />
    </div>
    <div class="form-group">
      <label class="form-label" for="macAddress">
        <Text id="integration.broadlink.peripheral.macAddressLabel" />
      </label>
      <input type="text" class="form-control" data-cy="peripheral-address" disabled value={peripheral.mac} />
    </div>
    <div class="form-group">
      <Link href={`/dashboard/integration/device/broadlink/edit?peripheral=${peripheral.mac}`}>
        <button class="btn btn-success mr-2" data-cy="peripheral-submit">
          <Text id="integration.broadlink.peripheral.createRemoteButton" />
        </button>
      </Link>
    </div>
  </Fragment>
);

export default HubPeripheralForm;
