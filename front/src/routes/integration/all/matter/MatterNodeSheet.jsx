import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import get from 'get-value';

import BottomSheet from '../../../../components/sheet/BottomSheet';
import RelativeTime from '../../../../components/device/RelativeTime';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileNotice,
  BigButton,
  ConfirmSheet
} from '../../../../components/mobile';
import MatterShareSheet from './MatterShareSheet';
import { NodeStatusPill } from './MatterNodeList';
import { UnavailableReason } from './MatterAvailability';
import { getNetworkIcon, getNodeDisplayName, getDeviceAvailability } from './matterUtils';
import style from './style.css';

const SIGNAL_TONES = {
  excellent: 'success',
  good: 'success',
  fair: 'warning',
  weak: 'danger'
};

// The message of an error of Gladys (an Error500 carries it in `error`), or nothing
const getErrorMessage = e => {
  const data = e && e.response && e.response.data;
  return (data && (data.error || data.message)) || null;
};

const InformationRow = ({ title, value, mono, dataCy }) =>
  value !== undefined && value !== null && value !== '' ? (
    <MobileRow
      title={<Text id={title} />}
      value={mono ? <span class={style.mono}>{value}</span> : value}
      chevron={false}
      dataCy={dataCy}
    />
  ) : null;

/**
 * @description The sheet of a Matter node (server/services/matter/docs/specs/matter.md): its status
 * and last contact, the appliance (firmware…), its network and signal, the controllers which have
 * access to it, its devices, and the actions: identify, share with another ecosystem, remove.
 */
class MatterNodeSheet extends Component {
  state = {
    details: null,
    loading: false,
    error: null,
    identifying: false,
    identifyResult: null,
    shareOpen: false,
    share: null,
    shareLoading: false,
    shareError: null,
    confirmRemove: false,
    deleteGladysDevices: false
  };

  componentDidMount() {
    if (this.props.open && this.props.nodeId) {
      this.loadDetails();
    }
  }

  componentDidUpdate(previousProps) {
    const opened = this.props.open && !previousProps.open;
    if (this.props.nodeId && (opened || (this.props.open && previousProps.nodeId !== this.props.nodeId))) {
      this.loadDetails();
    }
  }

