import { Text } from 'preact-i18n';
import get from 'get-value';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import { Link } from 'preact-router';

const BroadlinkPeripheralBox = ({ peripheral }) => (
  <div class="col-md-6">
    <div class="card">
      <div class="card-header">
        <div class="card-title">{peripheral.name || <Text id="integration.broadlink.peripheral.noNameLabel" />}</div>
      </div>
      <div class="card-body">
        {!peripheral.device && (
          <div class="form-group">
            <label class="form-label" for="ipAddress">
              <Text id="integration.broadlink.peripheral.ipAddressLabel" />
            </label>
            <input id="ipAddress" type="text" class="form-control" disabled value={peripheral.address} />
          </div>
        )}
        {peripheral.device && (
          <div class="form-group">
            <label class="form-label" for="name">
              <Text id="integration.broadlink.peripheral.nameLabel" />
            </label>
            <input id="name" type="text" class="form-control" disabled value={peripheral.device.name} />
          </div>
        )}
        <div class="form-group">
          <label class="form-label" for="macAddress">
            <Text id="integration.broadlink.peripheral.macAddressLabel" />
          </label>
          <input id="macAddress" type="text" class="form-control" disabled value={peripheral.mac} />
        </div>
        {!peripheral.device && (
          <div class="form-group">
            <Link href="/dashboard/integration/device/broadlink/edit">
              <button onClick={this.saveDevice} class="btn btn-success mr-2">
                <Text id="integration.broadlink.peripheral.createRemoteButton" />
              </button>
            </Link>
          </div>
        )}
        {peripheral.device && (
          <div>
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.broadlink.peripheral.featuresLabel" />
              </label>
              <div class="tags">
                {peripheral.device.features &&
                  peripheral.device.features.map(feature => (
                    <span class="tag">
                      <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                      <div class="tag-addon">
                        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
                      </div>
                    </span>
                  ))}
                {(!peripheral.device.features || peripheral.device.features.length === 0) && (
                  <Text id="integration.broadlink.peripheral.noFeatures" />
                )}
              </div>
            </div>
            <div class="form-group">
              {peripheral.device.created_at && (
                <button class="btn btn-primary mr-2" disabled="true">
                  <Text id="integration.broadlink.peripheral.alreadyCreatedButton" />
                </button>
              )}
              {!peripheral.device.created_at && (
                <button onClick={this.saveDevice} class="btn btn-success mr-2">
                  <Text id="integration.broadlink.peripheral.saveButton" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default BroadlinkPeripheralBox;
