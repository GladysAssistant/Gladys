import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';

import style from './style.css';

const DAYS_OF_THE_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_RANGE = {
  start: '12:00',
  end: '14:00'
};

/**
 * Duration of a range, in minutes. A range whose end is before its start crosses
 * midnight, so it lasts until the next day.
 *
 * @param {object} range - The time range.
 * @returns {number} The duration in minutes.
 */
const durationInMinutes = range => {
  const toMinutes = time => parseInt(time.substr(0, 2), 10) * 60 + parseInt(time.substr(3, 2), 10);
  const start = toMinutes(range.start);
  const end = toMinutes(range.end);
  return end > start ? end - start : end + 24 * 60 - start;
};

const formatDuration = range => {
  const total = durationInMinutes(range);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${String(minutes).padStart(2, '0')}`;
};

class TimeRangesTrigger extends Component {
  getRanges = () => this.props.trigger.time_ranges || [];

  // No day selected yet means "every day", like the runtime does.
  getDays = () => this.props.trigger.days_of_the_week || DAYS_OF_THE_WEEK;

  updateRanges = ranges => {
    this.props.updateTriggerProperty(this.props.index, 'time_ranges', ranges);
  };

  addRange = () => {
    this.updateRanges([...this.getRanges(), { ...DEFAULT_RANGE }]);
  };

  deleteRange = rangeIndex => {
    this.updateRanges(this.getRanges().filter((range, i) => i !== rangeIndex));
  };

  updateRange = (rangeIndex, property, value) => {
    const ranges = this.getRanges().map((range, i) => (i === rangeIndex ? { ...range, [property]: value } : range));
    this.updateRanges(ranges);
  };

  handleStartChange = (rangeIndex, e) => {
    this.updateRange(rangeIndex, 'start', e.target.value);
  };

  handleEndChange = (rangeIndex, e) => {
    this.updateRange(rangeIndex, 'end', e.target.value);
  };

  toggleDay = day => {
    const days = this.getDays();
    // Unselecting the last day would build a trigger which can never fire, and which the
    // server refuses to save: the last checked day stays locked instead.
    if (days.length === 1 && days.includes(day)) {
      return;
    }
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : DAYS_OF_THE_WEEK.filter(d => days.includes(d) || d === day);
    this.props.updateTriggerProperty(this.props.index, 'days_of_the_week', newDays);
  };

  handleCheckboxChange = (property, e) => {
    this.props.updateTriggerProperty(this.props.index, property, e.target.checked);
  };

  render(props) {
    const ranges = this.getRanges();
    const selectedDays = this.getDays();
    const resumeOnStartup = props.trigger.resume_on_startup === true;

    return (
      <div>
        <div class="form-group">
          <div class="form-label">
            <Text id="editScene.triggersCard.scheduledTrigger.rangeDays" />
          </div>
          <div class={style.timeRangeDays}>
            {DAYS_OF_THE_WEEK.map(day => (
              <label key={day} class={`custom-control custom-checkbox ${style.timeRangeDay}`}>
                <input
                  type="checkbox"
                  class="custom-control-input"
                  checked={selectedDays.includes(day)}
                  onChange={() => this.toggleDay(day)}
                />
                <span class="custom-control-label">
                  <Text id={`editScene.triggersCard.scheduledTrigger.daysOfTheWeekShort.${day}`} />
                </span>
              </label>
            ))}
          </div>
          {selectedDays.length === 1 && (
            <div class="mt-2 text-muted">
              <small>
                <Text id="editScene.triggersCard.scheduledTrigger.lastDayLocked" />
              </small>
            </div>
          )}
        </div>

        <div class="form-group">
          <div class="form-label">
            <Text id="editScene.triggersCard.scheduledTrigger.timeRangesLabel" />
          </div>
          {ranges.length === 0 && (
            <div class="alert alert-info">
              <Text id="editScene.triggersCard.scheduledTrigger.noTimeRange" />
            </div>
          )}
          {ranges.length > 0 && (
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>
                      <Text id="editScene.triggersCard.scheduledTrigger.rangeStart" />
                    </th>
                    <th>
                      <Text id="editScene.triggersCard.scheduledTrigger.rangeEnd" />
                    </th>
                    <th>
                      <Text id="editScene.triggersCard.scheduledTrigger.rangeDuration" />
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ranges.map((range, rangeIndex) => (
                    <tr key={rangeIndex}>
                      <td>
                        <input
                          type="time"
                          class="form-control"
                          value={range.start}
                          onChange={e => this.handleStartChange(rangeIndex, e)}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          class="form-control"
                          value={range.end}
                          onChange={e => this.handleEndChange(rangeIndex, e)}
                        />
                      </td>
                      <td class="align-middle">
                        {formatDuration(range)}
                        {range.end < range.start && (
                          <span class="ml-1 badge badge-secondary">
                            <Text id="editScene.triggersCard.scheduledTrigger.overnight" />
                          </span>
                        )}
                      </td>
                      <td class="align-middle">
                        <Localizer>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            onClick={() => this.deleteRange(rangeIndex)}
                            title={<Text id="editScene.triggersCard.scheduledTrigger.deleteRange" />}
                          >
                            <i class="fe fe-trash" />
                          </button>
                        </Localizer>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" class="btn btn-sm btn-outline-primary" onClick={this.addRange}>
            <i class="fe fe-plus mr-2" />
            <Text id="editScene.triggersCard.scheduledTrigger.addRange" />
          </button>
        </div>

        <div class="form-group">
          <label class="custom-control custom-checkbox">
            <input
              type="checkbox"
              class="custom-control-input"
              checked={resumeOnStartup}
              onChange={e => this.handleCheckboxChange('resume_on_startup', e)}
            />
            <span class="custom-control-label">
              <Text id="editScene.triggersCard.scheduledTrigger.resumeOnStartup" />
            </span>
          </label>
        </div>

        <div class="alert alert-info">
          <Text id="editScene.triggersCard.scheduledTrigger.timeRangesHelp" />
        </div>
      </div>
    );
  }
}

export default TimeRangesTrigger;
