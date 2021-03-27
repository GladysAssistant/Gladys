import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import BroadlinkPage from '../../BroadlinkPage';
import uuid from 'uuid';
import update from 'immutability-helper';
import RemoteSetupTab from './RemoteSetupTab';
import { route } from 'preact-router';
import ButtonOptions from '../../../../../../components/remote-control/templates';
import { addSelector } from '../../../../../../../../server/utils/addSelector';

@connect('session,user,httpClient,currentIntegration,houses,broadlinkPeripherals', actions)
class BroadlinkDeviceSetupPage extends Component {
  updateState(newState) {
    this.setState(newState);
  }

  updateDeviceProperty(property, value) {
    const device = update(this.state.device, {
      [property]: {
        $set: value
      }
    });

    this.setState({
      device
    });
  }

  deleteButton() {
    const { buttons, selectedButton } = this.state;
    delete buttons[selectedButton];

    this.setState({
      buttons,
      selectedButton: undefined
    });
  }

  async saveDevice() {
    this.setState({
      loading: true
    });

    const { device, buttons, selectedRemoteType, selectedModel } = this.state;
    device.id = device.id || uuid.v4();
    device.params = [];
    device.external_id = `broadlink:${selectedModel.mac}:${device.id}`;
    device.model = `remote-control:${selectedRemoteType}`;
    addSelector(device);
    device.features = Object.keys(buttons).map(key => {
      const externalId = `${device.external_id}:${key}`;

      device.params.push({
        name: `code_${key}`,
        value: buttons[key]
      });

      const feature = {
        name: key,
        external_id: externalId,
        selector: externalId,
        category: selectedRemoteType,
        type: key,
        read_only: false,
        keep_history: false,
        has_feedback: false,
        min: 0,
        max: 0
      };
      addSelector(feature);
      return feature;
    });

    try {
      await this.props.httpClient.post('/api/v1/device', device);
      route('/dashboard/integration/device/broadlink');
    } catch (e) {
      this.setState({
        loading: false,
        saveStatus: e
      });
    }
  }

  testSelectedButton() {
    try {
      const { buttons, selectedButton, selectedModel } = this.state;
      this.props.httpClient.post('/api/v1/service/broadlink/send', {
        peripheral: selectedModel.mac,
        code: buttons[selectedButton]
      });
    } catch (e) {
      // Nothing to do
    }
  }

  selectButton(value) {
    this.setState({
      selectedButton: value
    });
  }

  storeButtonCode(code) {
    let { selectedButton, learnAllMode } = this.state;

    const buttons = update(this.state.buttons, {
      [selectedButton]: {
        $set: code
      }
    });

    this.setState({
      buttons
    });

    if (learnAllMode) {
      const toLearn = update(this.state.toLearn, {
        $splice: [[0, 1]]
      });

      learnAllMode = toLearn.length > 0;

      if (learnAllMode) {
        selectedButton = toLearn[0];
      } else {
        selectedButton = undefined;
      }

      this.setState({
        toLearn,
        learnAllMode,
        selectedButton
      });
    }
  }

  learnAll() {
    const buttons = Object.keys(ButtonOptions[this.state.selectedRemoteType]);
    this.setState({
      learnAllMode: true,
      toLearn: buttons,
      selectedButton: buttons[0]
    });
  }

  quitLearnMode() {
    this.setState({
      learnAllMode: false,
      toLearn: [],
      selectedButton: undefined
    });
  }

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      buttons: {}
    };

    this.updateState = this.updateState.bind(this);
    this.updateDeviceProperty = this.updateDeviceProperty.bind(this);
    this.deleteButton = this.deleteButton.bind(this);
    this.saveDevice = this.saveDevice.bind(this);
    this.testSelectedButton = this.testSelectedButton.bind(this);
    this.selectButton = this.selectButton.bind(this);
    this.storeButtonCode = this.storeButtonCode.bind(this);
    this.learnAll = this.learnAll.bind(this);
    this.quitLearnMode = this.quitLearnMode.bind(this);
  }

  async componentWillMount() {
    await this.props.getHouses();
    await this.props.getIntegrationByName('broadlink');
    await this.props.getBroadlinkPeripherals();

    let { deviceSelector } = this.props;
    let device;
    let buttons = {};
    let selectedModel;
    let selectedRemoteType;

    if (!deviceSelector) {
      device = {
        name: null,
        should_poll: false,
        service_id: this.props.currentIntegration.id
      };

      if (this.props.broadlinkPeripherals.length === 1) {
        selectedModel = this.props.broadlinkPeripherals[0];
      }
    } else {
      const loadedDevice = await this.props.httpClient.get(`/api/v1/device/${deviceSelector}`);

      if (
        loadedDevice &&
        this.props.currentIntegration &&
        loadedDevice.service_id === this.props.currentIntegration.id
      ) {
        device = loadedDevice;
        const { features, params } = device;

        features.forEach(feature => {
          const { type } = feature;
          const param = params.find(p => p.name === `code_${type}`);

          if (param) {
            buttons[type] = param.value;
          }
        });

        // Load select peripheral
        const peripheral = device.external_id.split(':')[1];
        selectedModel = this.props.broadlinkPeripherals.find(p => p.mac === peripheral);
        selectedRemoteType = device.model.replace('remote-control:', '');
      }
    }

    this.setState({
      loading: false,
      device,
      buttons,
      selectedModel,
      selectedRemoteType
    });
  }

  render(props, state) {
    return (
      <BroadlinkPage>
        <RemoteSetupTab
          {...props}
          {...state}
          updateState={this.updateState}
          updateDeviceProperty={this.updateDeviceProperty}
          updateDeviceModelProperty={this.updateDeviceModelProperty}
          deleteButton={this.deleteButton}
          saveDevice={this.saveDevice}
          testSelectedButton={this.testSelectedButton}
          selectButton={this.selectButton}
          storeButtonCode={this.storeButtonCode}
          learnAll={this.learnAll}
          quitLearnMode={this.quitLearnMode}
        />
      </BroadlinkPage>
    );
  }
}

export default BroadlinkDeviceSetupPage;
