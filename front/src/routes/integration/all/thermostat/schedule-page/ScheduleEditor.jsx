import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import PRESET_COLORS from '../../../../../utils/thermostatPresetColors';
import { timeToMinutes, minutesToTime, DAY_MINUTES } from '../../../../../../../server/utils/thermostatSchedule';
// The schedule is stored as transition points — one row for a night, with no gap
// and no overlap representable. It is edited as ranges, because that is how a
// heating programme is thought about. The conversion lives here, at the two
// boundaries: points become ranges on load, ranges become points on save.
import { transitionsToRanges, rangesToTransitions } from '../../../../../../../server/utils/thermostatRanges';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const PRESETS = ['off', 'frost', 'away', 'eco', 'night', 'comfort'];
const FIXED_MARKERS = [6 * 60, 12 * 60, 18 * 60];

function formatLabel(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function ensureKeys(ranges) {
  return ranges.map((r, i) => (r.key ? r : { ...r, key: Date.now() + i + Math.random() }));
}

// The ranges an editor holds, from the points a schedule stores.
function rangesFromSchedule(schedule) {
  return ensureKeys(transitionsToRanges(schedule ? schedule.transitions || [] : []));
}

const byStart = (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time);

/**
 * A schedule is *stored* as transition points — one row for a night, with no gap
 * and no overlap representable. It is *edited* as ranges, with a start and an
 * end, because that is how a heating programme is thought about: "comfort from 6
 * to 9", not "a comfort point at 6 and a stop at 9".
 *
 * The two meet in thermostatRanges.js, at the two boundaries only: the points
 * become ranges when the editor opens, and the ranges become points when it
 * saves. Nothing in between knows about points, and nothing in the database
 * knows about ranges.
 */
class ScheduleEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.schedule ? props.schedule.name : '',
      house: props.house || null,
      ranges: rangesFromSchedule(props.schedule),
      saving: false,
      error: null,
      selectedDay: null,
      lastScheduleSelector: props.schedule ? props.schedule.selector : null,
      copySourceDay: null,
      copyTargetDays: [],
      newForms: {}, // { [day]: { start_time, end_time, preset } }
      editForms: {} // { [key]: { start_time, end_time, preset } }
    };
  }

  static getDerivedStateFromProps(props, state) {
    const incomingSelector = props.schedule ? props.schedule.selector : null;
    if (incomingSelector !== state.lastScheduleSelector) {
      return {
        name: props.schedule ? props.schedule.name : '',
        house: props.house || null,
        ranges: rangesFromSchedule(props.schedule),
        error: null,
        selectedDay: null,
        lastScheduleSelector: incomingSelector,
        newForms: {},
        editForms: {}
      };
    }
    return null;
  }

  updateName = e => this.setState({ name: e.target.value });

  selectDay = day => {
    this.setState(prev => ({ selectedDay: prev.selectedDay === day ? null : day }));
  };

  dayRanges = (ranges, day) => ranges.filter(r => r.day_of_week === day).sort(byStart);

  // Two ranges covering the same minute have no meaning: only one preset can be
  // in force at a time, and the points they convert to would silently drop the
  // overlap rather than honour it. They are refused at entry instead.
  //
  // A range whose end is at or before its start runs past midnight, so it
  // occupies the end of its day and the start of the next: both stretches are
  // checked, which is what catches a night overlapping the following morning.
  overlaps = (ranges, candidate, ignoredKey = null) => {
    const spansOf = range => {
      const start = timeToMinutes(range.start_time);
      const end = timeToMinutes(range.end_time);
      if (end > start) {
        return [{ day: range.day_of_week, start, end }];
      }
      // Past midnight: the tail of this day, then the head of the next.
      const spans = [{ day: range.day_of_week, start, end: DAY_MINUTES }];
      if (end > 0) {
        spans.push({ day: (range.day_of_week + 1) % 7, start: 0, end });
      }
      return spans;
    };

    const candidateSpans = spansOf(candidate);
    return ranges.some(range => {
      if (range.key === ignoredKey) {
        return false;
      }
      return spansOf(range).some(span =>
        candidateSpans.some(other => other.day === span.day && other.start < span.end && span.start < other.end)
      );
    });
  };

  // ── Adding a point ────────────────────────────────────────────────────────

  openNewForm = day => {
    const existing = this.dayRanges(this.state.ranges, day);
    // Start where the day's last range ends, so ranges chain rather than overlap.
    const last = existing[existing.length - 1];
    const startMins = last ? Math.min(timeToMinutes(last.end_time), DAY_MINUTES - 60) : 6 * 60;
    const endMins = Math.min(startMins + 3 * 60, DAY_MINUTES);
    this.setState(prev => ({
      newForms: {
        ...prev.newForms,
        [day]: {
          start_time: minutesToTime(startMins),
          end_time: endMins === DAY_MINUTES ? '00:00' : minutesToTime(endMins),
          preset: 'comfort'
        }
      }
    }));
  };

  closeNewForm = day => {
    this.setState(prev => {
      const forms = { ...prev.newForms };
      delete forms[day];
      return { newForms: forms };
    });
  };

  updateNewForm = (day, field, value) => {
    this.setState(prev => ({
      newForms: { ...prev.newForms, [day]: { ...prev.newForms[day], [field]: value } }
    }));
  };

  confirmNewForm = day => {
    const form = this.state.newForms[day];
    if (!form || !form.start_time || !form.end_time) return;
    const candidate = { day_of_week: day, start_time: form.start_time, end_time: form.end_time };
    if (this.overlaps(this.state.ranges, candidate)) {
      this.setState({ error: 'overlap' });
      return;
    }
    // Two ranges starting at the same moment would give one point: replace
    // rather than add, so the second entry is the one that stands.
    const withoutSameStart = this.state.ranges.filter(
      r => !(r.day_of_week === day && r.start_time === form.start_time)
    );
    this.setState(prev => ({
      error: null,
      ranges: [
        ...withoutSameStart,
        {
          key: Date.now() + Math.random(),
          day_of_week: day,
          start_time: form.start_time,
          end_time: form.end_time,
          preset: form.preset
        }
      ],
      newForms: (() => {
        const forms = { ...prev.newForms };
        delete forms[day];
        return forms;
      })()
    }));
  };

  // ── Editing a point ───────────────────────────────────────────────────────

  openEditForm = range => {
    this.setState(prev => ({
      editForms: {
        ...prev.editForms,
        [range.key]: { start_time: range.start_time, end_time: range.end_time, preset: range.preset }
      }
    }));
  };

  closeEditForm = key => {
    this.setState(prev => {
      const forms = { ...prev.editForms };
      delete forms[key];
      return { editForms: forms };
    });
  };

  updateEditForm = (key, field, value) => {
    this.setState(prev => ({
      editForms: { ...prev.editForms, [key]: { ...prev.editForms[key], [field]: value } }
    }));
  };

  confirmEdit = key => {
    const form = this.state.editForms[key];
    if (!form || !form.start_time || !form.end_time) return;
    const edited = this.state.ranges.find(r => r.key === key);
    const candidate = { day_of_week: edited.day_of_week, start_time: form.start_time, end_time: form.end_time };
    // The range being edited does not overlap itself.
    if (this.overlaps(this.state.ranges, candidate, key)) {
      this.setState({ error: 'overlap' });
      return;
    }
    this.setState(prev => {
      const edited = prev.ranges.find(r => r.key === key);
      const ranges = prev.ranges
        // A move onto another range's start replaces it: two ranges starting at
        // the same moment would collapse into one point anyway.
        .filter(r => r.key === key || !(r.day_of_week === edited.day_of_week && r.start_time === form.start_time))
        .map(r =>
          r.key === key ? { ...r, start_time: form.start_time, end_time: form.end_time, preset: form.preset } : r
        );
      const forms = { ...prev.editForms };
      delete forms[key];
      return { ranges, editForms: forms, error: null };
    });
  };

  // Deleting a range leaves nothing running in its place: the points it opened
  // and closed both go, and the thermostat keeps whatever the range before it
  // set — exactly what the stored programme then says.
  removeRange = key => {
    this.setState(prev => {
      const forms = { ...prev.editForms };
      delete forms[key];
      return { ranges: prev.ranges.filter(r => r.key !== key), editForms: forms };
    });
  };

  // ── Copying a day ─────────────────────────────────────────────────────────

  openCopyPicker = day => this.setState({ copySourceDay: day, copyTargetDays: [] });
  closeCopyPicker = () => this.setState({ copySourceDay: null, copyTargetDays: [] });

  toggleCopyTarget = day => {
    this.setState(prev => ({
      copyTargetDays: prev.copyTargetDays.includes(day)
        ? prev.copyTargetDays.filter(d => d !== day)
        : [...prev.copyTargetDays, day]
    }));
  };

  // Copying a day is copying its ranges — no algebra, no overflow to propagate.
  applyCopy = () => {
    const { copySourceDay, copyTargetDays, ranges } = this.state;
    if (copySourceDay === null || copyTargetDays.length === 0) return;
    const source = this.dayRanges(ranges, copySourceDay);
    const kept = ranges.filter(r => !copyTargetDays.includes(r.day_of_week));
    const copies = copyTargetDays.flatMap(day =>
      source.map(r => ({
        key: Date.now() + Math.random(),
        day_of_week: day,
        start_time: r.start_time,
        end_time: r.end_time,
        preset: r.preset
      }))
    );
    this.setState({ ranges: [...kept, ...copies], copySourceDay: null, copyTargetDays: [] });
  };

  save = async () => {
    const { name, ranges } = this.state;
    if (!name.trim()) return;

    this.setState({ saving: true, error: null });
    const scheduleData = {
      name: name.trim(),
      // The ranges become points here, and only here: a range that is followed
      // immediately by another needs no stop between them, one followed by a gap
      // gets one, and a night crossing midnight stays a single row.
      transitions: rangesToTransitions(ranges.map(({ key, id, schedule_id, ...rest }) => rest))
    };
    try {
      const { schedule, httpClient, onSaved, house } = this.props;
      // A duplicate arrives as a schedule object with no selector: it is a
      // creation, so gating on the object alone would PATCH /schedule/null.
      if (schedule && schedule.selector) {
        await httpClient.patch(`/api/v1/service/thermostat/schedule/${schedule.selector}`, {
          ...scheduleData,
          house
        });
      } else {
        // A schedule belongs to a house: that is what makes its name unique per
        // house and keeps a thermostat from following another house's programme.
        await httpClient.post('/api/v1/service/thermostat/schedule', { ...scheduleData, house });
      }
      if (onSaved) onSaved();
    } catch (e) {
      const msg = (e && e.response && e.response.data && e.response.data.message) || true;
      this.setState({ saving: false, error: msg });
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  // Text equivalent of the coloured bar, for a collapsed day.
  describeDay = (dayRanges, dictionary) => {
    if (dayRanges.length === 0) {
      // Not "nothing": a day with no range is a day the thermostat is stopped.
      return (dictionary && dictionary.presets && dictionary.presets.off) || '';
    }
    return dayRanges
      .map(r => `${r.start_time} - ${r.end_time} ${(dictionary.presets && dictionary.presets[r.preset]) || r.preset}`)
      .join(', ');
  };

  // The bar draws the day's ranges where they fall and leaves the rest blank: a
  // stretch with no range is one where nothing is scheduled, which is exactly
  // what the stored programme says. A range crossing midnight is drawn to the
  // edge here; its remainder belongs to the next day's bar.
  renderTimeBar = (dayRanges, carriedInto) => {
    const segments = [];
    let cursor = 0;
    // What a night started the day before leaves running into this morning.
    if (carriedInto && carriedInto.until > 0) {
      segments.push({ start: 0, end: carriedInto.until, preset: carriedInto.preset });
      cursor = carriedInto.until;
    }
    dayRanges.forEach(range => {
      const start = timeToMinutes(range.start_time);
      const rawEnd = timeToMinutes(range.end_time);
      const end = rawEnd <= start ? DAY_MINUTES : rawEnd;
      // Overlaps are refused at entry, but a schedule stored before that could
      // still hold one: draw what is left of the range rather than a segment
      // running backwards, which the flex bar would render as a stray block.
      if (end <= cursor) {
        return;
      }
      if (start > cursor) {
        segments.push({ start: cursor, end: start, preset: null });
      }
      segments.push({ start: Math.max(start, cursor), end, preset: range.preset });
      cursor = end;
    });
    if (cursor < DAY_MINUTES) {
      segments.push({ start: cursor, end: DAY_MINUTES, preset: null });
    }

    return (
      <div class={style.timeBarWrapper} aria-hidden="true">
        <div class={style.timeBar}>
          {segments.map(segment => (
            <div
              key={`${segment.start}-${segment.end}`}
              class={cx(style.timeBarSegment, { [style.timeBarSegmentEmpty]: !segment.preset })}
              style={`--seg-width:${((segment.end - segment.start) / DAY_MINUTES) * 100}%;--seg-color:${
                segment.preset ? PRESET_COLORS[segment.preset] || PRESET_COLORS.comfort : 'transparent'
              }`}
            />
          ))}
        </div>
        <div class={style.timeBarMarkers}>
          {FIXED_MARKERS.map(m => (
            <div key={m} class={style.timeMarker} style={`--marker-left:${(m / DAY_MINUTES) * 100}%`}>
              {formatLabel(m)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  renderRangeForm = (form, onChange, onConfirm, onCancel, onRemove, dictionary, isEdit) => (
    <div class={style.slotFormWrapper}>
      <div class={isEdit ? style.editSlotForm : style.newSlotForm}>
        <div class={style.slotColorDot} style={`--dot-color:${PRESET_COLORS[form.preset] || PRESET_COLORS.comfort}`} />
        <input
          type="time"
          class={cx('form-control', 'form-control-sm', style.slotTimeInput)}
          value={form.start_time}
          onChange={e => onChange('start_time', e.target.value)}
        />
        <span class={style.slotArrow}>→</span>
        <input
          type="time"
          class={cx('form-control', 'form-control-sm', style.slotTimeInput)}
          value={form.end_time}
          onChange={e => onChange('end_time', e.target.value)}
        />
        <select
          class={cx('form-control', 'form-control-sm', style.slotPresetSelect)}
          value={form.preset}
          onChange={e => onChange('preset', e.target.value)}
        >
          {PRESETS.map(preset => (
            <option key={preset} value={preset}>
              {(dictionary.presets && dictionary.presets[preset]) || preset}
            </option>
          ))}
        </select>
        <button type="button" class="btn btn-sm btn-primary" onClick={onConfirm}>
          <i class="fe fe-check" />
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onClick={onCancel}>
          <i class="fe fe-x" />
        </button>
        {onRemove && (
          <button type="button" class="btn btn-sm btn-outline-danger" onClick={onRemove}>
            <i class="fe fe-trash-2" />
          </button>
        )}
      </div>
    </div>
  );

  render(
    { onCancel, intl, houses, schedule },
    { name, house, ranges, saving, error, selectedDay, copySourceDay, copyTargetDays, newForms, editForms }
  ) {
    const dictionary =
      intl && intl.dictionary && intl.dictionary.integration && intl.dictionary.integration.thermostat
        ? intl.dictionary.integration.thermostat.schedule
        : {};
    // A schedule being created follows nobody yet; a duplicate carries the
    // source's followers in its payload, but is a creation too.
    const followers = schedule && schedule.selector ? schedule.devices || [] : [];

    // A range crossing midnight runs into the next morning, so that morning has
    // to be told about it: the week wraps, and Sunday night reaches Monday.
    const carriedByDay = {};
    DAYS.forEach(day => {
      const previousDay = (day + 6) % 7;
      const overnight = this.dayRanges(ranges, previousDay).find(
        range => timeToMinutes(range.end_time) <= timeToMinutes(range.start_time)
      );
      carriedByDay[day] = overnight
        ? { preset: overnight.preset, until: timeToMinutes(overnight.end_time), day: previousDay }
        : null;
    });

    return (
      <div class={style.scheduleEditor}>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.thermostat.schedule.nameLabel" />
          </label>
          <input type="text" class="form-control" value={name} onChange={this.updateName} />
        </div>

        {/* A schedule belongs to a house. It moves freely while nothing follows
            it; once a thermostat does, moving it would leave that thermostat
            following a programme from another house — which is what tying a
            schedule to a house prevents. With a single house, nothing to ask. */}
        {(houses || []).length > 1 && (
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.thermostat.schedule.houseLabel" />
            </label>
            <select
              class="form-control"
              value={house || ''}
              onChange={this.updateHouse}
              disabled={followers.length > 0}
            >
              {(houses || []).map(candidate => (
                <option key={candidate.selector} value={candidate.selector}>
                  {candidate.name}
                </option>
              ))}
            </select>
            {followers.length > 0 && (
              <small class="form-text text-muted">
                <Text id="integration.thermostat.schedule.houseLockedByDevices" />{' '}
                {followers.map(device => device.name).join(', ')}
              </small>
            )}
          </div>
        )}

        {error && (
          <div class="alert alert-warning">
            {error === 'overlap' ? (
              <Text id="integration.thermostat.schedule.overlapError" />
            ) : (
              <span>{typeof error === 'string' ? error : <Text id="integration.thermostat.schedule.saveError" />}</span>
            )}
          </div>
        )}

        <div class={style.dayList}>
          {DAYS.map(day => {
            const dayPoints = this.dayRanges(ranges, day);
            const isOpen = selectedDay === day;
            const newForm = newForms[day];

            return (
              <div key={day} class={cx(style.dayRow, { [style.dayRowOpen]: isOpen })}>
                <div
                  class={style.dayClickZone}
                  onClick={() => this.selectDay(day)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      this.selectDay(day);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                >
                  <div class={style.dayRowHeader}>
                    <span class={style.dayLabel}>
                      <Text id={`integration.thermostat.schedule.days.${day}`} />
                    </span>
                    <i class={`fe fe-chevron-${isOpen ? 'up' : 'down'} ${style.dayChevron}`} aria-hidden="true" />
                  </div>
                  {/* The bar is colour only, so it is summarised in words for
                      anyone who cannot see it. */}
                  <span class="sr-only">{this.describeDay(dayPoints, dictionary)}</span>
                  {this.renderTimeBar(dayPoints, carriedByDay[day])}
                  {/* A day with no point of its own is not empty: it keeps what
                      the last point before it set, which may be days earlier.
                      Saying so is what stops a whole blue week looking like a
                      bug. */}
                  {carriedByDay[day] && (
                    <div class={style.carriedFrom}>
                      <i class="fe fe-corner-down-right mr-1" />
                      {(dictionary.presets && dictionary.presets[carriedByDay[day].preset]) || carriedByDay[day].preset}
                      {' · '}
                      <Text id="integration.thermostat.schedule.carriedSince" />{' '}
                      <Text id={`integration.thermostat.schedule.daysShort.${carriedByDay[day].day}`} />
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div class={style.dayPanel}>
                    {dayPoints.length === 0 && !newForm && (
                      <p class={`text-muted mb-2 ${style.noSlotsText}`}>
                        <Text id="integration.thermostat.schedule.noSlots" />
                      </p>
                    )}

                    {/* What the hatching means, said once where the ranges are
                        edited: outside a range the thermostat is stopped, which
                        is what makes a programme say the same thing whatever
                        ran before it. */}
                    <p class={style.stoppedLegend}>
                      <span class={style.stoppedLegendSwatch} />
                      <Text id="integration.thermostat.schedule.stoppedLegend" />
                    </p>

                    {dayPoints.map((range, idx) => {
                      const editForm = editForms[range.key];
                      if (editForm) {
                        return (
                          <div key={range.key || `${day}-${idx}`}>
                            {this.renderRangeForm(
                              editForm,
                              (field, value) => this.updateEditForm(range.key, field, value),
                              () => this.confirmEdit(range.key),
                              () => this.closeEditForm(range.key),
                              () => this.removeRange(range.key),
                              dictionary,
                              true
                            )}
                          </div>
                        );
                      }
                      // An end at or before the start runs past midnight.
                      const crossesMidnight = timeToMinutes(range.end_time) <= timeToMinutes(range.start_time);
                      return (
                        <div
                          key={range.key || `${day}-${idx}`}
                          class={style.slotEditorRow}
                          onClick={() => this.openEditForm(range)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              this.openEditForm(range);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div
                            class={style.slotColorDot}
                            style={`--dot-color:${PRESET_COLORS[range.preset] || PRESET_COLORS.comfort}`}
                          />
                          <span class={style.slotTimeDisplay}>{range.start_time}</span>
                          <span class={style.slotArrow}>→</span>
                          <span class={style.slotTimeDisplay}>{range.end_time}</span>
                          {crossesMidnight && (
                            <span class={style.slotNextDay}>
                              <Text id="integration.thermostat.schedule.nextDay" />
                            </span>
                          )}
                          <span class={style.slotPresetLabel}>
                            {(dictionary.presets && dictionary.presets[range.preset]) || range.preset}
                          </span>
                          <i class={`fe fe-edit-2 ${style.slotEditIcon}`} />
                        </div>
                      );
                    })}

                    {newForm &&
                      this.renderRangeForm(
                        newForm,
                        (field, value) => this.updateNewForm(day, field, value),
                        () => this.confirmNewForm(day),
                        () => this.closeNewForm(day),
                        null,
                        dictionary,
                        false
                      )}

                    <div class={style.dayPanelActions}>
                      {!newForm && (
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          onClick={() => this.openNewForm(day)}
                        >
                          <i class="fe fe-plus mr-1" />
                          <Text id="integration.thermostat.schedule.addSlot" />
                        </button>
                      )}
                      {copySourceDay !== day && (
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary"
                          onClick={() => this.openCopyPicker(day)}
                        >
                          <i class="fe fe-copy mr-1" />
                          <Text id="integration.thermostat.schedule.copyTo" />
                        </button>
                      )}

                      {copySourceDay === day && (
                        <div class={style.copyPicker}>
                          <span class={style.copyPickerLabel}>
                            <Text id="integration.thermostat.schedule.copyToLabel" />
                          </span>
                          {DAYS.filter(d => d !== day).map(d => (
                            <label key={d} class={style.copyPickerDay}>
                              <input
                                type="checkbox"
                                checked={(copyTargetDays || []).includes(d)}
                                onChange={() => this.toggleCopyTarget(d)}
                              />{' '}
                              <Text id={`integration.thermostat.schedule.daysShort.${d}`} />
                            </label>
                          ))}
                          <button
                            type="button"
                            class="btn btn-xs btn-primary ml-2"
                            onClick={this.applyCopy}
                            disabled={!(copyTargetDays && copyTargetDays.length > 0)}
                          >
                            <Text id="integration.thermostat.schedule.applyButton" />
                          </button>
                          <button type="button" class="btn btn-xs btn-secondary ml-1" onClick={this.closeCopyPicker}>
                            <Text id="integration.thermostat.schedule.cancelButton" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div class={style.editorActions}>
          <button type="button" class="btn btn-primary" onClick={this.save} disabled={saving || !name.trim()}>
            <Text id="integration.thermostat.schedule.saveButton" />
          </button>
          <button type="button" class="btn btn-secondary ml-2" onClick={onCancel}>
            <Text id="integration.thermostat.schedule.cancelButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default ScheduleEditor;
