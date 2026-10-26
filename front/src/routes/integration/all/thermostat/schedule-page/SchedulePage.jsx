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
import { timeToMinutes, carriedPresetByDay, DAY_MINUTES } from '../../../../../../../server/utils/thermostatSchedule';
import { transitionsToRanges } from '../../../../../../../server/utils/thermostatRanges';

// 0 is Monday here, as it is in the table and in the editor — not the JS Date
// convention.
const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6];

// The same three marks the editor puts under its own bars, so the two read
// alike. Without them the miniature is seven coloured stripes with no way to
// tell where the morning ends.
const HOUR_MARKS = [6, 12, 18];

// The ranges of one day, as coloured spans of the 24 hours. The same points the
// editor draws, read the same way — through the shared ranges helper — so the
// miniature and the editor can never disagree about what a schedule says.
const daySegments = (ranges, day, carriedInto) => {
  const ofDay = ranges
    .filter(range => range.day_of_week === day)
    .map(range => {
      const start = timeToMinutes(range.start_time);
      const rawEnd = timeToMinutes(range.end_time);
      return { start, end: rawEnd <= start ? DAY_MINUTES : rawEnd, preset: range.preset };
    })
    .sort((a, b) => a.start - b.start);

  // A day is not only its own points: it starts on whatever the last point
  // before it set, and that point may be several days back. A night crossing
  // midnight runs into the next morning, and a schedule whose only point is
  // Saturday 08:00 holds that preset all week — the server regulates on exactly
  // that (`findCurrentTransition` wraps onto the last point of the week), so a
  // blank Monday to Friday said the opposite of what the heating does. Computed
  // by the shared helper, which the editor reads too: the miniature and the
  // editor can never disagree about what a schedule says.
  const segments = [];
  let cursor = 0;
  if (carriedInto && carriedInto.until > 0) {
    segments.push({ start: 0, end: carriedInto.until, preset: carriedInto.preset });
    cursor = carriedInto.until;
  }
  ofDay.forEach(range => {
    if (range.start > cursor) {
      segments.push({ start: cursor, end: range.start, preset: null });
    }
    // Clipped to what is left of the day: the carried night may already cover
    // this range's start, and segments whose widths overran 100% would push the
    // rest of the bar off its track.
    const start = Math.max(range.start, cursor);
    if (range.end > start) {
      segments.push({ ...range, start });
      cursor = range.end;
    }
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
    const carriedByDay = carriedPresetByDay(schedule.transitions || []);
    // In the order the bars are read, not the order the points were entered.
    const PRESET_ORDER = ['off', 'frost', 'away', 'eco', 'night', 'comfort'];
    const usedPresets = PRESET_ORDER.filter(preset =>
      (schedule.transitions || []).some(transition => transition.preset === preset)
    );
    return (
      <div key={schedule.selector} class="col-md-6">
        <div class="card mb-3">
          {/* The name straight in the header, with no card-title heading: that
              is how a thermostat card renders its own, and a heading here made
              the schedule names read heavier than the thermostat ones. */}
          <div class="card-header">{schedule.name}</div>
          {/* The week at a glance, so the list says what each schedule *does*
            rather than only what it is called — the editor has to be opened
            otherwise, and two schedules named "Semaine" look alike. Same points,
            same shared helper and same colours as the editor's own bars. */}
          <div class="card-body">
            {/* A schedule with no point resolves nothing, and the loop then falls
                back on the preset each thermostat already carries (C.2) — so a
                thermostat can follow this schedule and go on regulating as if it
                had none. The seven empty bars do not say that on their own. */}
            {(schedule.transitions || []).length === 0 && (
              <div class="alert alert-info">
                <Text id="integration.thermostat.schedule.emptyScheduleWarning" />
              </div>
            )}
            {/* Labelled like the follower row below it, and like the fields of a
                thermostat card: the bars started flush against the header, which
                is what made this card look tighter than one of those. */}
            <div class={style.sectionLabel}>
              <Text id="integration.thermostat.schedule.weekLabel" />
            </div>
            <div class={style.weekPreview}>
              {WEEK_DAYS.map(day => (
                <div key={day} class={style.weekPreviewRow}>
                  <span class={style.weekPreviewDay}>
                    <Text id={`integration.thermostat.schedule.daysShort.${day}`} />
                  </span>
                  <div class={style.weekPreviewBar}>
                    {daySegments(ranges, day, carriedByDay[day]).map(segment => (
                      <div
                        key={`${segment.start}-${segment.end}`}
                        class={style.weekPreviewSegment}
                        style={`--seg-width:${((segment.end - segment.start) / DAY_MINUTES) * 100}%;--seg-color:${
                          segment.preset ? PRESET_COLORS[segment.preset] || PRESET_COLORS.comfort : PRESET_COLORS.off
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {/* The scale, once under the seven days: the bars are gridlined at the
                same three hours, so a slot can be placed by eye. */}
              <div class={style.weekPreviewScale}>
                {HOUR_MARKS.map(hour => (
                  <span key={hour} class={style.weekPreviewMark} style={`--mark-left:${(hour / 24) * 100}%`}>
                    {`${hour}h`}
                  </span>
                ))}
              </div>
              {/* What the colours mean. Seven coloured stripes say nothing on
                  their own: the editor had to be opened to learn that blue is the
                  night and orange the comfort. Only the presets this schedule
                  actually uses are listed — a fixed legend of six would mostly
                  name colours that are not on the bars. */}
              {usedPresets.length > 0 && (
                <div class={style.weekPreviewLegend}>
                  {usedPresets.map(preset => (
                    <span key={preset} class={style.weekPreviewLegendItem}>
                      <span
                        class={style.weekPreviewLegendSwatch}
                        style={`--swatch-color:${PRESET_COLORS[preset] || PRESET_COLORS.comfort}`}
                      />
                      {get(dict, `dashboard.boxes.thermostat.preset.${preset}`, { default: preset })}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Label above its value, like the summary rows of a thermostat
                card: the same information on the two lists, shaped the same. */}
            <div class="mt-3">
              <div class={style.sectionLabel}>
                <Text id="integration.thermostat.schedule.followedBy" />
              </div>
              {(schedule.devices || []).length === 0 && (
                <span class="text-muted">
                  <Text id="integration.thermostat.schedule.followedByNobody" />
                </span>
              )}
              {(schedule.devices || []).map(device => (
                <span key={device.selector} class={`badge mr-1 ${style.followerBadge}`}>
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
            </div>

            {/* Attaching from here is what removes the round trip: the schedule
                was otherwise created here and attached from each thermostat's
                edit page. On its own line and full width, like the form controls
                on a thermostat card — inline among the badges it read as one more
                chip rather than as the way to add one. */}
            {this.attachableThermostats(schedule).length > 0 && (
              <div class="mt-3">
                <select class="form-control" onChange={e => this.attach(schedule.selector, e)}>
                  <option value="">{attachLabel}</option>
                  {this.attachableThermostats(schedule).map(device => (
                    <option key={device.selector} value={device.selector}>
                      {device.name}
                    </option>
                  ))}
                </select>
                {/* Not obvious, so it is said: the link's key is the thermostat,
                    so one follows one schedule and attaching it here silently
                    takes it off whatever it followed. */}
                <small class="form-text text-muted">
                  <Text id="integration.thermostat.schedule.attachReplacesHelp" />
                </small>
              </div>
            )}
            {attachFailed === schedule.selector && (
              <div class="text-danger mt-1">
                <Text id="integration.thermostat.schedule.attachError" />
              </div>
            )}

            {/* At the foot and full width, like the thermostat cards: three
                buttons beside the name in a half-width card crowd it out. They
                stay inside this one card-body — stacked bodies draw a divider
                between each, which is the line that ran above this row. */}
            {confirmDeleteSelector === schedule.selector ? (
              /* The confirmation takes over the whole row, as it does on the
                 thermostat cards: leaving the other two beside it would put four
                 buttons in a half-width card and cut their labels. */
              <div class={`${style.confirmDeleteRow} mt-3`}>
                <span class={style.confirmDeleteText}>
                  <Text id="integration.thermostat.schedule.confirmDelete" />
                </span>
                <div class={style.cardButtons}>
                  <button
                    type="button"
                    class={cx('btn', 'btn-danger', 'flex-fill', { 'btn-loading': deleting })}
                    onClick={() => this.handleDelete(schedule.selector)}
                  >
                    <Text id="integration.thermostat.schedule.confirmYes" />
                  </button>
                  <button type="button" class="btn btn-secondary flex-fill" onClick={this.cancelDelete}>
                    <Text id="integration.thermostat.schedule.confirmNo" />
                  </button>
                </div>
              </div>
            ) : (
              /* Delete in the middle, as on the thermostat cards: the same action
                 in the same place on two lists one tab apart. */
              <div class={`${style.cardButtons} mt-3`}>
                {/* Outlined, so Edit is the one filled button of the row:
                    duplicating had the same weight as editing, and green is the
                    colour of a confirmation elsewhere in Gladys. Outline-primary
                    rather than outline-secondary, which the dark theme does not
                    counter-invert and which all but disappears there. */}
                <button
                  type="button"
                  class="btn btn-outline-primary flex-fill"
                  onClick={() => this.startDuplicate(schedule)}
                >
                  <i class="fe fe-copy mr-1" />
                  <Text id="integration.thermostat.schedule.duplicateButton" />
                </button>
                <button
                  type="button"
                  class="btn btn-danger flex-fill"
                  onClick={() => this.askDelete(schedule.selector)}
                >
                  <i class="fe fe-trash-2 mr-1" />
                  <Text id="integration.thermostat.schedule.deleteButton" />
                </button>
                <button type="button" class="btn btn-primary flex-fill" onClick={() => this.startEdit(schedule)}>
                  <i class="fe fe-edit-2 mr-1" />
                  <Text id="integration.thermostat.schedule.editButton" />
                </button>
              </div>
            )}
          </div>
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
            thermostatDevices={props.thermostatDevices}
            httpClient={props.httpClient}
            onSaved={this.handleSaved}
            onCancel={this.cancelEditor}
            intl={props.intl}
          />
        ) : (
          <div class={cx('card', style.schedulePage)}>
            <div class="card-header">
              <h1 class="card-title">
                <Text id="integration.thermostat.schedule.title" />
              </h1>
              <div class="page-options d-flex flex-wrap justify-content-end">
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
                      {/* Same two-column grid as the thermostat list: a schedule
                          card is about as wide as a thermostat one, and one per
                          row left half the page empty. */}
                      <div class="row">
                        {houseSchedules.map(schedule =>
                          this.renderSchedule(schedule, confirmDeleteSelector, deleting, props.attachError)
                        )}
                      </div>
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
