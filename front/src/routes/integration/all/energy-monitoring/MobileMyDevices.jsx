import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../../../components/sheet/BottomSheet';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileNotice,
  MobileToast,
  BigButton,
  kitStyle
} from '../../../../components/mobile';
import { getAttachmentFeatures } from '../../../../../../server/utils/energyHierarchy';
import style from './mobile.css';

const CREATE_CONTRACT_PATH = '/dashboard/integration/device/energy-monitoring/contracts/create';

const featureNames = device =>
  getAttachmentFeatures(device)
    .map(feature => feature.name || feature.selector)
    .join(' · ');

/**
 * @description The "My devices" tab on a phone (docs/specs/mobile-pages/energy.md, B): one group
 * per meter — the meter, then the devices it prices — and the devices that are on no meter. The
 * only choice is the meter a device is on: tapping a device opens the meters in a sheet. A
 * presentation only: the hierarchy and the request come from MyDevices.jsx.
 */
class MobileMyDevices extends Component {
  state = {
    // the device whose meter is being chosen: kept while the sheet slides out
    device: null,
    deviceMeterId: null,
    sheetOpen: false,
    toast: null,
    toastKey: 0
  };

  componentWillUnmount() {
    this.unmounted = true;
  }

  openMeters = (device, meterId) => () => this.setState({ device, deviceMeterId: meterId, sheetOpen: true });
  closeMeters = () => this.setState({ sheetOpen: false });

  chooseMeter = meter => async () => {
    const { device, deviceMeterId } = this.state;
    this.setState({ sheetOpen: false });
    // the meter the device is already on: nothing to change
    if (meter.id === deviceMeterId) {
      return;
    }
    const attached = await this.props.attachDevice(device, meter.id);
    if (attached && !this.unmounted) {
      const template = get(this.props.intl.dictionary, 'integration.energyMonitoring.mobile.deviceAttached') || '';
      this.setState(prevState => ({
        toast: template.replace('{{device}}', device.name).replace('{{meter}}', meter.name),
        toastKey: prevState.toastKey + 1
      }));
    }
  };

  closeToast = () => this.setState({ toast: null });

  renderMeter = meter => (
    <MobileRow key={meter.id} icon="zap" title={meter.name} subtitle={featureNames(meter)} dataCy="energy-device-row">
      {/* under the name, not beside it: a long meter name keeps the width of the row */}
      <span class={style.pillLine}>
        <MobilePill tone="accent" data-cy="energy-device-meter-badge">
          <Text id="integration.energyMonitoring.hierarchy.meterBadge" />
        </MobilePill>
      </span>
    </MobileRow>
  );

  renderDevice = (device, meterId) => {
    const { meters, attaching, attachError } = this.props;
    const canChoose = meters.length > 0;
    const failed = attachError === device.id;
    const waiting = !failed && canChoose && !meterId;
    return (
      <MobileRow
        key={device.id}
        icon="activity"
        iconTone="neutral"
        title={device.name}
        subtitle={featureNames(device)}
        meta={
          failed || waiting ? (
            <span>
              {failed && (
                <span class={style.rowError} role="alert">
                  <Text id="integration.energyMonitoring.hierarchy.attachError" />
                </span>
              )}
              {waiting && (
                <span class={style.rowAction} data-cy="energy-device-choose-meter">
                  <Text id="integration.energyMonitoring.hierarchy.chooseMeter" />
                </span>
              )}
            </span>
          ) : null
        }
        onClick={canChoose ? this.openMeters(device, meterId) : undefined}
        // one attachment at a time: a second one started meanwhile would reopen a sheet that
        // still holds the meter the first device was on
        disabled={Boolean(attaching)}
        chevron={canChoose}
        dataCy="energy-device-row"
      />
    );
  };

