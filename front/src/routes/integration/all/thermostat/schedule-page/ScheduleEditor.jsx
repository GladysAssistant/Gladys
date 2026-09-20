import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import PRESET_COLORS from '../../../../../utils/thermostatPresetColors';
import { timeToMinutes, DAY_MINUTES } from '../../../../../../../server/utils/thermostatSchedule';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const PRESETS = ['off', 'frost', 'away', 'eco', 'night', 'comfort'];
const FIXED_MARKERS = [6 * 60, 12 * 60, 18 * 60];

function formatLabel(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function ensureKeys(transitions) {
  return transitions.map((t, i) => (t.key ? t : { ...t, key: Date.now() + i + Math.random() }));
}

const byTime = (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time);

/**
 * A schedule is a list of transition points: from this day and this time, this
 * preset, until the next point. Editing one is adding, moving or deleting a
 * point — there is no interval algebra left, because there are no intervals:
 * deleting a point simply extends the one before it.
 */
class ScheduleEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.schedule ? props.schedule.name : '',
      transitions: ensureKeys(props.schedule ? props.schedule.transitions || [] : []),
      saving: false,
      error: null,
      selectedDay: null,
      lastScheduleSelector: props.schedule ? props.schedule.selector : null,
      copySourceDay: null,
      copyTargetDays: [],
      newForms: {}, // { [day]: { time, preset } }
      editForms: {} // { [key]: { time, preset } }
    };
  }

  static getDerivedStateFromProps(props, state) {
    const incomingSelector = props.schedule ? props.schedule.selector : null;
    if (incomingSelector !== state.lastScheduleSelector) {
      return {
        name: props.schedule ? props.schedule.name : '',
        transitions: ensureKeys(props.schedule ? props.schedule.transitions || [] : []),
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

  dayTransitions = (transitions, day) => transitions.filter(t => t.day_of_week === day).sort(byTime);

  // ── Adding a point ────────────────────────────────────────────────────────

  openNewForm = day => {
    const existing = this.dayTransitions(this.state.transitions, day);
    // Start after the last point of the day, so a second point does not land on
    // the first one and get refused as a duplicate.
    const last = existing[existing.length - 1];
    const startMins = last ? Math.min(timeToMinutes(last.time) + 60, DAY_MINUTES - 60) : 6 * 60;
    const h = String(Math.floor(startMins / 60)).padStart(2, '0');
    const m = String(startMins % 60).padStart(2, '0');
    this.setState(prev => ({
      newForms: { ...prev.newForms, [day]: { time: `${h}:${m}`, preset: 'comfort' } }
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
    if (!form || !form.time) return;
    // Two points on the same day and the same time would make the programme
    // ambiguous, and the server refuses them: replace rather than add.
    const withoutSameTime = this.state.transitions.filter(t => !(t.day_of_week === day && t.time === form.time));
    this.setState(prev => ({
      transitions: [
        ...withoutSameTime,
        { key: Date.now() + Math.random(), day_of_week: day, time: form.time, preset: form.preset }
      ],
      newForms: (() => {
        const forms = { ...prev.newForms };
        delete forms[day];
        return forms;
      })()
    }));
  };

  // ── Editing a point ───────────────────────────────────────────────────────

  openEditForm = transition => {
    this.setState(prev => ({
      editForms: { ...prev.editForms, [transition.key]: { time: transition.time, preset: transition.preset } }
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
    if (!form || !form.time) return;
    this.setState(prev => {
      const edited = prev.transitions.find(t => t.key === key);
      const transitions = prev.transitions
        // A move onto another point of the same day replaces it.
        .filter(t => t.key === key || !(t.day_of_week === edited.day_of_week && t.time === form.time))
        .map(t => (t.key === key ? { ...t, time: form.time, preset: form.preset } : t));
      const forms = { ...prev.editForms };
      delete forms[key];
      return { transitions, editForms: forms };
    });
  };

  // Deleting a point extends the one before it: there is nothing else to do,
  // which is the whole point of storing points rather than intervals.
  removeTransition = key => {
    this.setState(prev => {
      const forms = { ...prev.editForms };
      delete forms[key];
      return { transitions: prev.transitions.filter(t => t.key !== key), editForms: forms };
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

  // Copying a day is copying its points — no algebra, no overflow to propagate.
  applyCopy = () => {
    const { copySourceDay, copyTargetDays, transitions } = this.state;
    if (copySourceDay === null || copyTargetDays.length === 0) return;
    const source = this.dayTransitions(transitions, copySourceDay);
    const kept = transitions.filter(t => !copyTargetDays.includes(t.day_of_week));
    const copies = copyTargetDays.flatMap(day =>
      source.map(t => ({ key: Date.now() + Math.random(), day_of_week: day, time: t.time, preset: t.preset }))
    );
    this.setState({ transitions: [...kept, ...copies], copySourceDay: null, copyTargetDays: [] });
  };

  save = async () => {
    const { name, transitions } = this.state;
    if (!name.trim()) return;

    this.setState({ saving: true, error: null });
    const scheduleData = {
      name: name.trim(),
      // key is a render-only handle, and id/schedule_id belong to the row being
      // replaced: neither is part of what a transition means.
      transitions: transitions.map(({ key, id, schedule_id, ...rest }) => rest)
    };
    try {
      const { schedule, httpClient, onSaved, house } = this.props;
      // A duplicate arrives as a schedule object with no selector: it is a
      // creation, so gating on the object alone would PATCH /schedule/null.
      if (schedule && schedule.selector) {
        await httpClient.patch(`/api/v1/service/thermostat/schedule/${schedule.selector}`, scheduleData);
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
  describeDay = (dayTransitions, dictionary) => {
    if (dayTransitions.length === 0) {
      return (dictionary && dictionary.noSlots) || '';
    }
    return dayTransitions
      .map(t => `${t.time} ${(dictionary.presets && dictionary.presets[t.preset]) || t.preset}`)
      .join(', ');
  };

  // The bar draws what each point covers until the next one. The last point of
  // the day runs to midnight here: what happens after that belongs to the next
  // day's bar, and the week wraps on the server.
  renderTimeBar = (dayTransitions, carriedPreset) => {
    const segments = [];
    if (dayTransitions.length === 0) {
      if (carriedPreset) {
        segments.push({ start: 0, end: DAY_MINUTES, preset: carriedPreset });
      }
    } else {
      // Before the first point, the day carries whatever the previous day left.
      const firstStart = timeToMinutes(dayTransitions[0].time);
      if (firstStart > 0 && carriedPreset) {
        segments.push({ start: 0, end: firstStart, preset: carriedPreset });
      }
      dayTransitions.forEach((transition, index) => {
        const start = timeToMinutes(transition.time);
        const next = dayTransitions[index + 1];
        segments.push({ start, end: next ? timeToMinutes(next.time) : DAY_MINUTES, preset: transition.preset });
      });
    }

    return (
      <div class={style.timeBarWrapper} aria-hidden="true">
        <div class={style.timeBar}>
          {segments.map(segment => (
            <div
              key={`${segment.start}-${segment.end}`}
              class={style.timeBarSegment}
              style={`--segment-left:${(segment.start / DAY_MINUTES) * 100}%;--segment-width:${((segment.end -
                segment.start) /
                DAY_MINUTES) *
                100}%;--segment-color:${PRESET_COLORS[segment.preset] || PRESET_COLORS.comfort}`}
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

  renderTransitionForm = (form, onChange, onConfirm, onCancel, onRemove, dictionary, isEdit) => (
    <div class={style.slotFormWrapper}>
      <div class={isEdit ? style.editSlotForm : style.newSlotForm}>
        <div class={style.slotColorDot} style={`--dot-color:${PRESET_COLORS[form.preset] || PRESET_COLORS.comfort}`} />
        <input
          type="time"
          class={cx('form-control', 'form-control-sm', style.slotTimeInput)}
          value={form.time}
          onChange={e => onChange('time', e.target.value)}
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
    { onCancel, intl },
    { name, transitions, saving, error, selectedDay, copySourceDay, copyTargetDays, newForms, editForms }
  ) {
    const dictionary =
      intl && intl.dictionary && intl.dictionary.integration && intl.dictionary.integration.thermostat
        ? intl.dictionary.integration.thermostat.schedule
        : {};

    // What each day inherits from the one before it: the week wraps, so a day
    // with no point of its own carries the last preset set before it.
    const sorted = [...transitions].sort((a, b) => a.day_of_week - b.day_of_week || byTime(a, b));
    const lastOfWeek = sorted[sorted.length - 1];
    const carriedByDay = {};
    let carried = lastOfWeek ? lastOfWeek.preset : null;
    DAYS.forEach(day => {
      carriedByDay[day] = carried;
      const dayPoints = this.dayTransitions(transitions, day);
      if (dayPoints.length > 0) {
        carried = dayPoints[dayPoints.length - 1].preset;
      }
    });

    return (
      <div class={style.scheduleEditor}>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.thermostat.schedule.nameLabel" />
          </label>
          <input type="text" class="form-control" value={name} onChange={this.updateName} />
        </div>

        {error && (
          <div class="alert alert-warning">
            {typeof error === 'string' ? error : <Text id="integration.thermostat.schedule.saveError" />}
          </div>
        )}

        <div class={style.dayList}>
          {DAYS.map(day => {
            const dayPoints = this.dayTransitions(transitions, day);
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
                </div>

                {isOpen && (
                  <div class={style.dayPanel}>
                    {dayPoints.length === 0 && !newForm && (
                      <p class={`text-muted mb-2 ${style.noSlotsText}`}>
                        <Text id="integration.thermostat.schedule.noSlots" />
                      </p>
                    )}

                    {dayPoints.map((transition, idx) => {
                      const editForm = editForms[transition.key];
                      if (editForm) {
                        return (
                          <div key={transition.key || `${day}-${idx}`}>
                            {this.renderTransitionForm(
                              editForm,
                              (field, value) => this.updateEditForm(transition.key, field, value),
                              () => this.confirmEdit(transition.key),
                              () => this.closeEditForm(transition.key),
                              () => this.removeTransition(transition.key),
                              dictionary,
                              true
                            )}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={transition.key || `${day}-${idx}`}
                          class={style.slotEditorRow}
                          onClick={() => this.openEditForm(transition)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              this.openEditForm(transition);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div
                            class={style.slotColorDot}
                            style={`--dot-color:${PRESET_COLORS[transition.preset] || PRESET_COLORS.comfort}`}
                          />
                          <span class={style.slotTimeDisplay}>{transition.time}</span>
                          <span class={style.slotPresetLabel}>
                            {(dictionary.presets && dictionary.presets[transition.preset]) || transition.preset}
                          </span>
                          <i class={`fe fe-edit-2 ${style.slotEditIcon}`} />
                        </div>
                      );
                    })}

                    {newForm &&
                      this.renderTransitionForm(
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
