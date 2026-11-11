import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import update from 'immutability-helper';

import BaseEditBox from '../baseEditBox';
import SelectDeviceFeature from '../../device/SelectDeviceFeature';
import { startPointerDrag } from '../../../utils/pointerDrag';
import { computeInsertionIndex, insertionLineRect } from '../../../routes/dashboard/edit-dashboard/widgetDropPlacement';
import editorStyle from '../../../routes/dashboard/edit-dashboard/style.css';
import style from './style.css';

const CHIP_TYPES = ['device-feature', 'openings', 'alarm', 'calendar-next-event'];

class EditChipsBox extends Component {
  updateChips = chips => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { chips });
  };

  moveChip = (from, to) => {
    const chips = this.props.box.chips;
    if (from === to || to < 0 || to >= chips.length) {
      return;
    }
    this.updateChips(
      update(chips, {
        $splice: [
          [from, 1],
          [to, 0, chips[from]]
        ]
      })
    );
  };

  startChipDrag = (event, index) => {
    const source = event.currentTarget.closest('[data-chip]');
    const list = source.parentElement;
    const slots = Array.from(list.children);
    const isNoop = destination => destination === index || destination === index + 1;
    startPointerDrag(event, {
      source,
      draggingClass: 'gladys-drag-source-dim',
      dropSelector: '[data-chip-list]',
      ghostClass: editorStyle.dragLayerPill,
      ghostIconClass: 'fe fe-move',
      ghostLabel: this.props.box.chips[index].label || source.querySelector('strong').textContent,
      indicatorClass: editorStyle.dropIndicator,
      resolveHover: (target, point) => {
        const destination = computeInsertionIndex(slots, point.y);
        return {
          area: null,
          indicator:
            target === list && !isNoop(destination)
              ? insertionLineRect(list.getBoundingClientRect(), slots, destination)
              : null
        };
      },
      onDrop: (target, point) => {
        const destination = computeInsertionIndex(slots, point.y);
        if (target === list && !isNoop(destination)) {
          this.moveChip(index, destination > index ? destination - 1 : destination);
        }
      }
    });
  };

  moveChipWithKeyboard = (event, index) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }
    event.preventDefault();
    const list = event.currentTarget.closest('[data-chip-list]');
    const destination = index + (event.key === 'ArrowUp' ? -1 : 1);
    this.moveChip(index, destination);
    // Cards are diffed by position: keep repeated arrow presses on the moved chip.
    window.requestAnimationFrame(() => {
      const handle = list.querySelector(`[data-cy="move-chip-${destination}"]`);
      if (handle) {
        handle.focus();
      }
    });
  };

  addChip = () => {
    const chips = this.props.box.chips || [];
    this.updateChips([...chips, {}]);
  };

  removeChip = index => {
    const newChips = update(this.props.box.chips, { $splice: [[index, 1]] });
    this.updateChips(newChips);
  };

  updateChip = (index, data) => {
    const newChips = update(this.props.box.chips, { [index]: { $merge: data } });
    this.updateChips(newChips);
  };

  updateChipType = (index, e) => {
    // Reset the chip when its type changes so stale fields are not saved
    const newChips = update(this.props.box.chips, { [index]: { $set: { chip_type: e.target.value } } });
    this.updateChips(newChips);
  };

  getHousesAndCalendars = async () => {
    try {
      const [houses, calendars, rooms] = await Promise.all([
        this.props.httpClient.get('/api/v1/house'),
        this.props.httpClient.get('/api/v1/calendar'),
        this.props.httpClient.get('/api/v1/room')
      ]);
      this.setState({ houses, calendars, rooms });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getHousesAndCalendars();
  }

  render(props, { houses, calendars, rooms }) {
    const chips = props.box.chips || [];
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.chips">
        <p>
          <Text id="dashboard.boxes.chips.editDescription" />
        </p>
        <div data-chip-list>
          {chips.map((chip, index) => (
            <div class="card p-3 mb-3" data-chip>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>
                  <Text id="dashboard.boxes.chips.editChipLabel" fields={{ index: index + 1 }} />
                </strong>
                <div class="d-flex">
                  <Localizer>
                    <button
                      type="button"
                      class={`btn btn-sm btn-outline-secondary mr-2 ${style.moveHandle}`}
                      data-cy={`move-chip-${index}`}
                      onPointerDown={e => this.startChipDrag(e, index)}
                      onKeyDown={e => this.moveChipWithKeyboard(e, index)}
                      aria-label={<Text id="dashboard.boxes.chips.moveChipButton" fields={{ index: index + 1 }} />}
                      title={<Text id="dashboard.boxes.chips.moveChipButton" fields={{ index: index + 1 }} />}
                    >
                      <i class="fe fe-move" aria-hidden="true" />
                    </button>
                  </Localizer>
                  <Localizer>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      onClick={() => this.removeChip(index)}
                      aria-label={<Text id="dashboard.boxes.chips.removeChipButton" fields={{ index: index + 1 }} />}
                    >
                      <i class="fe fe-trash" aria-hidden="true" />
                    </button>
                  </Localizer>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <Text id="dashboard.boxes.chips.editChipTypeLabel" />
                </label>
                <select class="form-control" value={chip.chip_type || ''} onChange={e => this.updateChipType(index, e)}>
                  <option value="">
                    <Text id="global.emptySelectOption" />
                  </option>
                  {CHIP_TYPES.map(chipType => (
                    <option value={chipType}>
                      <Text id={`dashboard.boxes.chips.chipTypes.${chipType}`} />
                    </option>
                  ))}
                </select>
              </div>
              {chip.chip_type === 'device-feature' && (
                <div class="form-group">
                  <label class="form-label">
                    <Text id="dashboard.boxes.chips.editDeviceFeatureLabel" />
                  </label>
                  <SelectDeviceFeature
                    value={chip.device_feature}
                    onDeviceFeatureChange={feature =>
                      this.updateChip(index, { device_feature: feature ? feature.selector : undefined })
                    }
                  />
                </div>
              )}
              {(chip.chip_type === 'openings' || chip.chip_type === 'alarm') && (
                <div class="form-group">
                  <label class="form-label">
                    <Text id="dashboard.boxes.chips.editHouseLabel" />
                  </label>
                  <select
                    class="form-control"
                    value={chip.house || ''}
                    onChange={e => this.updateChip(index, { house: e.target.value || undefined })}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {houses &&
                      houses.map(house => (
                        <option value={house.selector} selected={chip.house === house.selector}>
                          {house.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {chip.chip_type === 'openings' && (
                <div class="form-group">
                  <label class="form-label">
                    <Text id="dashboard.boxes.chips.editRoomLabel" />
                  </label>
                  <select
                    class="form-control"
                    value={chip.room || ''}
                    onChange={e => this.updateChip(index, { room: e.target.value || undefined })}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {rooms &&
                      rooms.map(room => (
                        <option value={room.selector} selected={chip.room === room.selector}>
                          {room.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {chip.chip_type === 'calendar-next-event' && (
                <div>
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="dashboard.boxes.chips.editCalendarLabel" />
                    </label>
                    <select
                      class="form-control"
                      value={(chip.calendars && chip.calendars[0]) || ''}
                      onChange={e =>
                        this.updateChip(index, { calendars: e.target.value ? [e.target.value] : undefined })
                      }
                    >
                      <option value="">
                        <Text id="dashboard.boxes.chips.allCalendars" />
                      </option>
                      {calendars &&
                        calendars.map(calendar => (
                          <option
                            value={calendar.selector}
                            selected={chip.calendars && chip.calendars[0] === calendar.selector}
                          >
                            {calendar.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="dashboard.boxes.chips.editEventNameFilterLabel" />
                    </label>
                    <Localizer>
                      <input
                        type="text"
                        class="form-control"
                        placeholder={<Text id="dashboard.boxes.chips.editEventNameFilterPlaceholder" />}
                        value={chip.calendar_event_name_filter || ''}
                        onInput={e => this.updateChip(index, { calendar_event_name_filter: e.target.value })}
                      />
                    </Localizer>
                  </div>
                </div>
              )}
              {chip.chip_type && (
                <div class="form-group mb-0">
                  <label class="form-label">
                    <Text id="dashboard.boxes.chips.editLabelLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      placeholder={<Text id="dashboard.boxes.chips.editLabelPlaceholder" />}
                      value={chip.label || ''}
                      onInput={e => this.updateChip(index, { label: e.target.value })}
                    />
                  </Localizer>
                </div>
              )}
            </div>
          ))}
        </div>
        <button class="btn btn-outline-primary" onClick={this.addChip}>
          <Text id="dashboard.boxes.chips.addChipButton" /> <i class="fe fe-plus" />
        </button>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditChipsBox);
