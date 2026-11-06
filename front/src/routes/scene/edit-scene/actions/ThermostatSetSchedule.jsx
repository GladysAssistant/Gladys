import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from '../../../../components/form/Select';

class ThermostatSetSchedule extends Component {
  getOptions = async () => {
    try {
      const [schedules, thermostats, houses] = await Promise.all([
        this.props.httpClient.get('/api/v1/service/thermostat/schedule'),
        this.props.httpClient.get('/api/v1/service/thermostat/device'),
        this.props.httpClient.get('/api/v1/house', { expand: 'rooms' })
      ]);
      // A schedule belongs to a house, and only the thermostats of that house can
      // follow it: the room of each thermostat tells which house it is in.
      const houseByRoomId = {};
      const houseNames = {};
      houses.forEach(house => {
        houseNames[house.selector] = house.name;
        (house.rooms || []).forEach(room => {
          houseByRoomId[room.id] = house.selector;
        });
      });
      const severalHouses = houses.length > 1;
      const scheduleOptions = schedules.map(schedule => ({
        value: schedule.selector,
        label: severalHouses ? `${schedule.name} (${houseNames[schedule.house] || schedule.house})` : schedule.name,
        house: schedule.house
      }));
      const thermostatOptions = thermostats.map(thermostat => ({
        value: thermostat.selector,
        label: thermostat.name,
        house: houseByRoomId[thermostat.room_id] || null
      }));
      await this.setState({ scheduleOptions, thermostatOptions });
      this.refreshSelectedOptions(this.props);
    } catch (e) {
      console.error(e);
    }
  };

  handleScheduleChange = selectedOption => {
    this.props.updateActionProperty(this.props.path, 'schedule', selectedOption ? selectedOption.value : null);
    // A thermostat of another house cannot follow the new schedule: kept on the
    // action, it would only be refused when the scene runs.
    const { devices } = this.props.action;
    if (selectedOption && devices && this.state.thermostatOptions) {
      const devicesInHouse = devices.filter(selector =>
        this.state.thermostatOptions.some(option => option.value === selector && option.house === selectedOption.house)
      );
      if (devicesInHouse.length !== devices.length) {
        this.props.updateActionProperty(this.props.path, 'devices', devicesInHouse);
      }
    }
  };

  handleThermostatsChange = selectedOptions => {
    const devices = selectedOptions ? selectedOptions.map(option => option.value) : [];
    this.props.updateActionProperty(this.props.path, 'devices', devices);
  };

  refreshSelectedOptions = nextProps => {
    const { scheduleOptions, thermostatOptions } = this.state;
    let selectedScheduleOption = null;
    if (nextProps.action.schedule && scheduleOptions) {
      selectedScheduleOption = scheduleOptions.find(option => option.value === nextProps.action.schedule) || null;
    }
    const selectedThermostatOptions = [];
    if (nextProps.action.devices && thermostatOptions) {
      nextProps.action.devices.forEach(selector => {
        const option = thermostatOptions.find(thermostatOption => thermostatOption.value === selector);
        if (option) {
          selectedThermostatOptions.push(option);
        }
      });
    }
    this.setState({ selectedScheduleOption, selectedThermostatOptions });
  };

  constructor(props) {
    super(props);
    this.state = {
      scheduleOptions: null,
      thermostatOptions: null,
      selectedScheduleOption: null,
      selectedThermostatOptions: []
    };
  }

  componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { scheduleOptions, thermostatOptions, selectedScheduleOption, selectedThermostatOptions }) {
    // Thermostats are offered once a schedule is picked, and only those of its house.
    const availableThermostats =
      selectedScheduleOption && thermostatOptions
        ? thermostatOptions.filter(option => option.house === selectedScheduleOption.house)
        : [];
    const scheduleInputId = `thermostat-set-schedule-${props.path}-schedule`;
    const thermostatsInputId = `thermostat-set-schedule-${props.path}-thermostats`;
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.thermostatSetSchedule.description" />
        </p>
        <div class="form-group">
          <label class="form-label" htmlFor={scheduleInputId}>
            <Text id="editScene.actionsCard.thermostatSetSchedule.scheduleLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            inputId={scheduleInputId}
            options={scheduleOptions}
            value={selectedScheduleOption}
            onChange={this.handleScheduleChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div class="form-group">
          <label class="form-label" htmlFor={thermostatsInputId}>
            <Text id="editScene.actionsCard.thermostatSetSchedule.thermostatsLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            inputId={thermostatsInputId}
            defaultValue={[]}
            isMulti
            isDisabled={!selectedScheduleOption}
            options={availableThermostats}
            value={selectedThermostatOptions}
            onChange={this.handleThermostatsChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(ThermostatSetSchedule);