  loadDetails = async () => {
    const { nodeId } = this.props;
    this.setState({
      details: null,
      loading: true,
      error: null,
      identifyResult: null,
      share: null,
      shareError: null,
      shareOpen: false,
      confirmRemove: false
    });
    try {
      const details = await this.props.httpClient.get(`/api/v1/service/matter/node/${nodeId}`);
      // the user may have opened another node meanwhile
      if (this.props.nodeId === nodeId) {
        this.setState({ details, loading: false });
      }
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: getErrorMessage(e) || true });
    }
  };

  identify = async () => {
    this.setState({ identifying: true, identifyResult: null });
    try {
      await this.props.httpClient.post(`/api/v1/service/matter/node/${this.props.nodeId}/identify`);
      this.setState({ identifying: false, identifyResult: { success: true } });
    } catch (e) {
      console.error(e);
      this.setState({ identifying: false, identifyResult: { success: false, message: getErrorMessage(e) } });
    }
  };

  share = async () => {
    this.setState({ shareOpen: true, shareLoading: true, share: null, shareError: null });
    try {
      const share = await this.props.httpClient.post(`/api/v1/service/matter/node/${this.props.nodeId}/share`);
      this.setState({ share, shareLoading: false });
    } catch (e) {
      console.error(e);
      this.setState({ shareLoading: false, shareError: getErrorMessage(e) || '' });
    }
  };

  closeShare = () => {
    this.setState({ shareOpen: false });
  };

  askRemove = () => {
    this.setState({ confirmRemove: true, deleteGladysDevices: false });
  };

  cancelRemove = () => {
    this.setState({ confirmRemove: false });
  };

  toggleDeleteGladysDevices = () => {
    this.setState(prevState => ({ deleteGladysDevices: !prevState.deleteGladysDevices }));
  };

  confirmRemove = () => {
    const { deleteGladysDevices } = this.state;
    this.setState({ confirmRemove: false });
    this.props.onDecommission(this.props.node, deleteGladysDevices);
  };

  renderNetwork(network) {
    const signal = network.signal_quality && (
      <span>
        <MobilePill tone={SIGNAL_TONES[network.signal_quality]}>
          <Text id={`integration.matter.node.signal.${network.signal_quality}`} />
        </MobilePill>{' '}
        <small class="text-muted">{network.rssi} dBm</small>
      </span>
    );
    return (
      <MobileGroup data-cy="matter-node-network">
        <MobileRow
          icon={getNetworkIcon(network.type)}
          title={<Text id="integration.matter.node.network.type" />}
          value={<Text id={`integration.matter.node.network.types.${network.type || 'unknown'}`} />}
          chevron={false}
        />
        {signal && <MobileRow title={<Text id="integration.matter.node.network.signal" />} trailing={signal} />}
        {network.thread_role && (
          <MobileRow
            title={<Text id="integration.matter.node.network.threadRole" />}
            value={
              <span>
                <Text id={`integration.matter.node.network.threadRoles.${network.thread_role}`} />
                {network.thread_channel !== null && (
                  <span>
                    {' · '}
                    <Text id="integration.matter.node.network.channel" fields={{ channel: network.thread_channel }} />
                  </span>
                )}
              </span>
            }
            chevron={false}
          />
        )}
        {network.power_source && (
          <MobileRow
            title={<Text id="integration.matter.node.network.powerSource" />}
            value={<Text id={`integration.matter.node.network.powerSources.${network.power_source}`} />}
            chevron={false}
          />
        )}
        {network.ip_addresses.length > 0 && (
          <MobileRow
            title={<Text id="integration.matter.node.network.ipAddresses" />}
            subtitle={<span class={style.mono}>{network.ip_addresses.join(', ')}</span>}
            chevron={false}
          />
        )}
      </MobileGroup>
    );
  }

  renderControllers(controllers) {
    if (controllers === null) {
      return (
        <MobileNotice icon="info">
          <Text id="integration.matter.node.controllers.unknown" />
        </MobileNotice>
      );
    }
    return (
      <MobileGroup data-cy="matter-node-controllers">
        {controllers.map(controller => (
          <MobileRow
            key={controller.fabric_index}
            icon="shield"
            title={
              controller.label ||
              controller.vendor_name || (
                <Text
                  id="integration.matter.node.controllers.unknownController"
                  fields={{ vendorId: `0x${controller.vendor_id.toString(16).toUpperCase()}` }}
                />
              )
            }
            subtitle={controller.label && controller.vendor_name}
            trailing={
              controller.is_gladys && (
                <MobilePill tone="accent">
                  <Text id="integration.matter.node.controllers.thisController" />
                </MobilePill>
              )
            }
            dataCy="matter-node-controller"
          />
        ))}
      </MobileGroup>
    );
  }

  renderDevices(details, status) {
    // the availability follows the status of the node, kept live by the WebSocket
    const nodesStatus = new Map([
      [
        details.node_id,
        { available: status.available, unreachable_device_paths: status.unreachable_device_paths || [] }
      ]
    ]);
    const getAvailability = device =>
      device.device_path === undefined
        ? { available: device.available, reason: device.unavailable_reason }
        : getDeviceAvailability({ external_id: `matter:${details.node_id}:${device.device_path}` }, nodesStatus);
    return (
      <div>
        {details.gladys_devices.length > 0 && (
          <MobileGroup data-cy="matter-node-gladys-devices">
            {details.gladys_devices.map(device => {
              const availability = getAvailability(device);
              return (
                <MobileRow
                  key={device.selector}
                  icon="box"
                  title={device.name}
                  subtitle={!availability.available && <UnavailableReason reason={availability.reason} />}
                  trailing={
                    <MobilePill tone={availability.available ? 'success' : 'danger'}>
                      <Text
                        id={
                          availability.available
                            ? 'integration.matter.device.available'
                            : 'integration.matter.device.unavailable'
                        }
                      />
                    </MobilePill>
                  }
                  dataCy="matter-node-gladys-device"
                />
              );
            })}
          </MobileGroup>
        )}
        {details.gladys_devices.length === 0 && (
          <MobileNotice icon="info">
            <Text id="integration.matter.node.noGladysDevices" />
          </MobileNotice>
        )}
        {details.bridged_devices.length > 0 && (
          <div class={style.sheetSubsection}>
            <MobileSectionHeader title={<Text id="integration.matter.node.bridgedDevices" />} />
            <MobileGroup data-cy="matter-node-bridged-devices">
              {details.bridged_devices.map(device => {
                const reachable = status.unreachable_device_paths
                  ? !status.unreachable_device_paths.includes(device.path)
                  : device.reachable;
                return (
                  <MobileRow
                    key={device.path}
                    icon="link-2"
                    title={device.name}
                    trailing={
                      <MobilePill tone={reachable ? 'success' : 'danger'}>
                        <Text
                          id={reachable ? 'integration.matter.node.reachable' : 'integration.matter.node.unreachable'}
                        />
                      </MobilePill>
                    }
                    dataCy="matter-node-bridged-device"
                  />
                );
              })}
            </MobileGroup>
          </div>
        )}
      </div>
    );
  }

  render(
    { open, node, intl, user, decommissioning, onClose },
    {
      details,
      loading,
      error,
      identifying,
      identifyResult,
      shareOpen,
      share,
      shareLoading,
      shareError,
      confirmRemove,
      deleteGladysDevices
    }
  ) {
    const dictionary = get(intl, 'dictionary');
    const isAdmin = user && user.role === 'admin';
    // the status follows the node list, kept live by the WebSocket; the rest comes from the sheet
    const status = node || details;
    const title = status ? getNodeDisplayName(status, dictionary) : '';
    const linkedDevices = (node && node.gladys_devices) || [];
    const language = user && user.language;

    return (
      <BottomSheet open={open} title={title} onClose={onClose} dataCy="matter-node-sheet">
        {loading && (
          <div class="dimmer active">
            <div class="loader" />
            <div class="dimmer-content" style="min-height: 120px" />
          </div>
        )}
        {error && (
          <MobileNotice tone="danger" icon="alert-circle">
            <Text id="integration.matter.node.loadError" />
            {typeof error === 'string' && (
              <div>
                <small>{error}</small>
              </div>
            )}
          </MobileNotice>
        )}
        {details && status && (
          <div>
            {status.available === false && (
              <MobileNotice tone="danger" icon="wifi-off" data-cy="matter-node-unavailable">
                <Text id="integration.matter.node.unavailableNotice" />
              </MobileNotice>
            )}
            {!details.live && status.available !== false && (
              <MobileNotice icon="info">
                <Text id="integration.matter.node.cachedNotice" />
              </MobileNotice>
            )}

            <MobileSectionHeader title={<Text id="integration.matter.node.sections.status" />} />
            <div class={style.sheetBlock}>
              <MobileGroup>
                <MobileRow
                  title={<Text id="integration.matter.node.statusLabel" />}
                  trailing={<NodeStatusPill node={status} />}
                />
                <MobileRow
                  title={<Text id="integration.matter.node.lastContact" />}
                  value={
                    status.last_contact ? (
                      <RelativeTime datetime={status.last_contact} language={language} futureDisabled />
                    ) : (
                      <Text id="integration.matter.node.never" />
                    )
                  }
                  chevron={false}
                  dataCy="matter-node-last-contact"
                />
              </MobileGroup>
            </div>

            <MobileSectionHeader title={<Text id="integration.matter.node.sections.appliance" />} />
            <div class={style.sheetBlock}>
              <MobileGroup data-cy="matter-node-information">
                <InformationRow title="integration.matter.node.manufacturer" value={details.information.vendor_name} />
                <InformationRow title="integration.matter.node.product" value={details.information.product_name} />
                <InformationRow title="integration.matter.node.label" value={details.information.node_label} />
                <InformationRow
                  title="integration.matter.node.firmware"
                  value={details.information.software_version}
                  dataCy="matter-node-firmware"
                />
                <InformationRow title="integration.matter.node.hardware" value={details.information.hardware_version} />
                <InformationRow
                  title="integration.matter.node.serialNumber"
                  value={details.information.serial_number}
                  mono
                />
                <MobileRow
                  title={<Text id="integration.matter.node.identifiers" />}
                  subtitle={
                    <span class={style.mono}>
                      <Text
                        id="integration.matter.settings.node.ids"
                        fields={{
                          nodeId: details.node_id,
                          vendorId: details.information.vendor_id,
                          productId: details.information.product_id
                        }}
                      />
                    </span>
                  }
                  chevron={false}
                />
              </MobileGroup>
            </div>

            <MobileSectionHeader title={<Text id="integration.matter.node.sections.network" />} />
            <div class={style.sheetBlock}>{this.renderNetwork(details.network)}</div>

            <MobileSectionHeader title={<Text id="integration.matter.node.sections.controllers" />} />
            <div class={style.sheetBlock}>{this.renderControllers(details.controllers)}</div>

            <MobileSectionHeader title={<Text id="integration.matter.node.sections.devices" />} />
            <div class={style.sheetBlock}>{this.renderDevices(details, status)}</div>

            <MobileSectionHeader title={<Text id="integration.matter.node.sections.actions" />} />
            {identifyResult && identifyResult.success && (
              <MobileNotice tone="success" icon="check" data-cy="matter-node-identify-success">
                <Text id="integration.matter.node.identifySuccess" />
              </MobileNotice>
            )}
            {identifyResult && !identifyResult.success && (
              <MobileNotice tone="danger" icon="alert-circle">
                <Text id="integration.matter.node.identifyError" />
                {identifyResult.message && (
                  <div>
                    <small>{identifyResult.message}</small>
                  </div>
                )}
              </MobileNotice>
            )}
            <div class={style.sheetBlock}>
              {details.capabilities.identify && (
                <BigButton
                  icon="zap"
                  onClick={this.identify}
                  loading={identifying}
                  disabled={status.available === false}
                  data-cy="matter-node-identify"
                >
                  <Text id="integration.matter.node.identify" />
                </BigButton>
              )}
              {isAdmin && details.capabilities.share && (
                <BigButton
                  icon="share"
                  onClick={this.share}
                  disabled={status.available === false}
                  data-cy="matter-node-share"
                >
                  <Text id="integration.matter.node.share.button" />
                </BigButton>
              )}
              {isAdmin && (
                <BigButton
                  variant="dangerSoft"
                  icon="trash-2"
                  onClick={this.askRemove}
                  loading={decommissioning}
                  data-cy="matter-node-remove"
                >
                  <Text id="integration.matter.node.remove" />
                </BigButton>
              )}
            </div>
          </div>
        )}

        <MatterShareSheet
          open={shareOpen}
          title={get(dictionary, 'integration.matter.node.share.title') || ''}
          share={share}
          loading={shareLoading}
          error={shareError}
          onClose={this.closeShare}
          depth={1}
        />

        <ConfirmSheet
          open={confirmRemove}
          title={get(dictionary, 'integration.matter.node.removeTitle') || ''}
          confirmLabel={<Text id="integration.matter.settings.decommission.confirmButton" />}
          cancelLabel={<Text id="integration.matter.settings.decommission.cancelButton" />}
          destructive
          onConfirm={this.confirmRemove}
          onCancel={this.cancelRemove}
          dataCy="matter-node-remove-confirm"
          depth={1}
        >
          <div class="mb-3">
            <MarkupText id="integration.matter.settings.decommission.confirmMessage" />
          </div>
          {linkedDevices.length > 0 && (
            <div class="mb-3">
              <Text id="integration.matter.settings.decommission.linkedDevices" />
              <ul>
                {linkedDevices.map(gladysDevice => (
                  <li key={gladysDevice.selector}>{gladysDevice.name}</li>
                ))}
              </ul>
              <label class="custom-control custom-checkbox">
                <input
                  type="checkbox"
                  class="custom-control-input"
                  checked={deleteGladysDevices}
                  onChange={this.toggleDeleteGladysDevices}
                  data-cy="matter-node-remove-devices"
                />
                <span class="custom-control-label">
                  <Text id="integration.matter.settings.decommission.deleteDevicesLabel" />
                </span>
              </label>
              <small class="form-text text-muted">
                <Text id="integration.matter.settings.decommission.deleteDevicesHelp" />
              </small>
            </div>
          )}
        </ConfirmSheet>
      </BottomSheet>
    );
  }
}

export default MatterNodeSheet;
