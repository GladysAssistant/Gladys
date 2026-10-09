import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import stickyStyle from '../stickyActions.css';
import PRESET_COLORS from '../../../../../utils/thermostatPresetColors';
import { openNativePicker } from '../../../../../utils/openNativePicker';
import {
  timeToMinutes,
  minutesToTime,
  carriedPresetByDay,
  DAY_MINUTES
} from '../../../../../../../server/utils/thermostatSchedule';
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

// The thermostats an editor starts with. A schedule with no selector is being
// created — a duplicate included — and follows nobody yet.
function followersFromSchedule(schedule) {
  if (!schedule || !schedule.selector) {
    return [];
  }
  return (schedule.devices || []).map(device => device.selector);
}

// The ranges an editor holds, from the points a schedule stores.
// Ranges of the same preset that touch are one range. Two of them show as two
// identical lines — 06:30-17:00 Comfort, then 17:00-22:30 Comfort — while the
// points model stores a single stretch, so the editor would be saying something
// the schedule does not. Applied after every operation, not only after a
// deletion: an edit can bring two together just as well, and a schedule loaded
// from the server may already hold a pair.
//
// Walks the week in order so a chain of three merges in one pass, and follows a
// range across midnight onto the next day — the night and the morning that
// continue it are one stretch.
function mergeTouching(ranges) {
  const openAt = range => range.day_of_week * DAY_MINUTES + timeToMinutes(range.start_time);
  const closeAt = range => {
    const start = openAt(range);
    const end = range.day_of_week * DAY_MINUTES + timeToMinutes(range.end_time);
    return end <= start ? end + DAY_MINUTES : end;
  };
  const sorted = [...ranges].sort((a, b) => openAt(a) - openAt(b));
  const merged = [];
  sorted.forEach(range => {
    const previous = merged[merged.length - 1];
    // The week wraps, so a range opening exactly where the previous one closes
    // is its continuation — including the one that closes past midnight.
    if (previous && previous.preset === range.preset && closeAt(previous) === openAt(range)) {
      merged[merged.length - 1] = { ...previous, end_time: range.end_time };
      return;
    }
    merged.push(range);
  });
  // The last range of the week may run into the first, which the pass above
  // cannot see: they are at the two ends of the list.
  if (merged.length > 1) {
    const last = merged[merged.length - 1];
    const first = merged[0];
    if (last.preset === first.preset && closeAt(last) % (7 * DAY_MINUTES) === openAt(first)) {
      merged[0] = { ...last, end_time: first.end_time };
      merged.pop();
    }
  }
  return merged;
}

