import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import BatteryLevelFeature from '../../../../../components/device/view/BatteryLevelFeature';
import KeepHistoryFeature, { isHistorizableFeature } from './KeepHistoryFeature';
import DeviceParams from '../components/DeviceParams';
import TransportBadge from '../components/TransportBadge';
import { getDeviceTransport, getDeviceTransportMessage, isDeviceTransportDegraded } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import FeatureHistorySize from '../../../../../components/device/FeatureHistorySize';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import {
  MobileGroup,
  MobileRow,
  MobileSwitch,
  MobileNotice,
  MobilePill,
  kitStyle
} from '../../../../../components/mobile';
import { MobileDeviceItem, BatteryPill, integrationMobileStyle } from '../../../../../components/integration/mobile';
import DeleteDeviceButton from '../../../../../components/device/DeleteDeviceButton';

// the technical params of the sheet: the transport ones are shown as pills and as a sentence
const INTERNAL_PARAMS = ['GLADYS_TRANSPORT', 'GLADYS_TRANSPORT_DEGRADED', 'GLADYS_TRANSPORT_MESSAGE'];

const TRANSPORT_TONES = {
  local: 'success',
  cloud: 'accent',
  unreachable: 'danger'
};

/**
 * @description Last battery level reported for the device, like the native
 * integration device pages show it in the card header.
 * @param {object} device - The device, with its features.
 * @returns {number|null} The battery percentage, null when none is known yet.
 * @example
 * getBatteryLevel({ features: [{ category: 'battery', type: 'integer', last_value: 76 }] }); // 76
 */
const getBatteryLevel = device => {
  // the battery category also holds the binary charging state: only the
  // percent level is the badge
  const batteryFeature = (device.features || []).find(
    feature =>
      feature.category === DEVICE_FEATURE_CATEGORIES.BATTERY && feature.type === DEVICE_FEATURE_TYPES.BATTERY.INTEGER
  );
  const batteryLevel = get(batteryFeature, 'last_value');
  return typeof batteryLevel === 'number' ? batteryLevel : null;
};

class DeviceBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', e.target.value || null);
  };

  updateFeatureKeepHistory = (featureIndex, value) => {
    this.props.updateFeatureProperty(this.props.deviceIndex, featureIndex, 'keep_history', value);
  };

  // saveDevice and deleteDevice resolve to false when the request failed (the phone sheet then
  // stays open)
  saveDevice = async () => {
    this.setState({ loading: true });
    let saved = true;
    try {
      await this.props.saveDevice(this.props.deviceIndex);
      this.setState({ saveError: null, deleteError: null });
    } catch (e) {
      console.error(e);
      this.setState({ saveError: RequestStatus.Error });
      saved = false;
    }
    this.setState({ loading: false });
    return saved;
  };

  deleteDevice = async () => {
    this.setState({ loading: true, tooMuchStatesError: false, statesNumber: undefined });
    let deleted = true;
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
      this.setState({ deleteError: null });
    } catch (e) {
      console.error(e);
      this.setState({ deleteError: RequestStatus.Error });
      // Too many states to delete at once: Gladys purges them in the background, then deletes
      // the device on its own. The card and the phone sheet say so, with the link to the job,
      // as the cards of the native integrations do.
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      }
      deleted = false;
    }
    this.setState({ loading: false });
    return deleted;
  };

  // "Close without saving" of the phone sheet: the history switches go back to what they were
  revertKeepHistory = savedDevice => {
    (this.props.device.features || []).forEach((feature, featureIndex) => {
      const savedFeature = (savedDevice.features || [])[featureIndex];
      if (savedFeature && Boolean(savedFeature.keep_history) !== Boolean(feature.keep_history)) {
        this.updateFeatureKeepHistory(featureIndex, savedFeature.keep_history);
      }
    });
  };

  // The device on a phone (docs/specs/mobile-pages/integration-devices.md): a row and its sheet,
  // fed by the handlers of the card below. What the badges say in a tooltip is written in the
  // sheet, a touch screen has no tooltip.
  renderMobile(
    { device, houses = [], language, intl },
    { saveError, deleteError, tooMuchStatesError, statesNumber },
    historizableFeatures,
    batteryLevel
  ) {
    let deleteErrorMessage = null;
    if (tooMuchStatesError) {
      deleteErrorMessage = <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />;
    } else if (deleteError) {
      deleteErrorMessage = <Text id="integration.externalIntegration.device.deleteError" />;
    }
    const transport = getDeviceTransport(device);
    const degraded = isDeviceTransportDegraded(device);
    const transportTone = TRANSPORT_TONES[transport];
    let transportNoticeTone;
    if (transport === 'unreachable') {
      transportNoticeTone = 'danger';
    } else if (degraded) {
      transportNoticeTone = 'warning';
    }
    const pills = [
      batteryLevel !== null && <BatteryPill level={batteryLevel} />,
      transportTone && (
        <MobilePill tone={transportTone} data-cy="external-device-transport">
          <Text id={`integration.externalIntegration.transport.${transport}Badge`} />
        </MobilePill>
      ),
      transportTone && degraded && (
        <MobilePill tone="warning" data-cy="external-device-degraded">
          <Text id="integration.externalIntegration.transport.degradedBadge" />
        </MobilePill>
      )
    ].filter(Boolean);
    return (
      <MobileDeviceItem
        device={device}
        houses={houses}
        pills={pills.length > 0 ? pills : null}
        notices={
          transportTone && (
            <MobileNotice
              tone={transportNoticeTone}
              icon={transportNoticeTone ? 'alert-triangle' : 'info'}
              data-cy="external-device-transport-notice"
            >
              {degraded ? (
                getDeviceTransportMessage(device, language) || (
                  <Text id="integration.externalIntegration.transport.degradedTooltip" />
                )
              ) : (
                <Text id={`integration.externalIntegration.transport.${transport}Tooltip`} />
              )}
            </MobileNotice>
          )
        }
        onNameChange={this.updateName}
        onRoomChange={this.updateRoom}
        namePlaceholderId="integration.externalIntegration.device.namePlaceholder"
        extraSignature={(device.features || []).map(feature => Boolean(feature.keep_history))}
        onRevert={this.revertKeepHistory}
        details={(device.params || [])
          .filter(param => !INTERNAL_PARAMS.includes(param.name))
          .map(param => ({ label: param.name, value: param.value, mono: true }))}
        detailsFolded
        onSave={this.saveDevice}
        saveError={saveError && <Text id="integration.externalIntegration.device.saveError" />}
        onDelete={this.deleteDevice}
        deleteError={deleteErrorMessage}
        deleteScheduled={Boolean(tooMuchStatesError)}
        dataCy="external-device-row"
      >
        {historizableFeatures.length > 0 && (
          <div class={integrationMobileStyle.sheetSection} data-cy="external-device-keep-history">
            <div class={integrationMobileStyle.sheetLabel}>
              <Text id="editDeviceForm.keepHistoryLabel" />
            </div>
            <MobileGroup>
              {historizableFeatures.map(({ feature, featureIndex }) => (
                <MobileRow
                  key={feature.id || feature.external_id}
                  title={feature.name}
                  subtitle={<FeatureHistorySize device={device} feature={feature} inline hideEmpty />}
                  trailing={
                    <MobileSwitch
                      checked={Boolean(feature.keep_history)}
                      onChange={value => this.updateFeatureKeepHistory(featureIndex, value)}
                      label={`${get(intl.dictionary, 'editDeviceForm.keepHistoryLabel')} – ${feature.name}`}
                      dataCy="external-device-keep-history-switch"
                    />
                  }
                />
              ))}
            </MobileGroup>
            <div class={kitStyle.footnote}>
              <MarkupText id="editDeviceForm.keepHistoryDescription" />
            </div>
          </div>
        )}
      </MobileDeviceItem>
    );
  }

  render(
    { device, deviceIndex, houses = [], language },
    { loading, saveError, deleteError, tooMuchStatesError, statesNumber }
  ) {
    // the index kept here is the one in device.features: it is what the
    // save posts back, the text features filtered out would shift it
    const historizableFeatures = (device.features || [])
      .map((feature, featureIndex) => ({ feature, featureIndex }))
      .filter(({ feature }) => isHistorizableFeature(feature));
    const batteryLevel = getBatteryLevel(device);
    if (this.props.isMobile) {
      return this.renderMobile(this.props, this.state, historizableFeatures, batteryLevel);
    }
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {device.name}
            {(batteryLevel !== null || getDeviceTransport(device)) && (
              <div class="page-options d-flex align-items-center">
                {batteryLevel !== null && (
                  <div class={cx({ 'mr-2': getDeviceTransport(device) })}>
                    <BatteryLevelFeature batteryLevel={batteryLevel} />
                  </div>
                )}
                {getDeviceTransport(device) && (
                  <TransportBadge
                    transport={getDeviceTransport(device)}
                    degraded={isDeviceTransportDegraded(device)}
                    message={getDeviceTransportMessage(device, language)}
                  />
                )}
              </div>
            )}
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.externalIntegration.device.saveError" />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning" data-cy="external-device-delete-scheduled">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                {deleteError && !tooMuchStatesError && (
                  <div class="alert alert-danger">
                    <Text id="integration.externalIntegration.device.deleteError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.externalIntegration.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.externalIntegration.device.namePlaceholder" />}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.externalIntegration.device.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control" id={`room_${deviceIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {houses.map(house => (
                      <optgroup label={house.name}>
                        {house.rooms.map(room => (
                          <option selected={room.id === device.room_id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.externalIntegration.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>

                {historizableFeatures.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="editDeviceForm.keepHistoryLabel" />
                    </label>
                    {historizableFeatures.map(({ feature, featureIndex }) => (
                      <KeepHistoryFeature
                        key={feature.id || feature.external_id}
                        device={device}
                        deviceIndex={deviceIndex}
                        feature={feature}
                        featureIndex={featureIndex}
                        updateFeatureKeepHistory={this.updateFeatureKeepHistory}
                      />
                    ))}
                    <p class="mb-0">
                      <small>
                        <MarkupText id="editDeviceForm.keepHistoryDescription" />
                      </small>
                    </p>
                  </div>
                )}

                <DeviceParams device={device} />

                <div class="d-flex">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2 flex-fill">
                    <Text id="integration.externalIntegration.device.saveButton" />
                  </button>
                  <DeleteDeviceButton device={device} onDelete={this.deleteDevice} class="btn btn-danger flex-fill">
                    <Text id="integration.externalIntegration.device.deleteButton" />
                  </DeleteDeviceButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(DeviceBox);
