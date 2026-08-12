import cx from 'classnames';
import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../../server/utils/constants';
import { connect } from 'unistore/preact';

const WEEK_DAYS = [
  { value: '0', labelKey: 'integration.openai.weeklyDigest.daySunday' },
  { value: '1', labelKey: 'integration.openai.weeklyDigest.dayMonday' },
  { value: '2', labelKey: 'integration.openai.weeklyDigest.dayTuesday' },
  { value: '3', labelKey: 'integration.openai.weeklyDigest.dayWednesday' },
  { value: '4', labelKey: 'integration.openai.weeklyDigest.dayThursday' },
  { value: '5', labelKey: 'integration.openai.weeklyDigest.dayFriday' },
  { value: '6', labelKey: 'integration.openai.weeklyDigest.daySaturday' }
];

class WeeklyDigestSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsLoaded: false,
      loadError: false,
      weeklyDigestEnabled: false,
      weeklyDigestDay: '0',
      weeklyDigestHour: '18',
      saving: false,
      sending: false
    };
  }

  getSettings = async () => {
    this.setState({ settingsLoaded: false, loadError: false });
    try {
      const [{ value: enabled }, { value: day }, { value: hour }] = await Promise.all([
        this.props.httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED}`),
        this.props.httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_DAY}`),
        this.props.httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_HOUR}`)
      ]);

      this.setState({
        settingsLoaded: true,
        loadError: false,
        weeklyDigestEnabled: enabled === '1' || enabled === true || enabled === 'true',
        weeklyDigestDay: day != null ? day : '0',
        weeklyDigestHour: hour != null ? hour : '18'
      });
    } catch (e) {
      console.error(e);
      this.setState({ settingsLoaded: false, loadError: true });
    }
  };

  saveAndReschedule = async updates => {
    if (!this.state.settingsLoaded || this.state.loadError) {
      return;
    }
    this.setState({ saving: true, ...updates });
    try {
      const state = { ...this.state, ...updates };
      await Promise.all([
        this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED}`, {
          value: state.weeklyDigestEnabled ? '1' : '0'
        }),
        this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_DAY}`, {
          value: state.weeklyDigestDay
        }),
        this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_HOUR}`, {
          value: state.weeklyDigestHour
        })
      ]);
      await this.props.httpClient.post('/api/v1/gateway/weekly-digest/reschedule');
    } catch (e) {
      console.error(e);
    }
    this.setState({ saving: false });
  };

  updateEnabled = async () => {
    await this.saveAndReschedule({
      weeklyDigestEnabled: !this.state.weeklyDigestEnabled
    });
  };

  updateDay = async e => {
    await this.saveAndReschedule({
      weeklyDigestDay: e.target.value
    });
  };

  updateHour = async e => {
    await this.saveAndReschedule({
      weeklyDigestHour: e.target.value
    });
  };

  sendNow = async () => {
    if (!this.state.settingsLoaded || this.state.loadError) {
      return;
    }
    this.setState({ sending: true });
    try {
      await this.props.httpClient.post('/api/v1/gateway/weekly-digest/send');
    } catch (e) {
      console.error(e);
    }
    this.setState({ sending: false });
  };

  componentDidMount() {
    this.getSettings();
  }

  render({}, { settingsLoaded, loadError, weeklyDigestEnabled, weeklyDigestDay, weeklyDigestHour, saving, sending }) {
    const formDisabled = !settingsLoaded || loadError || saving;

    return (
      <div class="card mt-4">
        <h4 class="card-header d-flex flex-row justify-content-between">
          <label
            className={cx('mb-0', {
              'text-muted': settingsLoaded && !weeklyDigestEnabled
            })}
          >
            <Text id="integration.openai.weeklyDigest.title" />
          </label>
          <label className="custom-switch">
            <input
              type="checkbox"
              name="weekly-digest-active"
              value="1"
              className="custom-switch-input"
              checked={weeklyDigestEnabled}
              onClick={this.updateEnabled}
              disabled={formDisabled}
            />
            <span class="custom-switch-indicator" />
          </label>
        </h4>
        <div class="card-body">
          {!settingsLoaded && !loadError && (
            <p class="text-muted mb-0">
              <Text id="integration.openai.weeklyDigest.loading" />
            </p>
          )}
          {loadError && (
            <div class="alert alert-danger mb-3" role="alert">
              <Text id="integration.openai.weeklyDigest.loadError" />
              <button type="button" class="btn btn-sm btn-outline-danger ml-3" onClick={this.getSettings}>
                <Text id="integration.openai.weeklyDigest.retry" />
              </button>
            </div>
          )}
          {settingsLoaded && (
            <p
              class={cx('mb-3', {
                'text-muted': !weeklyDigestEnabled
              })}
            >
              <Text id="integration.openai.weeklyDigest.description" />
            </p>
          )}
          <div class="form-row">
            <div class="form-group col-md-6">
              <label class="form-label">
                <Text id="integration.openai.weeklyDigest.dayLabel" />
              </label>
              <select
                class="form-control"
                value={weeklyDigestDay}
                onChange={this.updateDay}
                disabled={formDisabled || !weeklyDigestEnabled}
              >
                {WEEK_DAYS.map(day => (
                  <option value={day.value}>
                    <Text id={day.labelKey} />
                  </option>
                ))}
              </select>
            </div>
            <div class="form-group col-md-6">
              <label class="form-label">
                <Text id="integration.openai.weeklyDigest.hourLabel" />
              </label>
              <select
                class="form-control"
                value={weeklyDigestHour}
                onChange={this.updateHour}
                disabled={formDisabled || !weeklyDigestEnabled}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option value={String(hour)}>{`${String(hour).padStart(2, '0')}:00`}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-outline-primary"
            onClick={this.sendNow}
            disabled={formDisabled || sending}
          >
            <Text id="integration.openai.weeklyDigest.sendNow" />
          </button>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(WeeklyDigestSettings);
