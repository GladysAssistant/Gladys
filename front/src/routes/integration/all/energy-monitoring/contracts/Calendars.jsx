import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { errorMessage } from './contractUtils';

const LAST_VALUES = 30;

// The tariff calendars of the instance (docs/specs/energy-contracts.md 8.2 item 4):
// provider, coverage, last values, and a recalculation from a date.
class CalendarsSection extends Component {
  state = {
    calendars: [],
    loading: false,
    error: null,
    expanded: null,
    entries: [],
    recalculateFrom: '',
    recalculating: false,
    recalculated: false
  };

  componentDidMount() {
    this.loadCalendars();
  }

  loadCalendars = async () => {
    try {
      this.setState({ loading: true, error: null });
      const calendars = await this.props.httpClient.get('/api/v1/energy_calendar');
      this.setState({ calendars: Array.isArray(calendars) ? calendars : [] });
    } catch (e) {
      this.setState({ error: errorMessage(e) });
    } finally {
      this.setState({ loading: false });
    }
  };

  toggle = async key => {
    if (this.state.expanded === key) {
      this.setState({ expanded: null, entries: [] });
      return;
    }
    try {
      this.setState({ expanded: key, entries: [], loading: true });
      const entries = await this.props.httpClient.get(`/api/v1/energy_calendar/${key}`, { limit: LAST_VALUES });
      this.setState({ entries: Array.isArray(entries) ? entries : [] });
    } catch (e) {
      this.setState({ error: errorMessage(e) });
    } finally {
      this.setState({ loading: false });
    }
  };

  recalculate = async () => {
    try {
      this.setState({ recalculating: true, recalculated: false, error: null });
      await this.props.httpClient.post('/api/v1/energy_contract/recalculate', { from: this.state.recalculateFrom });
      this.setState({ recalculated: true });
    } catch (e) {
      this.setState({ error: errorMessage(e) });
    } finally {
      this.setState({ recalculating: false });
    }
  };

  formatDate = value => (value ? new Date(value).toLocaleString() : '—');

  render(props, { calendars, loading, error, expanded, entries, recalculateFrom, recalculating, recalculated }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.energyMonitoring.contracts.calendars.title" />
          </h1>
        </div>
        <div class="card-body">
          <div class={cx('dimmer', { active: loading })}>
            <div class="loader" />
            <div class="dimmer-content">
              <p class="text-muted">
                <Text id="integration.energyMonitoring.contracts.calendars.description" />
              </p>
              {error && (
                <div class="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {calendars.length === 0 && !loading && (
                <div class="text-muted mb-3">
                  <Text id="integration.energyMonitoring.contracts.calendars.empty" />
                </div>
              )}
              {calendars.length > 0 && (
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>
                          <Text id="integration.energyMonitoring.contracts.calendars.key" />
                        </th>
                        <th>
                          <Text id="integration.energyMonitoring.contracts.calendars.provider" />
                        </th>
                        <th>
                          <Text id="integration.energyMonitoring.contracts.calendars.granularity" />
                        </th>
                        <th>
                          <Text id="integration.energyMonitoring.contracts.calendars.coverage" />
                        </th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {calendars.map(calendar => (
                        <tr key={calendar.key}>
                          <td>
                            <code>{calendar.key}</code>
                          </td>
                          <td>
                            {calendar.provider_service ? (
                              calendar.provider_service.name
                            ) : (
                              <span class="badge badge-warning">
                                <Text id="integration.energyMonitoring.contracts.calendars.orphaned" />
                              </span>
                            )}
                          </td>
                          <td>{calendar.granularity}</td>
                          <td>
                            {this.formatDate(calendar.first_at)} → {this.formatDate(calendar.last_at)}
                          </td>
                          <td class="text-right">
                            <button class="btn btn-sm btn-outline-secondary" onClick={() => this.toggle(calendar.key)}>
                              <Text id="integration.energyMonitoring.contracts.calendars.lastValues" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {expanded && (
                <div class="mb-3">
                  <h4>
                    <code>{expanded}</code>
                  </h4>
                  {entries.length === 0 ? (
                    <div class="text-muted">
                      <Text id="integration.energyMonitoring.contracts.calendars.noValue" />
                    </div>
                  ) : (
                    <ul class="list-unstyled mb-0" style={{ maxHeight: '12rem', overflowY: 'auto' }}>
                      {entries.map(entry => (
                        <li key={entry.starts_at}>
                          <small>
                            {this.formatDate(entry.starts_at)} → <strong>{String(entry.value)}</strong>
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div class="form-inline">
                <label class="mr-2">
                  <Text id="integration.energyMonitoring.contracts.calendars.recalculateFrom" />
                </label>
                <input
                  type="date"
                  class="form-control mr-2"
                  value={recalculateFrom}
                  onInput={e => this.setState({ recalculateFrom: e.target.value })}
                />
                <button
                  class="btn btn-outline-primary"
                  disabled={!recalculateFrom || recalculating}
                  onClick={this.recalculate}
                >
                  <i class="fe fe-refresh-cw" />{' '}
                  <Text id="integration.energyMonitoring.contracts.calendars.recalculate" />
                </button>
              </div>
              {recalculated && (
                <div class="alert alert-success mt-2 mb-0">
                  <Text id="integration.energyMonitoring.contracts.calendars.recalculated" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CalendarsSection;