  render(
    { meters, devicesByMeter, unattached, loading, error, contractsError, intl },
    { device, deviceMeterId, sheetOpen, toast, toastKey }
  ) {
    return (
      <div class={cx(style.list, style.listNoFab)} data-cy="energy-devices-mobile">
        <p class={kitStyle.lead}>
          <Text id="integration.energyMonitoring.hierarchy.description" />
        </p>
        {error && (
          <MobileNotice tone="danger" icon="alert-circle">
            <Text id="integration.energyMonitoring.errorLoadingDevices" />
          </MobileNotice>
        )}
        {contractsError && (
          <MobileNotice tone="danger" icon="alert-circle" data-cy="energy-hierarchy-contracts-error">
            <Text id="integration.energyMonitoring.contracts.errorLoading" />
          </MobileNotice>
        )}
        <div class={cx('dimmer', { active: loading })}>
          <div class="loader" />
          <div class={cx('dimmer-content', { [style.loading]: loading && meters.length === 0 })}>
            {!contractsError && meters.length === 0 && (
              <div data-cy="energy-hierarchy-no-meter">
                <MobileNotice icon="info">
                  <Text id="integration.energyMonitoring.hierarchy.noMeter" />
                </MobileNotice>
                <BigButton variant="primary" icon="plus" href={CREATE_CONTRACT_PATH} data-cy="energy-create-contract">
                  <Text id="integration.energyMonitoring.hierarchy.noMeterLink" />
                </BigButton>
              </div>
            )}
            {meters.map(meter => (
              <div key={meter.id} class="mb-3" data-cy="energy-meter-card">
                <MobileGroup>
                  {this.renderMeter(meter)}
                  {devicesByMeter.get(meter.id).map(attached => this.renderDevice(attached, meter.id))}
                </MobileGroup>
                {devicesByMeter.get(meter.id).length === 0 && (
                  <p class={kitStyle.footnote}>
                    <Text id="integration.energyMonitoring.hierarchy.noAttachedDevice" />
                  </p>
                )}
              </div>
            ))}
            {!contractsError && unattached.length > 0 && (
              <div data-cy="energy-unattached-card">
                <MobileSectionHeader title={<Text id="integration.energyMonitoring.hierarchy.unattachedTitle" />} />
                <MobileGroup>
                  {unattached.map(unattachedDevice => this.renderDevice(unattachedDevice, null))}
                </MobileGroup>
                <p class={kitStyle.footnote}>
                  <Text id="integration.energyMonitoring.hierarchy.unattachedDescription" />
                </p>
              </div>
            )}
            {!contractsError && meters.length === 0 && unattached.length === 0 && !loading && (
              <p class={kitStyle.footnote}>
                <Text id="integration.energyMonitoring.hierarchy.noDevice" />
              </p>
            )}
          </div>
        </div>

        <BottomSheet
          open={sheetOpen}
          title={
            device
              ? (get(intl.dictionary, 'integration.energyMonitoring.mobile.meterOf') || '').replace(
                  '{{name}}',
                  device.name
                )
              : ''
          }
          onClose={this.closeMeters}
          dataCy="energy-device-meter-sheet"
        >
          <MobileGroup role="radiogroup">
            {meters.map(meter => {
              const selected = meter.id === deviceMeterId;
              return (
                <MobileRow
                  key={meter.id}
                  icon="zap"
                  iconTone={selected ? undefined : 'neutral'}
                  title={meter.name}
                  onClick={this.chooseMeter(meter)}
                  chevron={false}
                  trailing={
                    <span class={style.check} aria-hidden="true">
                      {selected && <i class="fe fe-check" />}
                    </span>
                  }
                  role="radio"
                  aria-checked={selected ? 'true' : 'false'}
                  dataCy="energy-device-meter-option"
                />
              );
            })}
          </MobileGroup>
          <p class={kitStyle.footnote}>
            <Text id="integration.energyMonitoring.mobile.meterSheetHelp" />
          </p>
        </BottomSheet>

        <MobileToast message={toast} toastKey={toastKey} onClose={this.closeToast} dataCy="energy-device-toast" />
      </div>
    );
  }
}

export default MobileMyDevices;