function rangesFromSchedule(schedule) {
  return ensureKeys(mergeTouching(transitionsToRanges(schedule ? schedule.transitions || [] : [])));
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
      // Selectors rather than the device objects: what is saved is which
      // thermostats follow this schedule, and a duplicate starts from none — it
      // carries the source's followers in its payload but is a creation, and
      // attaching them would silently take them off the schedule they follow.
      followers: followersFromSchedule(props.schedule),
      saving: false,
      error: null,
      emptyConfirmed: false,
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
        followers: followersFromSchedule(props.schedule),
        error: null,
        emptyConfirmed: false,
        selectedDay: null,
        lastScheduleSelector: incomingSelector,
        newForms: {},
        editForms: {}
      };
    }
    return null;
  }

  updateName = e => this.setState({ name: e.target.value });

  // Changing house drops the ticked thermostats: they belong to the house left
  // behind, and the server refuses a thermostat from another one. The select is
  // disabled once something follows the schedule, so this only ever runs while
  // the choice is still free.
  updateHouse = e => this.setState({ house: e.target.value, followers: [] });

  // Take back the question and hand the editor over. The confirmation is dropped
  // with it: this button says "no", so a later Save on a schedule that is still
  // empty has to ask again rather than go straight through.
  backToEditing = () => this.setState({ error: null, emptyConfirmed: false });

  toggleFollower = selector =>
    this.setState(prev => ({
      followers: prev.followers.includes(selector)
        ? prev.followers.filter(candidate => candidate !== selector)
        : [...prev.followers, selector]
    }));

  // The select is an action, not a value the form holds: it goes back to its
  // placeholder once the thermostat it named has moved into the badges.
  addFollower = e => {
    const selector = e.target.value;
    e.target.value = '';
    if (selector) {
      this.toggleFollower(selector);
    }
  };

  selectDay = day => {
    this.setState(prev => ({ selectedDay: prev.selectedDay === day ? null : day }));
  };

  dayRanges = (ranges, day) => ranges.filter(r => r.day_of_week === day).sort(byStart);

  // Two ranges covering the same minute have no meaning: only one preset can be
  // in force at a time, and the points they convert to would silently drop the
  // overlap rather than honour it. The one being added wins, and what it covers
  // is trimmed around it (`trimForRange`).
  //
  // The day/minute stretches a range occupies. One for a range inside its day, two
  // for one crossing midnight: the tail of its own day, then the head of the next.
  rangeSpans = range => {
    const start = timeToMinutes(range.start_time);
    const end = timeToMinutes(range.end_time);
    if (end > start) {
      return [{ day: range.day_of_week, start, end }];
    }
    const spans = [{ day: range.day_of_week, start, end: DAY_MINUTES }];
    if (end > 0) {
      spans.push({ day: (range.day_of_week + 1) % 7, start: 0, end });
    }
    return spans;
  };

  // Make room for a new range by trimming what it covers, rather than refusing it.
  //
  // On a real schedule every day is already covered — the night runs to the next
  // morning — so there is no free gap to add into, and "comfort from 12 to 14"
  // was refused as an overlap. The user had to shorten the eco range first, then
  // add. Trimming is the gesture they meant: what the new range covers gives way.
  //
  // A range the new one sits inside is split in two; one it merely clips is
  // shortened on that side; one it swallows entirely disappears. A range crossing
  // midnight is handled through the same day/minute spans as the overlap check,
  // so a night is trimmed on the day it is stored on.
  trimForRange = (ranges, candidate, ignoredKey = null) => {
    const candidateSpans = this.rangeSpans(candidate);
    const covers = (day, start, end) =>
      candidateSpans.some(span => span.day === day && span.start < end && start < span.end);

    const result = [];
    ranges.forEach(range => {
      if (range.key === ignoredKey) {
        result.push(range);
        return;
      }
      const start = timeToMinutes(range.start_time);
      const rawEnd = timeToMinutes(range.end_time);
      // An overnight range is measured past midnight, so a single interval
      // describes it; the covering test below maps it back onto its days.
      const end = rawEnd <= start ? rawEnd + DAY_MINUTES : rawEnd;
      const spans = this.rangeSpans(range);
      if (!spans.some(span => covers(span.day, span.start, span.end))) {
        result.push(range);
        return;
      }
      // Where the new range falls inside this one's own timeline.
      const cutStart = candidateSpans.reduce((acc, span) => {
        const absolute = span.day === range.day_of_week ? span.start : span.start + DAY_MINUTES;
        return absolute > start && absolute < end ? Math.min(acc, absolute) : acc;
      }, Infinity);
      const cutEnd = candidateSpans.reduce((acc, span) => {
        const absolute = span.day === range.day_of_week ? span.end : span.end + DAY_MINUTES;
        return absolute > start && absolute < end ? Math.max(acc, absolute) : acc;
      }, -Infinity);

      const keepsHead = cutStart !== Infinity && cutStart > start;
      const keepsTail = cutEnd !== -Infinity && cutEnd < end;
      if (keepsHead) {
        result.push({ ...range, end_time: minutesToTime(cutStart) });
      }
      if (keepsTail) {
        result.push({
          ...range,
          key: `${range.key}-tail-${cutEnd}`,
          start_time: minutesToTime(cutEnd),
          end_time: range.end_time
        });
      }
      // Neither head nor tail survives: the new range swallows this one whole.
    });
    return result;
  };

  // ── Adding a point ────────────────────────────────────────────────────────

  openNewForm = day => {
    // The first free stretch of the day, not the end of its last range: the last
    // range of a full day is usually the night, whose end_time is the *next*
    // morning (17:00 → 06:30), and reading it as a start proposed a range over
    // the morning that was already covered.
    const occupied = this.dayRanges(this.state.ranges, day).map(range => {
      const start = timeToMinutes(range.start_time);
      const rawEnd = timeToMinutes(range.end_time);
      // A range crossing midnight occupies this day to its very end; what it
      // takes of the next morning belongs to that day's own gaps.
      return { start, end: rawEnd <= start ? DAY_MINUTES : rawEnd };
    });
    // Plus what a range started on an earlier day still holds this morning.
    const carried = carriedPresetByDay(rangesToTransitions(this.state.ranges))[day];
    if (carried && carried.until > 0) {
      occupied.push({ start: 0, end: carried.until });
    }
    occupied.sort((a, b) => a.start - b.start);
    // Walk the day and stop at the first hole wide enough to hold a range.
    const MIN_GAP = 30;
    let startMins = 0;
    for (let i = 0; i < occupied.length; i += 1) {
      if (occupied[i].start - startMins >= MIN_GAP) {
        break;
      }
      startMins = Math.max(startMins, occupied[i].end);
    }
    // A day with no hole left is the normal case on a real schedule, not an edge
    // one: every minute is covered because the night runs into the next morning.
    // The middle of the afternoon is where an exception is usually wanted, and
    // what it covers is trimmed around it rather than refused.
    if (startMins >= DAY_MINUTES) {
      startMins = 14 * 60;
    }
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
      newForms: { ...prev.newForms, [day]: { ...prev.newForms[day], [field]: value, rowError: null } }
    }));
  };

  confirmNewForm = day => {
    const form = this.state.newForms[day];
    if (!form || !form.start_time || !form.end_time) return;
    if (form.start_time === form.end_time) {
      this.setState(prev => ({
        newForms: { ...prev.newForms, [day]: { ...prev.newForms[day], rowError: 'same-time' } }
      }));
      return;
    }
    const candidate = { day_of_week: day, start_time: form.start_time, end_time: form.end_time };
    // Two ranges starting at the same moment would give one point: replace
    // rather than add, so the second entry is the one that stands.
    const withoutSameStart = this.trimForRange(this.state.ranges, candidate).filter(
      r => !(r.day_of_week === day && r.start_time === form.start_time)
    );
    this.setState(prev => ({
      error: null,
      ranges: mergeTouching([
        ...withoutSameStart,
        {
          key: Date.now() + Math.random(),
          day_of_week: day,
          start_time: form.start_time,
          end_time: form.end_time,
          preset: form.preset
        }
      ]),
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
      editForms: { ...prev.editForms, [key]: { ...prev.editForms[key], [field]: value, rowError: null } }
    }));
  };

  confirmEdit = key => {
    const form = this.state.editForms[key];
    if (!form || !form.start_time || !form.end_time) return;
    if (form.start_time === form.end_time) {
      this.setState(prev => ({
        editForms: { ...prev.editForms, [key]: { ...prev.editForms[key], rowError: 'same-time' } }
      }));
      return;
    }
    const edited = this.state.ranges.find(r => r.key === key);
    const candidate = { day_of_week: edited.day_of_week, start_time: form.start_time, end_time: form.end_time };
    this.setState(prev => {
      const edited = prev.ranges.find(r => r.key === key);
      const ranges = this.trimForRange(prev.ranges, candidate, key)
        // A move onto another range's start replaces it: two ranges starting at
        // the same moment would collapse into one point anyway.
        .filter(r => r.key === key || !(r.day_of_week === edited.day_of_week && r.start_time === form.start_time))
        .map(r =>
          r.key === key ? { ...r, start_time: form.start_time, end_time: form.end_time, preset: form.preset } : r
        );
      const forms = { ...prev.editForms };
      delete forms[key];
      return { ranges: mergeTouching(ranges), editForms: forms, error: null };
    });
  };

  // Deleting a range leaves nothing running in its place: the points it opened
  // and closed both go, and the thermostat keeps whatever the range before it
  // set — exactly what the stored programme then says.
  // Deleting a range hands its time to the range before it, rather than leaving a
  // gap. A gap is not nothing: `rangesToTransitions` stores it as an Off point, so
  // deleting the 08:30-17:00 eco range used to write `08:30 off` and cut the
  // heating until 17:00 — while the editor drew hatching and the legend promised
  // the previous preset carried on. Stopping the heating is something the user
  // asks for with the Off preset; it is never a side effect of a deletion.
  //
  // The predecessor is found on the week's own timeline, so it may sit on an
  // earlier day — the night before, or Sunday for a Monday morning range. When
  // there is none (the only range of the week), the gap stands and the schedule
  // is simply empty.
  removeRange = key => {
    this.setState(prev => {
      const forms = { ...prev.editForms };
      delete forms[key];
      const removed = prev.ranges.find(r => r.key === key);
      const remaining = prev.ranges.filter(r => r.key !== key);
      if (!removed || remaining.length === 0) {
        return { ranges: remaining, editForms: forms };
      }
      // Minutes of the week each range opens and closes at, the end carried past
      // the week's end when it wraps so "ends where the removed one starts" can be
      // compared on one line.
      const WEEK = 7 * DAY_MINUTES;
      const openAt = range => range.day_of_week * DAY_MINUTES + timeToMinutes(range.start_time);
      const closeAt = range => {
        const start = openAt(range);
        const rawEnd = timeToMinutes(range.end_time);
        const end = range.day_of_week * DAY_MINUTES + rawEnd;
        return end <= start ? end + DAY_MINUTES : end;
      };
      const removedStart = openAt(removed);
      // The range that ends where this one starts, or the closest one ending
      // before it — measured round the week, so Sunday night precedes Monday.
      let predecessor = null;
      let smallestDistance = Infinity;
      remaining.forEach(range => {
        const distance = (removedStart - closeAt(range) + WEEK) % WEEK;
        if (distance < smallestDistance) {
          smallestDistance = distance;
          predecessor = range;
        }
      });
      if (!predecessor) {
        return { ranges: remaining, editForms: forms };
      }
      // It now runs to where the removed range ended. Its own end_time is written
      // as typed: the ranges model reads an end at or before the start as running
      // past midnight, which is exactly what a stretched range may now do.
      let stretched = remaining.map(range =>
        range.key === predecessor.key ? { ...range, end_time: removed.end_time } : range
      );
      return { ranges: mergeTouching(stretched), editForms: forms };
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
    this.setState({
      ranges: mergeTouching([...kept, ...copies]),
      copySourceDay: null,
      copyTargetDays: []
    });
  };

  // Attach what was added and detach what was removed. Attaching replaces
  // whatever a thermostat followed before — the link's key is the thermostat —
  // which the help text under the checkboxes says.
  saveFollowers = async selector => {
    const { httpClient, schedule } = this.props;
    const wanted = this.state.followers;
    const before = followersFromSchedule(schedule);
    const base = `/api/v1/service/thermostat/schedule/${selector}/device`;
    const added = wanted.filter(device => !before.includes(device));
    const removed = before.filter(device => !wanted.includes(device));
    await Promise.all([
      ...added.map(device => httpClient.post(`${base}/${device}`)),
      ...removed.map(device => httpClient.delete(`${base}/${device}`))
    ]);
  };

  save = async () => {
    const { name, ranges, emptyConfirmed } = this.state;
    if (!name.trim()) return;

    // A schedule with no point resolves nothing, and the loop then leaves each
    // thermostat on the preset it already carries (C.2) — so saving this and
    // attaching a thermostat to it changes nothing, with nothing to show for it.
    // Asked once rather than refused: an empty schedule is a legitimate step on
    // the way to filling one in.
    if (ranges.length === 0 && !emptyConfirmed) {
      this.setState({ error: 'empty-schedule', emptyConfirmed: true });
      return;
    }

    this.setState({ saving: true, error: null });
    const scheduleData = {
      name: name.trim(),
      // The ranges become points here, and only here: a range that is followed
      // immediately by another needs no stop between them, one followed by a gap
      // gets one, and a night crossing midnight stays a single row.
      transitions: rangesToTransitions(ranges.map(({ key, id, schedule_id, ...rest }) => rest))
    };
    try {
      const { schedule, httpClient, onSaved } = this.props;
      // The house comes from the state, not the props: the select above edits
      // the state, and reading the prop back here would save the schedule into
      // whichever house the page opened on, whatever the user picked.
      const { house } = this.state;
      // A duplicate arrives as a schedule object with no selector: it is a
      // creation, so gating on the object alone would PATCH /schedule/null.
      let saved;
      if (schedule && schedule.selector) {
        saved = await httpClient.patch(`/api/v1/service/thermostat/schedule/${schedule.selector}`, {
          ...scheduleData,
          house
        });
      } else {
        // A schedule belongs to a house: that is what makes its name unique per
        // house and keeps a thermostat from following another house's programme.
        saved = await httpClient.post('/api/v1/service/thermostat/schedule', { ...scheduleData, house });
      }
      // The followers are a relation of their own, so they are saved after the
      // schedule and against the selector it now has — a creation has none until
      // here. Only the difference is sent: attaching a thermostat again would
      // work, but detaching one that was never attached is an error.
      await this.saveFollowers(saved ? saved.selector : schedule.selector);
      if (onSaved) onSaved();
    } catch (e) {
      const msg = (e && e.response && e.response.data && e.response.data.message) || true;
      // The server phrases this one in English, and it reached the French UI
      // verbatim. It is the one save error a user causes by hand, so it gets a
      // translated sentence; anything else stays raw rather than being hidden.
      const duplicate = typeof msg === 'string' && msg.indexOf('already exists') !== -1;
      this.setState({ saving: false, error: duplicate ? 'duplicate-name' : msg });
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  // Rendered by the Save button rather than at the top of the editor: it answers
  // a press on that button, and the editor is several screens tall once the days
  // are open. The empty-schedule one especially has to be seen, since saving it
  // takes a second press.
  renderError = error => {
    if (!error) {
      return null;
    }
    if (error === 'empty-schedule') {
      return (
        <div class="alert alert-info">
          <Text id="integration.thermostat.schedule.emptySaveWarning" />
        </div>
      );
    }
    return (
      <div class="alert alert-warning">
        {error === 'duplicate-name' && <Text id="integration.thermostat.schedule.duplicateNameError" />}
        {error !== 'duplicate-name' && (
          <span>{typeof error === 'string' ? error : <Text id="integration.thermostat.schedule.saveError" />}</span>
        )}
      </div>
    );
  };

  // Text equivalent of the coloured bar, for a collapsed day.
  describeDay = (dayRanges, dictionary, carriedInto) => {
    const presetLabel = preset => (dictionary && dictionary.presets && dictionary.presets[preset]) || preset;
    // A day with no range of its own is not a day the thermostat is stopped: it
    // keeps the preset the last point set, whichever day that was. Announcing
    // "Off" to a screen reader said the opposite of what the heating does.
    const carried = carriedInto
      ? `${presetLabel(carriedInto.preset)} ${(dictionary && dictionary.carriedSince) || ''} ${(dictionary &&
          dictionary.daysShort &&
          dictionary.daysShort[carriedInto.day]) ||
          ''}`.trim()
      : '';
    if (dayRanges.length === 0) {
      // Nothing carried either: the schedule has no point at all, and a
      // thermostat following it keeps whatever preset it is on.
      return carried || (dictionary && dictionary.noSlots) || '';
    }
    const ownRanges = dayRanges
      .map(range => `${range.start_time} - ${range.end_time} ${presetLabel(range.preset)}`)
      .join(', ');
    return carried ? `${carried}, ${ownRanges}` : ownRanges;
  };

  // The bar draws the day's ranges where they fall. Every minute is covered: a
  // stop is a range carrying the `off` preset, drawn in its own grey rather than
  // left as a hole. A range crossing midnight is drawn to the edge here; its
  // remainder belongs to the next day's bar.
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
              class={style.timeBarSegment}
              style={`--seg-width:${((segment.end - segment.start) / DAY_MINUTES) * 100}%;--seg-color:${
                segment.preset ? PRESET_COLORS[segment.preset] || PRESET_COLORS.comfort : PRESET_COLORS.off
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
        <label class={style.slotTimeField}>
          <span class={style.slotFieldLabel}>
            <Text id="integration.thermostat.schedule.startLabel" />
          </span>
          <input
            type="time"
            class={cx('form-control', 'form-control-sm', style.slotTimeInput)}
            value={form.start_time}
            onClick={openNativePicker}
            onChange={e => onChange('start_time', e.target.value)}
          />
        </label>
        <span class={style.slotArrow}>→</span>
        <label class={style.slotTimeField}>
          <span class={style.slotFieldLabel}>
            <Text id="integration.thermostat.schedule.endLabel" />
          </span>
          <input
            type="time"
            class={cx('form-control', 'form-control-sm', style.slotTimeInput)}
            value={form.end_time}
            onClick={openNativePicker}
            onChange={e => onChange('end_time', e.target.value)}
          />
        </label>
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
        <button type="button" class={cx('btn', 'btn-sm', 'btn-primary', style.slotAction)} onClick={onConfirm}>
          <i class="fe fe-check" />
          <span class={style.slotActionLabel}>
            <Text id={`integration.thermostat.schedule.${isEdit ? 'confirmEditButton' : 'confirmSlotButton'}`} />
          </span>
        </button>
        <button type="button" class={cx('btn', 'btn-sm', 'btn-secondary', style.slotAction)} onClick={onCancel}>
          <i class="fe fe-x" />
          <span class={style.slotActionLabel}>
            <Text id="integration.thermostat.schedule.cancelButton" />
          </span>
        </button>
        {onRemove && (
          <button type="button" class={cx('btn', 'btn-sm', 'btn-outline-danger', style.slotAction)} onClick={onRemove}>
            <i class="fe fe-trash-2" />
            <span class={style.slotActionLabel}>
              <Text id="integration.thermostat.schedule.deleteButton" />
            </span>
          </button>
        )}
      </div>
      {/* On the row itself: this answers the tick that was just clicked, and the
          Save button can be most of a screen below it. */}
      {form.rowError === 'same-time' && (
        <p class={style.slotRowError}>
          <Text id="integration.thermostat.schedule.sameTimeError" />
        </p>
      )}
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

    // The thermostats that may follow this schedule: those of its house, which a
    // room places them in. The list is empty until a house is settled, which on a
    // single-house installation it always is.
    const currentHouse = (this.props.houses || []).find(candidate => candidate.selector === house);
    const roomIds = currentHouse ? (currentHouse.rooms || []).map(room => room.id) : [];
    const thermostatsOfHouse = (this.props.thermostatDevices || []).filter(device => roomIds.includes(device.room_id));
    // What the select still has to offer: the badges hold the rest.
    const available = thermostatsOfHouse.filter(device => !this.state.followers.includes(device.selector));

    // A day with no point of its own keeps what the last point before it set,
    // and that point may be several days back — a schedule with a single
    // Saturday point holds its preset all week. The server answers this from the
    // transitions, so the same helper answers it here rather than a second
    // reading of the ranges that could only see as far as yesterday.
    const transitions = rangesToTransitions(ranges);
    const carriedByDay = carriedPresetByDay(transitions);
    // In the order the bars are read, not the order the ranges were entered.
    const usedPresets = PRESETS.filter(preset => ranges.some(range => range.preset === preset));

    return (
      // In a card with a title, like every other page of this integration: the
      // editor opened as a bare form in the middle of the page, with nothing
      // saying which schedule was being edited.
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text
              id={
                schedule && schedule.selector
                  ? 'integration.thermostat.schedule.editorTitleEdit'
                  : 'integration.thermostat.schedule.editorTitleNew'
              }
            />
          </h1>
        </div>
        <div class={cx('card-body', style.scheduleEditor)}>
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

          {/* Which thermostats follow this programme, chosen while it is written
            rather than from the list afterwards. Only the ones of its house: the
            server refuses the rest (DEVICE_NOT_IN_HOUSE), so a thermostat with no
            room — which is in no house — is in none of these lists. */}
          {thermostatsOfHouse.length > 0 && (
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.thermostat.schedule.followersLabel" />
              </label>
              {/* Chosen one at a time and shown as badges, the way the schedule
                list does it: a schedule can be followed by several thermostats,
                so the select adds rather than replaces, and each badge carries
                the cross that takes one back out. */}
              {this.state.followers.length > 0 && (
                <div class={style.followerList}>
                  {this.state.followers.map(selector => {
                    const device = thermostatsOfHouse.find(candidate => candidate.selector === selector);
                    return (
                      <span key={selector} class={`badge ${style.followerBadge}`}>
                        {device ? device.name : selector}
                        <button
                          type="button"
                          class={style.followerDetach}
                          onClick={() => this.toggleFollower(selector)}
                          title={dictionary.detachButton || ''}
                        >
                          <i class="fe fe-x" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {available.length > 0 && (
                <select class="form-control" value="" onChange={this.addFollower}>
                  <option value="">{dictionary.attachPlaceholder || ''}</option>
                  {available.map(device => (
                    <option key={device.selector} value={device.selector}>
                      {device.name}
                    </option>
                  ))}
                </select>
              )}
              <small class="form-text text-muted">
                <Text id="integration.thermostat.schedule.followersHelp" />
              </small>
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
                    <span class="sr-only">{this.describeDay(dayPoints, dictionary, carriedByDay[day])}</span>
                    {this.renderTimeBar(dayPoints, carriedByDay[day])}
                    {/* Only on a day with no point of its own, whose whole bar
                      therefore comes from somewhere else: that is the day the
                      caption explains. On a day that has its own ranges the carry
                      covers the morning only, which the bar already shows — and
                      a nightly slot made this line repeat under all seven days,
                      saying nothing new six times. */}
                    {carriedByDay[day] && dayPoints.length === 0 && (
                      <div class={style.carriedFrom}>
                        <i class="fe fe-corner-down-right mr-1" />
                        {(dictionary.presets && dictionary.presets[carriedByDay[day].preset]) ||
                          carriedByDay[day].preset}
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
                      </div>

                      {/* Under the two buttons, not beside them: opened in the same
                          flex row, the picker squeezed "Add a slot" into a narrow
                          pill whose label spilled out of it on a phone. */}
                      {copySourceDay === day && (
                        <div class={style.copyPicker}>
                          <span class={style.copyPickerLabel}>
                            <Text id="integration.thermostat.schedule.copyToLabel" />
                          </span>
                          <div class={style.copyPickerDays}>
                            {DAYS.filter(d => d !== day).map(d => (
                              <label key={d} class={style.copyPickerDay}>
                                <input
                                  type="checkbox"
                                  checked={(copyTargetDays || []).includes(d)}
                                  onChange={() => this.toggleCopyTarget(d)}
                                />
                                <Text id={`integration.thermostat.schedule.daysShort.${d}`} />
                              </label>
                            ))}
                          </div>
                          <div class={style.copyPickerActions}>
                            <button type="button" class="btn btn-secondary" onClick={this.closeCopyPicker}>
                              <Text id="integration.thermostat.schedule.cancelButton" />
                            </button>
                            <button
                              type="button"
                              class="btn btn-primary"
                              onClick={this.applyCopy}
                              disabled={!(copyTargetDays && copyTargetDays.length > 0)}
                            >
                              <Text id="integration.thermostat.schedule.applyButton" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* The colour key for the seven bars, once under them. Without it the
            only way to learn that blue is the night and orange the comfort was to
            open a day and read a select. Only the presets this schedule uses are
            listed. */}
          {usedPresets.length > 0 && (
            <div class={style.presetLegend}>
              {usedPresets.map(preset => (
                <span key={preset} class={style.presetLegendItem}>
                  <span
                    class={style.presetLegendSwatch}
                    style={`--swatch-color:${PRESET_COLORS[preset] || PRESET_COLORS.comfort}`}
                  />
                  {(dictionary.presets && dictionary.presets[preset]) || preset}
                </span>
              ))}
            </div>
          )}

          {this.renderError(error)}
        </div>

        {/* The same bar as the thermostat form: seven foldable days push Save well
            below the fold, so it follows the page down and settles at the end of
            the editor. Outside the card body, which is what the sticky position
            sticks to.

            Saving an empty schedule turns the row into the question itself: the
            button says what the second press will do, and the way out is to go
            back and add a slot rather than to leave the editor. Repeating "Save"
            gave no sign that the press meant something else this time. */}
        {error === 'empty-schedule' ? (
          <div class={stickyStyle.stickyActions}>
            <button type="button" class="btn btn-secondary" onClick={this.backToEditing}>
              <Text id="integration.thermostat.schedule.backToEditingButton" /> <i class="fe fe-corner-up-left" />
            </button>
            <button type="button" class="btn btn-warning ml-2" onClick={this.save} disabled={saving}>
              <Text id="integration.thermostat.schedule.saveEmptyButton" /> <i class="fe fe-save" />
            </button>
          </div>
        ) : (
          <div class={stickyStyle.stickyActions}>
            <button type="button" class="btn btn-secondary" onClick={onCancel}>
              <Text id="integration.thermostat.schedule.cancelButton" /> <i class="fe fe-slash" />
            </button>
            <button type="button" class="btn btn-success ml-2" onClick={this.save} disabled={saving || !name.trim()}>
              <Text id="integration.thermostat.schedule.saveButton" /> <i class="fe fe-save" />
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default ScheduleEditor;
