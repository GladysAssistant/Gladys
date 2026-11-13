import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import actions from '../../../actions/main';
import ClockOffsetText from '../../../components/clock/ClockOffsetText';
import { measureClockOffset, isClockOffsetSignificant } from '../../../utils/clock';

// NTPSynchronized is the kernel "clock synchronized" bit: it stays set for
// hours after the time synchronization is turned off (timedatectl set-ntp
// false), while the clock already drifts. It only means the host keeps its
// clock on time when a time service is on — the one timedated manages, or,
// when timedated knows of none (CanNTP false), one it does not manage.
const hostKeepsTime = timeSync =>
  !!timeSync && timeSync.available && timeSync.ntp_synchronized && (timeSync.ntp_enabled || !timeSync.can_ntp);

// Compares the clock of the server with the clock of this device, and tells
// whether the machine running Gladys keeps its clock on time on its own
// (network time synchronization, read from systemd-timedated on the host) —
// with a one-click fix when that synchronization is simply turned off.
class SettingsSystemClock extends Component {
  state = {
    loading: true,
    measureError: false,
    measure: null,
    timeSync: null,
    enabling: false,
    enableError: null,
    enabled: false,
    // once a gap has been seen on a host that does not keep its time, the
    // restart advice stays: fixing the clock (from here or on the host) does
    // not recompute the scheduled jobs
    restartAdvised: false
  };

  // refresh: "Check again" asks the server for a fresh read of the host
  // status, instead of the one it keeps for a minute
  check = async ({ refresh = false } = {}) => {
    this.setState({ loading: true, measureError: false });
    const [measure, timeSync] = await Promise.all([
      measureClockOffset(this.props.httpClient).catch(e => {
        console.error(e);
        return null;
      }),
      this.props.httpClient.get('/api/v1/system/clock/sync', refresh ? { refresh: true } : undefined).catch(e => {
        console.error(e);
        return null;
      })
    ]);
    this.setState(prevState => ({
      loading: false,
      measure,
      measureError: measure === null,
      timeSync,
      restartAdvised: prevState.restartAdvised || (isClockOffsetSignificant(measure) && !hostKeepsTime(timeSync))
    }));
    // keep the notice of the sidebar in line with what this card displays
    this.props.refreshClockOffsetState({ force: true });
  };

  enableTimeSync = async () => {
    this.setState({ enabling: true, enableError: null });
    try {
      const timeSync = await this.props.httpClient.post('/api/v1/system/clock/sync');
      this.setState({ timeSync, enabled: true, restartAdvised: true });
    } catch (e) {
      console.error(e);
      this.setState({
        enableError: get(e, 'response.data.message') || get(e, 'response.data.error') || e.message || true
      });
    } finally {
      this.setState({ enabling: false });
    }
  };

  checkAgain = () => this.check({ refresh: true });

  componentDidMount() {
    this.check();
  }

  renderTimeSync(timeSync, offsetSignificant, { enabling, enableError, enabled }) {
    if (!timeSync || !timeSync.available) {
      return (
        <div class="alert alert-secondary">
          <Text id="systemSettings.clockSyncUnavailable" />
        </div>
      );
    }
    if (hostKeepsTime(timeSync)) {
      return (
        <div class="alert alert-success">
          <Text id="systemSettings.clockSyncOk" />
          {offsetSignificant && (
            <div class="mt-1">
              <Text id="systemSettings.clockSyncOkDeviceOff" />
            </div>
          )}
        </div>
      );
    }
    if (timeSync.ntp_enabled) {
      return (
        <div class="alert alert-warning">
          <Text id="systemSettings.clockSyncNotSynchronized" />
          {enabled && (
            <div class="mt-1">
              <Text id="systemSettings.clockSyncEnabled" />
            </div>
          )}
        </div>
      );
    }
    if (timeSync.can_ntp) {
      return (
        <div class="alert alert-warning">
          <Text id="systemSettings.clockSyncDisabled" />
          {enableError && (
            <div class="mt-2 text-danger">
              <Text id="systemSettings.clockSyncEnableError" />
              {typeof enableError === 'string' && <small class="d-block">{enableError}</small>}
            </div>
          )}
          <div class="mt-2">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onClick={this.enableTimeSync}
              disabled={enabling}
              data-cy="enable-time-sync"
            >
              <Text id="systemSettings.clockSyncEnableButton" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div class="alert alert-warning">
        <Text id="systemSettings.clockSyncNoService" />
      </div>
    );
  }

  render({}, state) {
    const { loading, measure, measureError, timeSync } = state;
    const offsetSignificant = isClockOffsetSignificant(measure);
    return (
      <div class="card" data-cy="settings-system-clock">
        <h4 class="card-header">
          <Text id="systemSettings.clockTitle" />
        </h4>
        <div class={cx('dimmer', { active: loading })}>
          <div class="loader" />
          <div class="dimmer-content card-body">
            <p>
              <Text id="systemSettings.clockDescription" />
            </p>
            {measureError && (
              <div class="alert alert-danger">
                <Text id="systemSettings.clockMeasureError" />
              </div>
            )}
            {measure && offsetSignificant && (
              <div class="alert alert-danger">
                <ClockOffsetText offset={measure.offset} /> <Text id="systemSettings.clockOffsetConsequences" />
              </div>
            )}
            {measure && !offsetSignificant && (
              <div class="alert alert-success">
                <Text id="systemSettings.clockOnTime" />
              </div>
            )}
            {!loading && this.renderTimeSync(timeSync, offsetSignificant, state)}
            {/* a machine keeping its time means the device is the one off:
                nothing to restart. Once a gap was seen on a machine that does
                not, or the synchronization was turned on from here, the advice
                stays visible even after the clock is fixed. */}
            {state.restartAdvised && (
              <p class="text-muted small">
                <Text id="systemSettings.clockRestartHint" />
              </p>
            )}
            <button type="button" class="btn btn-secondary btn-sm" onClick={this.checkAgain} disabled={loading}>
              <Text id="systemSettings.clockCheckAgain" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', actions)(SettingsSystemClock);
