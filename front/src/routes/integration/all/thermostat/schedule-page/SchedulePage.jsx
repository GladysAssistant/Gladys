import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';
import ThermostatPage from '../ThermostatPage';
import ScheduleEditor from './ScheduleEditor';
import style from './style.css';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { RequestStatus } from '../../../../../utils/consts';

class SchedulePageComponent extends Component {
  state = {
    showEditor: false,
    editingSchedule: null,
    editingHouse: null,
    confirmDeleteSelector: null
  };

  componentDidMount() {
    this.props.getSchedules();
    if (this.props.getHouses) {
      this.props.getHouses();
    }
  }

  // A schedule belongs to a house: that is what makes its name unique per house
  // and keeps a thermostat from following another house's programme.
  startCreate = house => {
    this.setState({ showEditor: true, editingSchedule: null, editingHouse: house });
  };

  startEdit = schedule => {
    this.setState({ showEditor: true, editingSchedule: schedule, editingHouse: schedule.house });
  };

  startDuplicate = schedule => {
    // The suffix is translated: a hardcoded French one would show up for every
    // English and German user too.
    const copySuffix = get(this.props.intl.dictionary, 'integration.thermostat.schedule.duplicateSuffix', {
      default: '(copy)'
    });
    const duplicate = {
      ...schedule,
      // A duplicate is a creation, not an edit of the source schedule: dropping
      // the id as well as the selector keeps the editor from PATCHing the original.
      id: undefined,
      selector: null,
      name: `${schedule.name} ${copySuffix}`,
      transitions: schedule.transitions ? schedule.transitions.map(({ id, schedule_id, ...rest }) => ({ ...rest })) : []
    };
    this.setState({ showEditor: true, editingSchedule: duplicate, editingHouse: schedule.house });
  };

  cancelEditor = () => {
    this.setState({ showEditor: false, editingSchedule: null, editingHouse: null });
  };

  handleSaved = () => {
    this.setState({ showEditor: false, editingSchedule: null, editingHouse: null });
    this.props.getSchedules();
  };

  askDelete = selector => {
    this.setState({ confirmDeleteSelector: selector });
  };

  cancelDelete = () => {
    this.setState({ confirmDeleteSelector: null });
  };

  handleDelete = async selector => {
    const deleted = await this.props.deleteSchedule(selector);
    // Keep the confirmation open on failure: closing it silently would leave the
    // schedule in the list with no explanation.
    if (deleted) {
      this.setState({ confirmDeleteSelector: null });
    }
  };

  // One schedule card: its actions, and the thermostats that follow it — the
  // reverse query the link table makes possible.
  renderSchedule = (schedule, confirmDeleteSelector, deleting) => (
    <div key={schedule.selector} class="card mb-3">
      <div class="card-header">
        <h4 class="card-title">{schedule.name}</h4>
        <div class="card-options">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary mr-2"
            onClick={() => this.startDuplicate(schedule)}
          >
            <i class="fe fe-copy mr-1" />
            <Text id="integration.thermostat.schedule.duplicateButton" />
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary mr-2" onClick={() => this.startEdit(schedule)}>
            <i class="fe fe-edit-2 mr-1" />
            <Text id="integration.thermostat.schedule.editButton" />
          </button>
          {confirmDeleteSelector === schedule.selector ? (
            <span class="d-inline-flex align-items-center">
              <Text id="integration.thermostat.schedule.confirmDelete" />
              <button
                type="button"
                class={cx('btn', 'btn-sm', 'btn-danger', 'ml-2', { 'btn-loading': deleting })}
                onClick={() => this.handleDelete(schedule.selector)}
              >
                <Text id="integration.thermostat.schedule.confirmYes" />
              </button>
              <button type="button" class="btn btn-sm btn-secondary ml-1" onClick={this.cancelDelete}>
                <Text id="integration.thermostat.schedule.confirmNo" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              onClick={() => this.askDelete(schedule.selector)}
            >
              <i class="fe fe-trash-2 mr-1" />
              <Text id="integration.thermostat.schedule.deleteButton" />
            </button>
          )}
        </div>
      </div>
      {schedule.devices && schedule.devices.length > 0 && (
        <div class="card-body py-2">
          <span class="text-muted mr-2">
            <Text id="integration.thermostat.schedule.followedBy" />
          </span>
          {schedule.devices.map(device => (
            <span key={device.selector} class="badge badge-secondary mr-1">
              {device.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  render(props, { showEditor, editingSchedule, editingHouse, confirmDeleteSelector }) {
    const { thermostatSchedules, getSchedulesStatus, deleteScheduleStatus, houses } = props;

    // The actions store RequestStatus values ('Getting', 'Error'), so comparing
    // against lowercase literals never matched.
    const loading = getSchedulesStatus === RequestStatus.Getting;
    const deleting = deleteScheduleStatus === RequestStatus.Getting;
    const deleteFailed = deleteScheduleStatus === RequestStatus.Error;

    return (
      <ThermostatPage user={props.user}>
        {showEditor ? (
          <ScheduleEditor
            schedule={editingSchedule}
            house={editingHouse}
            httpClient={props.httpClient}
            onSaved={this.handleSaved}
            onCancel={this.cancelEditor}
            intl={props.intl}
          />
        ) : (
          <div class="card">
            <div class="card-header">
              <h1 class="card-title">
                <Text id="integration.thermostat.schedule.title" />
              </h1>
              <div class="page-options d-flex">
                {(houses || []).map(house => (
                  <button
                    key={house.selector}
                    type="button"
                    class="btn btn-outline-primary ml-2"
                    onClick={() => this.startCreate(house.selector)}
                  >
                    <Text id="integration.thermostat.schedule.newButton" />
                    {(houses || []).length > 1 && <span class="ml-1">{house.name}</span>} <i class="fe fe-plus" />
                  </button>
                ))}
              </div>
            </div>
            <div class="card-body">
              {deleteFailed && (
                <div class="alert alert-danger">
                  <Text id="integration.thermostat.schedule.deleteError" />
                </div>
              )}

              {loading && (
                <div class="text-center py-4">
                  <div class="spinner-border text-primary" role="status" />
                </div>
              )}

              {!loading && (!thermostatSchedules || thermostatSchedules.length === 0) && (
                <div class="text-center text-muted py-4">
                  <i class={`fe fe-calendar ${style.emptyIcon}`} />
                  <p>
                    <Text id="integration.thermostat.schedule.noSchedules" />
                  </p>
                </div>
              )}

              {!loading &&
                (houses || []).map(house => {
                  const houseSchedules = (thermostatSchedules || []).filter(
                    schedule => schedule.house === house.selector
                  );
                  if (houseSchedules.length === 0) {
                    return null;
                  }
                  return (
                    <div key={house.selector}>
                      {(houses || []).length > 1 && <h3 class={style.houseTitle}>{house.name}</h3>}
                      {houseSchedules.map(schedule => this.renderSchedule(schedule, confirmDeleteSelector, deleting))}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </ThermostatPage>
    );
  }
}

export default withIntlAsProp(SchedulePageComponent);
