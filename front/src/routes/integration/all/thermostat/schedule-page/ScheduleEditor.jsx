import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import PRESET_COLORS from '../../../../../utils/thermostatPresetColors';
// The slot algebra is shared with the server rather than reimplemented here:
// the editor and the regulation loop must agree on what a slot list means.
import {
  applySlotToDay,
  mergeIntoSlots,
  timeToMinutes,
  minutesToTime,
  DAY_MINUTES
} from '../../../../../../../server/utils/thermostatSchedule';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const PRESETS = ['off', 'frost', 'away', 'eco', 'night', 'comfort'];
const FIXED_MARKERS = [6 * 60, 12 * 60, 18 * 60];

function formatLabel(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function ensureKeys(slots) {
  return slots.map((s, i) => (s.key ? s : { ...s, key: Date.now() + i + Math.random() }));
}

class ScheduleEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.schedule ? props.schedule.name : '',
      slots: ensureKeys(props.schedule ? props.schedule.slots : []),
      saving: false,
      error: null,
      selectedDay: null,
      lastScheduleSelector: props.schedule ? props.schedule.selector : null,
      copySourceDay: null,
      copyTargetDays: [],
      newSlotForms: {}, // { [day]: { start_time, end_time, preset } }
      editForms: {} // { [key]: { start_time, end_time, preset, day_of_week } }
    };
  }

  static getDerivedStateFromProps(props, state) {
    const incomingSelector = props.schedule ? props.schedule.selector : null;
    if (incomingSelector !== state.lastScheduleSelector) {
      return {
        name: props.schedule ? props.schedule.name : '',
        slots: ensureKeys(props.schedule ? props.schedule.slots : []),
        error: null,
        selectedDay: null,
        lastScheduleSelector: incomingSelector,
        newSlotForms: {},
        editForms: {}
      };
    }
    return null;
  }

  updateName = e => this.setState({ name: e.target.value });

  selectDay = day => {
    this.setState(prev => ({ selectedDay: prev.selectedDay === day ? null : day }));
  };

  // ── New slot ──────────────────────────────────────────────────────────────

  openNewSlotForm = dayOfWeek => {
    const daySlots = this.state.slots
      .filter(s => s.day_of_week === dayOfWeek)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    // Default: fill the first uncovered gap, or full day if no slots
    let startMins = 0;
    let endMins = 0; // 00:00 = full day (midnight)
    if (daySlots.length > 0) {
      startMins = timeToMinutes(daySlots[daySlots.length - 1].end_time) || DAY_MINUTES;
      startMins = Math.min(startMins, DAY_MINUTES - 60);
      endMins = Math.min(startMins + 120, DAY_MINUTES) % DAY_MINUTES;
    }

    this.setState(prev => ({
      newSlotForms: {
        ...prev.newSlotForms,
        [dayOfWeek]: {
          start_time: minutesToTime(startMins),
          end_time: minutesToTime(endMins),
          preset: 'comfort'
        }
      }
    }));
  };

  closeNewSlotForm = dayOfWeek => {
    this.setState(prev => {
      const forms = { ...prev.newSlotForms };
      delete forms[dayOfWeek];
      return { newSlotForms: forms };
    });
  };

  updateNewSlotForm = (dayOfWeek, field, value) => {
    this.setState(prev => ({
      newSlotForms: {
        ...prev.newSlotForms,
        [dayOfWeek]: { ...prev.newSlotForms[dayOfWeek], [field]: value }
      }
    }));
  };

  confirmNewSlot = dayOfWeek => {
    const form = this.state.newSlotForms[dayOfWeek];
    if (!form) return;

    const newStart = timeToMinutes(form.start_time);
    let newEnd = timeToMinutes(form.end_time);
    // If end <= start, the user wants overflow past midnight (e.g. 18h→06h)
    if (newEnd <= newStart) newEnd = newEnd + DAY_MINUTES;

    const newKey = Date.now() + Math.random();
    const existingDaySlots = this.state.slots.filter(s => s.day_of_week === dayOfWeek);

    const { fixedSlots, overflowSlot } = applySlotToDay(
      existingDaySlots,
      dayOfWeek,
      newStart,
      newEnd,
      form.preset,
      newKey,
      null
    );
    const taggedFixed = fixedSlots.map(s => ({ ...s, day_of_week: dayOfWeek }));
    const finalSlots = mergeIntoSlots(this.state.slots, dayOfWeek, taggedFixed, overflowSlot);

    this.setState(prev => {
      const forms = { ...prev.newSlotForms };
      delete forms[dayOfWeek];
      return { slots: finalSlots, newSlotForms: forms };
    });
  };

  // ── Edit existing slot ────────────────────────────────────────────────────

  openEditForm = slot => {
    this.setState(prev => ({
      editForms: {
        ...prev.editForms,
        [slot.key]: {
          start_time: slot.start_time,
          end_time: slot.end_time,
          preset: slot.preset,
          day_of_week: slot.day_of_week
        }
      }
    }));
  };

  closeEditForm = slotKey => {
    this.setState(prev => {
      const forms = { ...prev.editForms };
      delete forms[slotKey];
      return { editForms: forms };
    });
  };

  updateEditForm = (slotKey, field, value) => {
    this.setState(prev => ({
      editForms: {
        ...prev.editForms,
        [slotKey]: { ...prev.editForms[slotKey], [field]: value }
      }
    }));
  };

  confirmEdit = slotKey => {
    const form = this.state.editForms[slotKey];
    if (!form) return;

    const { day_of_week: dayOfWeek } = form;
    const newStart = timeToMinutes(form.start_time);
    let newEnd = timeToMinutes(form.end_time);
    // If end <= start, the user wants overflow past midnight (e.g. 18h→06h)
    if (newEnd <= newStart) newEnd = newEnd + DAY_MINUTES;

    const existingDaySlots = this.state.slots.filter(s => s.day_of_week === dayOfWeek);

    const { fixedSlots, overflowSlot } = applySlotToDay(
      existingDaySlots,
      dayOfWeek,
      newStart,
      newEnd,
      form.preset,
      slotKey,
      slotKey
    );
    const taggedFixed = fixedSlots.map(s => ({ ...s, day_of_week: dayOfWeek }));
    const finalSlots = mergeIntoSlots(this.state.slots, dayOfWeek, taggedFixed, overflowSlot);

    this.setState(prev => {
      const forms = { ...prev.editForms };
      delete forms[slotKey];
      return { slots: finalSlots, editForms: forms };
    });
  };

  // ── Remove ────────────────────────────────────────────────────────────────

  removeSlot = slotKey => {
    this.setState(prev => ({
      slots: prev.slots.filter(s => s.key !== slotKey),
      editForms: (() => {
        const forms = { ...prev.editForms };
        delete forms[slotKey];
        return forms;
      })()
    }));
  };

  // ── Copy ──────────────────────────────────────────────────────────────────

  openCopyPicker = dayOfWeek => this.setState({ copySourceDay: dayOfWeek, copyTargetDays: [] });
  closeCopyPicker = () => this.setState({ copySourceDay: null, copyTargetDays: [] });

  toggleCopyTarget = day => {
    this.setState(prev => {
      const set = new Set(prev.copyTargetDays || []);
      if (set.has(day)) {
        set.delete(day);
      } else {
        set.add(day);
      }
      return { copyTargetDays: Array.from(set) };
    });
  };

  applyCopy = () => {
    const { copySourceDay, copyTargetDays, slots } = this.state;
    if (!copyTargetDays || copyTargetDays.length === 0) {
      this.closeCopyPicker();
      return;
    }
    const daySlots = slots.filter(s => s.day_of_week === copySourceDay);
    const otherSlots = slots.filter(s => !copyTargetDays.includes(s.day_of_week));
    const copies = [];
    copyTargetDays.forEach(d => {
      daySlots.forEach(s => copies.push({ ...s, day_of_week: d, key: Date.now() + d * 100 + Math.random() }));
    });
    this.setState({ slots: [...otherSlots, ...copies], copySourceDay: null, copyTargetDays: [] });
  };

  // ── Validation ────────────────────────────────────────────────────────────

  validateSchedule = () => {
    const { slots } = this.state;
    const gapDays = [];
    DAYS.forEach(day => {
      const daySlots = slots
        .filter(s => s.day_of_week === day)
        .map(s => ({
          start: timeToMinutes(s.start_time),
          end: timeToMinutes(s.end_time) || DAY_MINUTES
        }))
        .sort((a, b) => a.start - b.start);

      if (daySlots.length === 0) {
        gapDays.push(day);
        return;
      }

      // Check coverage from 0 to DAY_MINUTES
      let covered = 0;
      for (const s of daySlots) {
        if (s.start > covered) {
          gapDays.push(day);
          return;
        }
        covered = Math.max(covered, s.end);
      }
      if (covered < DAY_MINUTES) gapDays.push(day);
    });
    return gapDays;
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  save = async () => {
    const { name, slots } = this.state;
    if (!name.trim()) return;

    const gapDays = this.validateSchedule();
    if (gapDays.length > 0) {
      this.setState({ error: { type: 'gaps', days: gapDays } });
      return;
    }

    this.setState({ saving: true, error: null });
    const scheduleData = {
      name: name.trim(),
      // key is a render-only handle, and id/schedule_id belong to the row being
      // replaced: neither is part of what a slot means.
      slots: slots.map(({ key, id, schedule_id, ...rest }) => rest)
    };
    try {
      const { schedule, httpClient, onSaved } = this.props;
      // A duplicate arrives as a schedule object with no selector: it is a
      // creation, so gating on the object alone would PATCH /schedule/null.
      if (schedule && schedule.selector) {
        await httpClient.patch(`/api/v1/service/thermostat/schedule/${schedule.selector}`, scheduleData);
      } else {
        await httpClient.post('/api/v1/service/thermostat/schedule', scheduleData);
      }
      if (onSaved) onSaved();
    } catch (e) {
      const msg = (e && e.response && e.response.data && e.response.data.message) || true;
      this.setState({ saving: false, error: msg });
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  renderTimeBar(daySlots) {
    const sorted = daySlots.slice().sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    const segments = [];
    sorted.forEach(slot => {
      const start = timeToMinutes(slot.start_time);
      const end = Math.min(timeToMinutes(slot.end_time) || DAY_MINUTES, DAY_MINUTES);
      if (end <= start) return;
      segments.push({ start, end, preset: slot.preset });
    });

    const allPoints = Array.from(new Set([0, ...segments.flatMap(s => [s.start, s.end]), DAY_MINUTES])).sort(
      (a, b) => a - b
    );

    const barParts = [];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const from = allPoints[i];
      const to = allPoints[i + 1];
      const widthPct = ((to - from) / DAY_MINUTES) * 100;
      const seg = segments.find(s => s.start <= from && s.end >= to);
      const color = seg ? PRESET_COLORS[seg.preset] || '#ddd' : '#e9ecef';
      barParts.push({ from, to, widthPct, color });
    }

    return (
      <div class={style.timeBarWrapper}>
        <div class={style.timeBar}>
          {barParts.map(({ from, to, widthPct, color }) => (
            <div
              key={`${from}-${to}`}
              class={style.timeBarSegment}
              style={`--seg-width:${widthPct}%;--seg-color:${color}`}
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
  }

  renderSlotForm(formData, onFieldChange, onConfirm, onCancel, onRemove, dictionary, isEdit) {
    return (
      <div class={isEdit ? style.editSlotForm : style.newSlotForm}>
        <div
          class={style.slotColorDot}
          style={`--dot-color:${PRESET_COLORS[formData.preset] || PRESET_COLORS.comfort}`}
        />
        <input
          type="time"
          class={cx('form-control', 'form-control-sm', style.slotTimeInput)}
          value={formData.start_time}
          onInput={e => onFieldChange('start_time', e.target.value)}
          onChange={e => onFieldChange('start_time', e.target.value)}
        />
        <span class={style.slotArrow}>→</span>
        <input
          type="time"
          class={cx('form-control', 'form-control-sm', style.slotTimeInput)}
          value={formData.end_time}
          onInput={e => onFieldChange('end_time', e.target.value)}
          onChange={e => onFieldChange('end_time', e.target.value)}
        />
        <select
          class={cx('form-control', 'form-control-sm', style.slotPresetSelect)}
          value={formData.preset}
          onChange={e => onFieldChange('preset', e.target.value)}
        >
          {PRESETS.map(p => (
            <option key={p} value={p}>
              {(dictionary.presets && dictionary.presets[p]) || p}
            </option>
          ))}
        </select>
        <button type="button" class="btn btn-sm btn-success" onClick={onConfirm}>
          <i class="fe fe-check" />
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" onClick={onCancel}>
          <i class="fe fe-x" />
        </button>
        {onRemove && (
          <button type="button" class="btn btn-sm btn-outline-danger" onClick={onRemove}>
            <i class="fe fe-trash-2" />
          </button>
        )}
      </div>
    );
  }

  render(
    { onCancel, intl },
    { name, slots, saving, error, selectedDay, copySourceDay, copyTargetDays, newSlotForms, editForms }
  ) {
    const dictionary =
      intl && intl.dictionary && intl.dictionary.integration && intl.dictionary.integration.thermostat
        ? intl.dictionary.integration.thermostat.schedule
        : {};

    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            {this.props.schedule ? (
              <Text id="integration.thermostat.schedule.editButton" />
            ) : (
              <Text id="integration.thermostat.schedule.newButton" />
            )}
          </h3>
        </div>
        <div class="card-body">
          {error && (
            <div class="alert alert-danger">
              {error && error.type === 'gaps' ? (
                <span>
                  <Text id="integration.thermostat.schedule.gapError" />{' '}
                  {error.days.map(d => (
                    <span key={d} class="badge badge-light mr-1">
                      <Text id={`integration.thermostat.schedule.daysShort.${d}`} />
                    </span>
                  ))}
                </span>
              ) : typeof error === 'string' ? (
                error
              ) : (
                <Text id="integration.thermostat.schedule.saveError" />
              )}
            </div>
          )}

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.thermostat.schedule.nameLabel" />
            </label>
            <input
              type="text"
              class="form-control"
              placeholder={dictionary.namePlaceholder || ''}
              value={name}
              onInput={this.updateName}
            />
          </div>

          <div class={style.dayList}>
            {DAYS.map(day => {
              const daySlots = slots
                .filter(s => s.day_of_week === day)
                .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
              const isOpen = selectedDay === day;
              const newForm = newSlotForms[day];

              return (
                <div key={day} class={cx(style.dayRow, { [style.dayRowOpen]: isOpen })}>
                  <div class={style.dayClickZone} onClick={() => this.selectDay(day)}>
                    <div class={style.dayRowHeader}>
                      <span class={style.dayLabel}>
                        <Text id={`integration.thermostat.schedule.days.${day}`} />
                      </span>
                      <i class={`fe fe-chevron-${isOpen ? 'up' : 'down'} ${style.dayChevron}`} />
                    </div>
                    {this.renderTimeBar(daySlots)}
                  </div>

                  {isOpen && (
                    <div class={style.dayPanel}>
                      {daySlots.length === 0 && !newForm && (
                        <p class={`text-muted mb-2 ${style.noSlotsText}`}>
                          <Text id="integration.thermostat.schedule.noSlots" />
                        </p>
                      )}

                      {daySlots.map((slot, idx) => {
                        const editForm = editForms[slot.key];
                        if (editForm) {
                          return (
                            <div key={slot.key || `${day}-${idx}`}>
                              {this.renderSlotForm(
                                editForm,
                                (field, value) => this.updateEditForm(slot.key, field, value),
                                () => this.confirmEdit(slot.key),
                                () => this.closeEditForm(slot.key),
                                () => this.removeSlot(slot.key),
                                dictionary,
                                true
                              )}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={slot.key || `${day}-${idx}`}
                            class={style.slotEditorRow}
                            onClick={() => this.openEditForm(slot)}
                            role="button"
                            tabIndex={0}
                          >
                            <div
                              class={style.slotColorDot}
                              style={`--dot-color:${PRESET_COLORS[slot.preset] || PRESET_COLORS.comfort}`}
                            />
                            <span class={style.slotTimeDisplay}>{slot.start_time}</span>
                            <span class={style.slotArrow}>→</span>
                            <span class={style.slotTimeDisplay}>{slot.end_time}</span>
                            <span class={style.slotPresetLabel}>
                              {(dictionary.presets && dictionary.presets[slot.preset]) || slot.preset}
                            </span>
                            <i class={`fe fe-edit-2 ${style.slotEditIcon}`} />
                          </div>
                        );
                      })}

                      {newForm &&
                        this.renderSlotForm(
                          newForm,
                          (field, value) => this.updateNewSlotForm(day, field, value),
                          () => this.confirmNewSlot(day),
                          () => this.closeNewSlotForm(day),
                          null,
                          dictionary,
                          false
                        )}

                      <div class={style.dayPanelActions}>
                        {!newForm && (
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            onClick={() => this.openNewSlotForm(day)}
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

          <div class={style.saveRow}>
            <button
              type="button"
              class={cx('btn', 'btn-success', { 'btn-loading': saving })}
              onClick={this.save}
              disabled={!name.trim()}
            >
              <Text id="integration.thermostat.schedule.saveButton" />
            </button>
            <button type="button" class="btn btn-secondary" onClick={onCancel}>
              <Text id="integration.thermostat.schedule.cancelButton" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ScheduleEditor;
