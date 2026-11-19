import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { route } from 'preact-router';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import update from 'immutability-helper';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

import { getDeviceParam, stripDeviceStatesForSave } from '../../../../utils/device';
import { DEVICE_PARAMS } from './consts';
import EnedisPage from './EnedisPage';
import { buildUsagePointDevicePayload } from './usagePointDeviceBuilder';
import {
  withMobileViewport,
  MobileSectionHeader,
  MobileGroup,
  MobileNotice,
  MobileEmptyState,
  BigButton,
  kitStyle
} from '../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileDeviceItem,
  MobileListLoader,
  MobileProgress,
  integrationMobileStyle
} from '../../../../components/integration/mobile';

const UsagePointDevice = ({
  device,
  language = 'fr',
  deviceIndex,
  updateDeviceName,
  saveDevice,
  destroyDevice,
  reCreateUsagePointDevice,
  syncs = [],
  tooMuchStatesError,
  isMobile
}) => {
  const usagePointId = device.external_id.split(':')[1];

  const lastRefresh = getDeviceParam(device, DEVICE_PARAMS.LAST_REFRESH);
  const numberOfStates = getDeviceParam(device, DEVICE_PARAMS.NUMBER_OF_STATES);
  const mySyncs = syncs.filter(sync => sync.usage_point_id === usagePointId);
  const deviceShouldBeUpdated = device.features.length < 3;

  let syncInProgress;
  if (mySyncs.length > 0) {
    const lastSync = mySyncs[0];
    if (lastSync.jobs_done < lastSync.jobs_total) {
      syncInProgress = lastSync;
      syncInProgress.progress = Math.round((lastSync.jobs_done / lastSync.jobs_total) * 100);
    }
  }

  const lastRefreshDate = lastRefresh
    ? dayjs(lastRefresh)
        .locale(language)
        .format('L LTS')
    : undefined;

  const save = () => {
    saveDevice(deviceIndex);
  };

  const destroy = () => {
    destroyDevice(deviceIndex);
  };

  const reCreate = () => reCreateUsagePointDevice(usagePointId, deviceIndex);

  // On a phone: a row and its sheet, fed by the handlers of the card
  // (docs/specs/mobile-pages/integration-devices.md)
  if (isMobile) {
    return (
      <MobileDeviceItem
        device={device}
        icon="zap"
        subtitle={usagePointId}
        pills={
          syncInProgress ? (
            <span class={cx(integrationMobileStyle.rowNote, integrationMobileStyle.rowNoteAccent)}>
              <Text id="integration.enedis.usagePoints.gladysPlusRefreshProgressLabel" /> {syncInProgress.progress}%
            </span>
          ) : null
        }
        sheetPills={null}
        onNameChange={e => updateDeviceName(deviceIndex, e.target.value)}
        showFeatures={false}
        details={[
          { label: <Text id="integration.enedis.usagePoints.usagePointId" />, value: usagePointId, mono: true },
          { label: <Text id="integration.enedis.usagePoints.mobile.lastSync" />, value: lastRefreshDate },
          { label: <Text id="integration.enedis.usagePoints.mobile.numberOfStates" />, value: numberOfStates }
        ]}
        onSave={() => saveDevice(deviceIndex)}
        actions={
          deviceShouldBeUpdated
            ? [
                {
                  label: <Text id="integration.enedis.usagePoints.recreateButton" />,
                  icon: 'refresh-cw',
                  onClick: reCreate,
                  toast: <Text id="mobileDeviceList.updated" />,
                  dataCy: 'enedis-usage-point-recreate'
                }
              ]
            : []
        }
        onDelete={() => destroyDevice(deviceIndex)}
        deleteError={
          tooMuchStatesError && tooMuchStatesError.selector === device.selector ? (
            <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: tooMuchStatesError.statesNumber }} />
          ) : null
        }
        deleteScheduled={Boolean(tooMuchStatesError) && tooMuchStatesError.selector === device.selector}
        dataCy="enedis-usage-point-row"
      >
        {syncInProgress && (
          <div class={integrationMobileStyle.sheetSection} data-cy="enedis-usage-point-sync">
            <div class={integrationMobileStyle.sheetLabel}>
              <Text id="integration.enedis.usagePoints.gladysPlusRefreshProgressLabel" /> {syncInProgress.progress}%
            </div>
            <MobileProgress value={syncInProgress.progress} />
            <p class={kitStyle.footnote}>
              <Text id="integration.enedis.usagePoints.gladysPlusRefreshProgressDescription" />
            </p>
          </div>
        )}
      </MobileDeviceItem>
    );
  }

  return (
    <div class="col-md-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.enedis.usagePoints.usagePointName" />
          </h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for={`name_${deviceIndex}`}>
              <Text id="integration.enedis.usagePoints.usagePointDeviceName" />
            </label>
            <input
              id={`name_${deviceIndex}`}
              type="text"
              class="form-control"
              value={device.name}
              onInput={e => updateDeviceName(deviceIndex, e.target.value)}
            />
          </div>
          <div class="form-group">
            <label>
              <Text id="integration.enedis.usagePoints.usagePointId" />
            </label>
            <input type="text" class="form-control" value={usagePointId} disabled />
          </div>
          {syncInProgress && (
            <div class="form-group">
              <label>
                <Text id="integration.enedis.usagePoints.gladysPlusRefreshProgressLabel" />
              </label>
              <div class="progress">
                <div
                  class="progress-bar bg-primary"
                  style={{
                    width: `${syncInProgress.progress}%`
                  }}
                  role="progressbar"
                  aria-valuenow={syncInProgress.progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={syncInProgress.progress}
                >
                  <span class="visually-hidden">{syncInProgress.progress}%</span>
                </div>
              </div>
              <div class="mt-2">
                <small>
                  <Text id="integration.enedis.usagePoints.gladysPlusRefreshProgressDescription" />
                </small>
              </div>
            </div>
          )}
          {(lastRefreshDate || numberOfStates) && (
            <div class="card">
              <div class="card-body">
                <h4>
                  <Text id="integration.enedis.usagePoints.statistics" />
                </h4>
                <p>
                  {lastRefreshDate && (
                    <span>
                      <b>
                        <Text id="integration.enedis.usagePoints.lastSyncLabel" />
                      </b>{' '}
                      {lastRefresh}
                      <br />
                    </span>
                  )}
                  {numberOfStates && (
                    <span>
                      <b>
                        <Text id="integration.enedis.usagePoints.numberOfStatesLabel" />
                      </b>{' '}
                      {numberOfStates}
                      <br />
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          <div class="d-sm-none">
            <div class="row mb-2">
              <div class="col-6 pr-1">
                <button class="btn btn-success btn-block" onClick={save}>
                  <Text id="integration.enedis.usagePoints.saveButton" />
                </button>
              </div>
              <div class="col-6 pl-1">
                <button class="btn btn-danger btn-block" onClick={destroy}>
                  <Text id="integration.enedis.usagePoints.deleteButton" />
                </button>
              </div>
            </div>
            {deviceShouldBeUpdated && (
              <button class="btn btn-primary btn-block" onClick={reCreate}>
                <Text id="integration.enedis.usagePoints.recreateButton" />
              </button>
            )}
          </div>
          <div class="d-none d-sm-block">
            <button class="btn btn-success" onClick={save}>
              <Text id="integration.enedis.usagePoints.saveButton" />
            </button>
            <button class="btn btn-danger ml-2" onClick={destroy}>
              <Text id="integration.enedis.usagePoints.deleteButton" />
            </button>
            {deviceShouldBeUpdated && (
              <button class="btn btn-primary ml-2" onClick={reCreate}>
                <Text id="integration.enedis.usagePoints.recreateButton" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// The meters on a phone (docs/specs/mobile-pages/integration-devices.md): the synchronization as
// the button of the page, then one row per meter. Same props as the card below.
const MobileEnedisUsagePoints = ({
  errored,
  loading,
  syncing,
  tooMuchStatesError,
  usagePointsDevices,
  language,
  updateDeviceName,
  saveDevice,
  destroyDevice,
  reCreateUsagePointDevice,
  syncs,
  sync
}) => {
  const devices = usagePointsDevices || [];
  return (
    <MobileIntegrationTab dataCy="enedis-usage-points-mobile">
      {errored && (
        <MobileNotice tone="danger" icon="alert-circle" role="alert">
          <Text id="integration.enedis.welcome.error" />
        </MobileNotice>
      )}
      {devices.length > 0 && (
        <div class={integrationMobileStyle.block}>
          {/* its spinner is for the synchronization only: `loading` also covers a meter being
              saved or deleted, which the sheet of that meter shows */}
          <BigButton
            variant="primary"
            icon="refresh-cw"
            onClick={sync}
            loading={syncing}
            disabled={loading}
            data-cy="enedis-sync"
          >
            <Text id="integration.enedis.usagePoints.refreshLocal" />
          </BigButton>
        </div>
      )}
      <MobileListLoader loading={loading} empty={devices.length === 0}>
        {devices.length > 0 && (
          <div>
            <MobileSectionHeader title={<Text id="integration.enedis.usagePoints.title" />} />
            <MobileGroup>
              {devices.map((usagePointDevice, index) => (
                <UsagePointDevice
                  key={usagePointDevice.external_id}
                  isMobile
                  device={usagePointDevice}
                  language={language}
                  deviceIndex={index}
                  updateDeviceName={updateDeviceName}
                  saveDevice={saveDevice}
                  destroyDevice={destroyDevice}
                  reCreateUsagePointDevice={reCreateUsagePointDevice}
                  syncs={syncs}
                  tooMuchStatesError={tooMuchStatesError}
                />
              ))}
            </MobileGroup>
          </div>
        )}
        {usagePointsDevices && devices.length === 0 && !loading && (
          <MobileEmptyState icon="zap" text={<Text id="integration.enedis.usagePoints.emptyState" />}>
            <BigButton variant="primary" href="/dashboard/integration/device/enedis" data-cy="enedis-connect">
              <Text id="integration.enedis.welcomeTab" />
            </BigButton>
          </MobileEmptyState>
        )}
      </MobileListLoader>
      {devices.length > 0 && (
        <div class={integrationMobileStyle.afterList}>
          <MobileNotice icon="info">
            <Text id="integration.enedis.usagePoints.explanation" />
          </MobileNotice>
        </div>
      )}
    </MobileIntegrationTab>
  );
};

const EnedisUsagePoints = ({
  errored,
  loading,
  usagePointsDevices,
  updateDeviceName,
  updateDeviceParam,
  saveDevice,
  destroyDevice,
  reCreateUsagePointDevice,
  syncs,
  sync
}) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.enedis.usagePoints.title" />
      </h1>
      <div class="page-options d-flex">
        {usagePointsDevices && usagePointsDevices.length > 0 && (
          <button class="btn btn-primary" onClick={sync}>
            <i class="fe fe-refresh-cw" />{' '}
            <span class="d-none d-sm-inline-block ml-2">
              <Text id="integration.enedis.usagePoints.refreshLocal" />
            </span>
          </button>
        )}
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {errored && (
            <p class="alert alert-danger">
              <Text id="integration.enedis.welcome.error" />
            </p>
          )}

          {usagePointsDevices && usagePointsDevices.length === 0 && (
            <p class="alert alert-info">
              <Text id="integration.enedis.usagePoints.emptyState" />
            </p>
          )}

          {usagePointsDevices && usagePointsDevices.length > 0 && (
            <p class="alert alert-primary">
              <Text id="integration.enedis.usagePoints.explanation" />
            </p>
          )}

          <div class="row">
            {usagePointsDevices &&
              usagePointsDevices.map((usagePointDevice, index) => (
                <UsagePointDevice
                  device={usagePointDevice}
                  deviceIndex={index}
                  updateDeviceName={updateDeviceName}
                  updateDeviceParam={updateDeviceParam}
                  saveDevice={saveDevice}
                  destroyDevice={destroyDevice}
                  reCreateUsagePointDevice={reCreateUsagePointDevice}
                  syncs={syncs}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

class EnedisWelcomePageComponent extends Component {
  getCurrentEnedisUsagePoints = async () => {
    try {
      const usagePointsDevices = await this.props.httpClient.get('/api/v1/service/enedis/device');
      this.setState({ usagePointsDevices });
    } catch (e) {
      console.error(e);
    }
  };
  updateDeviceParam = async (deviceIndex, deviceParam, value) => {
    const device = this.state.usagePointsDevices[deviceIndex];
    const deviceParamIndex = device.params.findIndex(p => p.name === deviceParam);
    let newUsagePointsDevices;
    if (deviceParamIndex !== -1) {
      newUsagePointsDevices = update(this.state.usagePointsDevices, {
        [deviceIndex]: {
          params: {
            [deviceParamIndex]: {
              value: {
                $set: value
              }
            }
          }
        }
      });
    } else {
      newUsagePointsDevices = update(this.state.usagePointsDevices, {
        [deviceIndex]: {
          params: {
            $push: [
              {
                name: deviceParam,
                value
              }
            ]
          }
        }
      });
    }
    await this.setState({ usagePointsDevices: newUsagePointsDevices });
  };
  updateDeviceName = (deviceIndex, name) => {
    const usagePointsDevices = update(this.state.usagePointsDevices, {
      [deviceIndex]: { name: { $set: name } }
    });
    this.setState({ usagePointsDevices });
  };
  getCurrentSync = async () => {
    try {
      const syncs = await this.props.session.gatewayClient.enedisGetSync();
      this.setState({ syncs });
    } catch (e) {
      console.error(e);
    }
  };
  sync = async () => {
    await this.setState({ loading: true, syncing: true });
    try {
      await this.props.httpClient.post('/api/v1/service/enedis/sync');
      route('/dashboard/settings/jobs');
    } catch (e) {
      console.error(e);
    }
    await this.setState({ loading: false, syncing: false });
  };
  // saveDevice and destroyDevice resolve to false when the request failed: the phone sheet then
  // says so (the card has no error message for them)
  saveDevice = async deviceIndex => {
    await this.setState({ loading: true });
    let saved = true;
    try {
      const device = this.state.usagePointsDevices[deviceIndex];
      await this.props.httpClient.post('/api/v1/device', stripDeviceStatesForSave(device));
    } catch (e) {
      console.error(e);
      saved = false;
    }
    await this.setState({ loading: false });
    return saved;
  };
  destroyDevice = async deviceIndex => {
    await this.setState({ loading: true, tooMuchStatesError: null });
    let deleted = true;
    const device = this.state.usagePointsDevices[deviceIndex];
    try {
      await this.props.httpClient.delete(`/api/v1/device/${device.selector}`);
      await this.getCurrentEnedisUsagePoints();
      await this.getCurrentSync();
    } catch (e) {
      console.error(e);
      deleted = false;
      // A meter holds years of states: too many to delete at once, Gladys purges them in the
      // background and trying again right away is refused again. The phone confirmation says
      // so, with the link to the job.
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        await this.setState({ tooMuchStatesError: { selector: device.selector, statesNumber } });
      }
    }
    await this.setState({ loading: false });
    return deleted;
  };
  reCreateUsagePointDevice = async (usagePointId, deviceIndex) => {
    const existingDevice = this.state.usagePointsDevices[deviceIndex];
    const enedisIntegration = await this.props.httpClient.get(`/api/v1/service/enedis`, {
      pod_id: null
    });
    const serviceId = enedisIntegration.id;

    const device = buildUsagePointDevicePayload({
      usagePointId,
      serviceId,
      intlDictionary: this.props.intl.dictionary,
      existingDevice
    });

    await this.props.httpClient.post('/api/v1/device', stripDeviceStatesForSave(device));
    await this.getCurrentEnedisUsagePoints();
  };
  init = async () => {
    await this.setState({ loading: true });
    await this.getCurrentEnedisUsagePoints();
    await this.getCurrentSync();
    await this.setState({ loading: false });
  };
  componentDidMount() {
    this.init();
    this.refreshInterval = setInterval(this.getCurrentSync, 30 * 1000);
  }
  componentWillUnmount() {
    clearInterval(this.refreshInterval);
  }
  render({ user, isMobile }, { loading, syncing, tooMuchStatesError, errored, usagePointsDevices, syncs }) {
    const UsagePointsView = isMobile ? MobileEnedisUsagePoints : EnedisUsagePoints;
    return (
      <EnedisPage user={this.props.user}>
        <UsagePointsView
          loading={loading}
          syncing={Boolean(syncing)}
          tooMuchStatesError={tooMuchStatesError}
          errored={errored}
          usagePointsDevices={usagePointsDevices}
          sync={this.sync}
          syncs={syncs}
          language={user.language}
          updateDeviceName={this.updateDeviceName}
          updateDeviceParam={this.updateDeviceParam}
          saveDevice={this.saveDevice}
          destroyDevice={this.destroyDevice}
          reCreateUsagePointDevice={this.reCreateUsagePointDevice}
        />
      </EnedisPage>
    );
  }
}

export default connect('user,session,httpClient', {})(withIntlAsProp(withMobileViewport(EnedisWelcomePageComponent)));
