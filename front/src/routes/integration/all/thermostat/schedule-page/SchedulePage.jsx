import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';
import ThermostatPage from '../ThermostatPage';
import ScheduleEditor from './ScheduleEditor';
import style from './style.css';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { RequestStatus } from '../../../../../utils/consts';
import CardFilter from '../../../../../components/layout/CardFilter';
import PRESET_COLORS from '../../../../../utils/thermostatPresetColors';
import { timeToMinutes, DAY_MINUTES } from '../../../../../../../server/utils/thermostatSchedule';
import { transitionsToRanges } from '../../../../../../../server/utils/thermostatRanges';

// 0 is Monday here, as it is in the table and in the editor — not the JS Date
// convention.
const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6];

// The ranges of one day, as coloured spans of the 24 hours. The same points the
// editor draws, read the same way — through the shared ranges helper — so the
// miniature and the editor can never disagree about what a schedule says.
const daySegments = (ranges, day) => {
  const ofDay = ranges
    .filter(range => range.day_of_week === day)
    .map(range => {
      const start = timeToMinutes(range.start_time);
      const rawEnd = timeToMinutes(range.end_time);
      return { start, end: rawEnd <= start ? DAY_MINUTES : rawEnd, preset: range.preset };
    })
    .sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;
  ofDay.forEach(range => {
    if (range.start > cursor) {
      segments.push({ start: cursor, end: range.start, preset: null });
    }
    segments.push(range);
    cursor = Math.max(cursor, range.end);
  });
  if (cursor < DAY_MINUTES) {
    segments.push({ start: cursor, end: DAY_MINUTES, preset: null });
  }
  return segments;
};

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
    if (this.props.getThermostats) {
      this.props.getThermostats();
    }
  }

  // The thermostats of a house that do not follow this schedule yet. A thermostat
  // is placed in a house by its room, and the server refuses a schedule from
  // another house, so one with no room appears nowhere — it has no house to be in.
  attachableThermostats = schedule => {
    const house = (this.props.houses || []).find(candidate => candidate.selector === schedule.house);
    if (!house) {
      return [];
    }
    const roomIds = (house.rooms || []).map(room => room.id);
    const followers = (schedule.devices || []).map(device => device.selector);
    return (this.props.thermostatDevices || []).filter(
      device => roomIds.includes(device.room_id) && !followers.includes(device.selector)
    );
  };

  attach = (scheduleSelector, e) => {
    const deviceSelector = e.target.value;
    // The select goes back to its placeholder: it is an action, not a value the
    // card holds — what it did shows up in the badges next to it.
    e.target.value = '';
    if (deviceSelector) {
      this.props.attachThermostat(scheduleSelector, deviceSelector);
    }
  };

  // A schedule belongs to a house: that is what makes its name unique per house
  // and keeps a thermostat from following another house's programme. Which house
  // is picked in the editor, like the name — one button per house turned the
  // page header into a row of them on an installation with four.
  startCreate = () => {
    const firstHouse = (this.props.houses || [])[0];
    this.setState({
      showEditor: true,
      editingSchedule: null,
      editingHouse: firstHouse ? firstHouse.selector : null
    });
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
  // `title` on the detach button and the select's placeholder are plain strings,
  // not <Text> nodes, so they are read from the dictionary here.
  renderSchedule = (schedule, confirmDeleteSelector, deleting, attachFailed) => {
    const dict = (this.props.intl && this.props.intl.dictionary) || {};
    const attachLabel = get(dict, 'integration.thermostat.schedule.attachPlaceholder', { default: 'Add a thermostat' });
    const detachLabel = get(dict, 'integration.thermostat.schedule.detachButton', { default: 'Stop following' });
    // Once per card, not once per day: the points are the same for all seven rows.
    const ranges = transitionsToRanges(schedule.transitions || []);
    return (
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
        {/* The week at a glance, so the list says what each schedule *does*
            rather than only what it is called — the editor has to be opened
            otherwise, and two schedules named "Semaine" look alike. Same points,
            same shared helper and same colours as the editor's own bars. */}
        <div class="card-body py-2">
          <div class={style.weekPreview}>
            {WEEK_DAYS.map(day => (
              <div key={day} class={style.weekPreviewRow}>
                <span class={style.weekPreviewDay}>
                  <Text id={`integration.thermostat.schedule.daysShort.${day}`} />
                </span>
                <div class={style.weekPreviewBar}>
                  {daySegments(ranges, day).map(segment => (
                    <div
                      key={`${segment.start}-${segment.end}`}
                      class={style.weekPreviewSegment}
                      style={`--seg-width:${((segment.end - segment.start) / DAY_MINUTES) * 100}%;--seg-color:${
                        segment.preset ? PRESET_COLORS[segment.preset] || PRESET_COLORS.comfort : 'transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="card-body py-2">
          <span class="text-muted mr-2">
            <Text id="integration.thermostat.schedule.followedBy" />
          </span>
          {(schedule.devices || []).length === 0 && (
            <span class="text-muted mr-2">
              <Text id="integration.thermostat.schedule.followedByNobody" />
            </span>
          )}
          {(schedule.devices || []).map(device => (
            <span key={device.selector} class={`badge badge-secondary mr-1 ${style.followerBadge}`}>
              {device.name}
              {/* Detaching from here too: a thermostat attached by mistake would
                otherwise have to be detached from its own edit page. */}
              <button
                type="button"
                class={style.followerDetach}
                onClick={() => this.props.detachThermostat(schedule.selector, device.selector)}
                title={detachLabel}
              >
                <i class="fe fe-x" />
              </button>
            </span>
          ))}
          {/* Attaching from here is what removes the round trip: the schedule was
            otherwise created here and attached from each thermostat's edit page.
            Only shown when something is left to attach. */}
          {this.attachableThermostats(schedule).length > 0 && (
            <select
              class={`form-control form-control-sm ${style.attachSelect}`}
              onChange={e => this.attach(schedule.selector, e)}
            >
              <option value="">{attachLabel}</option>
              {this.attachableThermostats(schedule).map(device => (
                <option key={device.selector} value={device.selector}>
                  {device.name}
                </option>
              ))}
            </select>
          )}
          {/* Said next to the select, because it is not obvious: the link's key is
              the thermostat, so one thermostat follows one schedule and attaching
              it here silently takes it off whatever it followed. */}
          {this.attachableThermostats(schedule).length > 0 && (
            <small class="form-text text-muted">
              <Text id="integration.thermostat.schedule.attachReplacesHelp" />
            </small>
          )}
          {attachFailed === schedule.selector && (
            <div class="text-danger mt-1">
              <Text id="integration.thermostat.schedule.attachError" />
            </div>
          )}
        </div>
      </div>
    );
  };

  render(props, { showEditor, editingSchedule, editingHouse, confirmDeleteSelector }) {
    const {
      thermostatSchedules,
      getSchedulesStatus,
      deleteScheduleStatus,
      houses,
      thermostatScheduleSearch,
      getThermostatScheduleOrderDir
    } = props;

    // Searching and sorting happen on the list already loaded: a schedule is a
    // name and a handful of points, so there is nothing to fetch again.
    const search = (thermostatScheduleSearch || '').trim().toLowerCase();
    const orderDir = getThermostatScheduleOrderDir || 'asc';
    const visibleSchedules = (thermostatSchedules || [])
      .filter(schedule => !search || (schedule.name || '').toLowerCase().includes(search))
      .sort((a, b) => (orderDir === 'desc' ? -1 : 1) * (a.name || '').localeCompare(b.name || ''));

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
            houses={houses}
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
                <Localizer>
                  <CardFilter
                    changeOrderDir={props.changeOrderDir}
                    orderValue={orderDir}
                    search={props.search}
                    searchValue={thermostatScheduleSearch}
                    searchPlaceHolder={<Text id="integration.thermostat.schedule.searchPlaceHolder" />}
                  />
                </Localizer>
                <button type="button" class="btn btn-outline-primary ml-2" onClick={() => this.startCreate()}>
                  <Text id="integration.thermostat.schedule.newButton" /> <i class="fe fe-plus" />
                </button>
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

              {!loading && visibleSchedules.length === 0 && (
                <div class="text-center text-muted py-4">
                  <i class={`fe fe-calendar ${style.emptyIcon}`} />
                  <p>
                    {search ? (
                      <Text id="integration.thermostat.schedule.noSearchResult" />
                    ) : (
                      <Text id="integration.thermostat.schedule.noSchedules" />
                    )}
                  </p>
                </div>
              )}

              {!loading &&
                (houses || []).map(house => {
                  const houseSchedules = visibleSchedules.filter(schedule => schedule.house === house.selector);
                  if (houseSchedules.length === 0) {
                    return null;
                  }
                  return (
                    <div key={house.selector}>
                      {(houses || []).length > 1 && <h3 class={style.houseTitle}>{house.name}</h3>}
                      {houseSchedules.map(schedule =>
                        this.renderSchedule(schedule, confirmDeleteSelector, deleting, props.attachError)
                      )}
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
