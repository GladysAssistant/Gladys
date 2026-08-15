import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import update from 'immutability-helper';

import BaseEditBox from '../baseEditBox';
import SelectDeviceFeature from '../../device/SelectDeviceFeature';

const CHIP_TYPES = ['device-feature', 'openings', 'alarm', 'calendar-next-event'];

class EditChipsBox extends Component {
  updateChips = chips => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { chips });
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
        {chips.map((chip, index) => (
          <div class="card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong>
                <Text id="dashboard.boxes.chips.editChipLabel" fields={{ index: index + 1 }} />
              </strong>
              <button class="btn btn-sm btn-outline-danger" onClick={() => this.removeChip(index)}>
                <i class="fe fe-trash" />
              </button>
            </div>
            <div class="form-group">
              <label class="form-label">
                <Text id="dashboard.boxes.chips.editChipTypeLabel" />
              </label>
              <select class="form-control" value={chip.chip_type} onChange={e => this.updateChipType(index, e)}>
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
                  value={chip.house}
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
                  value={chip.room}
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
                    value={chip.calendars && chip.calendars[0]}
                    onChange={e => this.updateChip(index, { calendars: e.target.value ? [e.target.value] : undefined })}
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
                      value={chip.calendar_event_name_filter}
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
                    value={chip.label}
                    onInput={e => this.updateChip(index, { label: e.target.value })}
                  />
                </Localizer>
              </div>
            )}
          </div>
        ))}
        <button class="btn btn-outline-primary" onClick={this.addChip}>
          <Text id="dashboard.boxes.chips.addChipButton" /> <i class="fe fe-plus" />
        </button>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditChipsBox);
