import { Text, MarkupText } from 'preact-i18n';

import {
  MobileSectionHeader,
  MobileGroup,
  MobileNotice,
  MobilePill,
  MobileEmptyState,
  BigButton
} from '../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListToolbar,
  ToolButton,
  MobileDeviceItem,
  MobileListLoader,
  MobileWaitingNotice
} from '../../../../components/integration/mobile';
import MatterDeviceBox from './MatterDeviceBox';
import { MatterDeviceSaveErrorContent } from './MatterDeviceSaveErrorAlert';

const DisconnectedPill = () => (
  <MobilePill tone="danger" data-cy="matter-device-disconnected">
    <i class="fe fe-wifi-off" aria-hidden="true" />
    <Text id="integration.matter.device.nodeDisconnected" />
  </MobilePill>
);

// A device paired with the Matter controller that Gladys does not have yet, or has differently:
// what its desktop card says and does, behind a row
const PairedDevice = ({ item, addDeviceToGladys, replaceGladysDevice }) => {
  const { device, title, pairedError, isNodeIdChanged, isUpdate, nodeIsDisconnected } = item;
  const hasFeatures = Boolean(device.features) && device.features.length > 0;
  let primaryAction;
  if (isNodeIdChanged) {
    primaryAction = {
      label: <Text id="integration.matter.device.replaceExisting" />,
      onClick: () => replaceGladysDevice(device),
      toast: <Text id="mobileDeviceList.updated" />
    };
  } else {
    primaryAction = {
      label: (
        <Text id={isUpdate ? 'integration.matter.device.updateInGladys' : 'integration.matter.device.addToGladys'} />
      ),
      onClick: () => addDeviceToGladys(device),
      toast: <Text id={isUpdate ? 'mobileDeviceList.updated' : 'mobileDeviceList.added'} />
    };
  }
  return (
    <MobileDeviceItem
      device={device}
      title={title}
      sheetTitle={title}
      subtitle={
        <Text
          id="editDeviceForm.mobile.featuresTitle"
          plural={(device.features || []).length}
          fields={{ count: (device.features || []).length }}
        />
      }
      pills={nodeIsDisconnected ? <DisconnectedPill /> : null}
      status={
        (isNodeIdChanged || isUpdate) && (
          <MobilePill tone="accent">
            <Text id="mobileDeviceList.updateAvailable" />
          </MobilePill>
        )
      }
      notices={
        (isNodeIdChanged || isUpdate) && (
          <MobileNotice icon="info">
            <Text
              id={
                isNodeIdChanged
                  ? 'integration.matter.device.deviceAlreadyExist'
                  : 'integration.matter.device.deviceHasUpdates'
              }
            />
          </MobileNotice>
        )
      }
      showFeatures={hasFeatures}
      saveError={
        pairedError && (
          <MatterDeviceSaveErrorContent
            errorMessage={pairedError.errorMessage}
            errorDetail={pairedError.errorDetail}
            isKnownError={pairedError.isKnownError}
          />
        )
      }
      primaryAction={primaryAction}
      dataCy="matter-paired-device-row"
    />
  );
};

/**
 * @description The Matter devices on a phone (docs/specs/mobile-pages/integration-devices.md, E):
 * the devices paired but not in Gladys yet first, then one row per device. A presentation only:
 * the lists, the requests and the errors come from MatterDevices.jsx.
 */
const MobileMatterDevices = ({
  orderDir,
  search,
  onSearch,
  onOrderChange,
  refresh,
  getGladysDevicesLoading,
  getPairedDevicesLoading,
  error,
  matterEnabled,
  matterDevices,
  pairedItems,
  hasPairedDevices,
  housesWithRooms,
  nodesIsConnected,
  addDeviceToGladys,
  replaceGladysDevice
}) => (
  <MobileIntegrationTab dataCy="matter-devices-mobile">
    <MobileListToolbar searchValue={search} onSearch={onSearch} orderDir={orderDir} onOrderChange={onOrderChange}>
      <ToolButton
        icon="refresh-cw"
        iconOnly
        label={<Text id="mobileDeviceList.refresh" />}
        onClick={refresh}
        data-cy="matter-devices-refresh"
      />
    </MobileListToolbar>
    {matterEnabled === false && (
      <MobileNotice tone="warning" icon="alert-triangle">
        <MarkupText id="integration.matter.settings.disabledWarning" />
      </MobileNotice>
    )}
    {error && (
      <MobileNotice tone="danger" icon="alert-circle">
        <Text id="integration.matter.error.getDevicesError" />
      </MobileNotice>
    )}
    {getPairedDevicesLoading && (
      <MobileWaitingNotice data-cy="matter-paired-loading">
        <strong>
          <Text id="integration.matter.device.refreshMatterDevices" />
        </strong>
        <br />
        <Text id="integration.matter.device.refreshMatterDevicesDescription" />
      </MobileWaitingNotice>
    )}
    {pairedItems.length > 0 && (
      <div data-cy="matter-paired-devices">
        <MobileSectionHeader title={<Text id="integration.matter.device.pairedDevicesTitle" />} />
        <MobileGroup>
          {pairedItems.map(item => (
            <PairedDevice
              key={item.device.external_id}
              item={item}
              addDeviceToGladys={addDeviceToGladys}
              replaceGladysDevice={replaceGladysDevice}
            />
          ))}
        </MobileGroup>
      </div>
    )}
    <MobileListLoader loading={getGladysDevicesLoading} empty={!matterDevices || matterDevices.length === 0}>
      {matterDevices && matterDevices.length > 0 && (
        <div>
          <MobileSectionHeader
            title={
              <Text
                id="mobileDeviceList.deviceCount"
                plural={matterDevices.length}
                fields={{ count: matterDevices.length }}
              />
            }
          />
          <MobileGroup>
            {matterDevices.map((device, index) => (
              <MatterDeviceBox
                key={device.external_id}
                isMobile
                editable
                saveButton
                deleteButton
                device={device}
                deviceIndex={index}
                refreshMatterDevices={refresh}
                nodesIsConnected={nodesIsConnected}
                housesWithRooms={housesWithRooms}
              />
            ))}
          </MobileGroup>
        </div>
      )}
      {matterDevices && matterDevices.length === 0 && !hasPairedDevices && !getGladysDevicesLoading && (
        <MobileEmptyState icon="cpu" text={<Text id="integration.matter.device.noDeviceFound" />}>
          {matterEnabled && (
            <BigButton
              variant="primary"
              icon="plus"
              href="/dashboard/integration/device/matter/discover"
              data-cy="matter-devices-add"
            >
              <Text id="integration.matter.addTab" />
            </BigButton>
          )}
        </MobileEmptyState>
      )}
    </MobileListLoader>
  </MobileIntegrationTab>
);

export default MobileMatterDevices;
