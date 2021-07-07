import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import update from 'immutability-helper';
import get from 'get-value';

import { RequestStatus } from '../../../../../../utils/consts';
import RemoteControlSelector from '../../../../../../components/remote-control/RemoteControlSelector';
import { FEATURES_BY_CATEGORY, FEATURE_LIST_BY_CATEGORY } from '../../../../../../components/remote-control/templates';

import { PARAMS } from '../../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';
import RemoteButtonEditionPanel from './RemoteButtonEditionPanel';
import RemoteCreationSuccess from './RemoteCreationSuccess';

class RemoteCreation extends Component {
  updateDeviceName = e => {
    const name = e.target.value;
    const { device } = this.state;
    this.setState({ device: { ...device, name } });
  };

  updateDeviceRoom = e => {
    const roomId = e.target.value;
    const { device } = this.state;
    this.setState({ device: { ...device, room_id: roomId } });
  };

  updateDeviceModel = model => {
    const { device } = this.state;
    this.setState({ device: { ...device, model } });
  };

  updatePeripheralModel = e => {
    const peripheral = e.target.value;
    this.setState({ peripheral });
  };

  saveDevice = async () => {
    this.setState({
      saveStatus: RequestStatus.Getting
    });

    const { device, buttons, peripheral } = this.state;
    const category = device.model;

    const deviceExternalId = `broadlink:${device.id}`;

    const params = [
      {
        name: PARAMS.PERIPHERAL,
        value: peripheral
      }
    ];

    const remoteButtons = FEATURES_BY_CATEGORY[category];

    const features = [];
    const alreadyManagedFeatures = new Set();
    Object.keys(buttons).forEach(key => {
      const code = buttons[key];
      const { type, feature } = remoteButtons[key];
      const featureExternalId = `${deviceExternalId}:${type}`;

      params.push({
        name: `${PARAMS.CODE}${key}`,
        value: code
      });

      if (!alreadyManagedFeatures.has(type)) {
        const name = get(this.context.intl.dictionary, `deviceFeatureCategory.${category}.${type}`);
        features.push({
          name,
          external_id: featureExternalId,
          selector: featureExternalId,
          category,
          type,
          read_only: false,
          keep_history: false,
          has_feedback: true,
          min: 0,
          max: 0,
          ...feature
        });

        alreadyManagedFeatures.add(type);
      }
    });

    const deviceToCreate = {
      ...device,
      external_id: deviceExternalId,
      selector: deviceExternalId,
      service_id: this.props.currentIntegration.id,
      model: category,
      features,
      params
    };

    try {
      await this.props.httpClient.post('/api/v1/device', deviceToCreate);
      this.setState({
        saveStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        saveStatus: RequestStatus.Error
      });
    }
  };

  storeButtonCode = code => {
    let { selectedButton = {}, learnAllMode } = this.state;

    const buttons = update(this.state.buttons, {
      [selectedButton.key]: {
        $set: code
      }
    });

    let toLearn = [];
    if (learnAllMode) {
      toLearn = this.state.toLearn.slice(1);

      learnAllMode = toLearn.length > 0;

      if (learnAllMode) {
        selectedButton = toLearn[0];
      }
    }

    this.setState({
      buttons,
      toLearn,
      learnAllMode,
      selectedButton
    });
  };

  learnAll = () => {
    const { model } = this.state.device;
    const buttons = FEATURE_LIST_BY_CATEGORY[model] || [];

    this.setState({
      learnAllMode: true,
      toLearn: buttons,
      selectedButton: buttons[0]
    });
  };

  quitLearnMode = () => {
    this.setState({
      learnAllMode: false,
      toLearn: [],
      selectedButton: undefined
    });
  };

  selectButton = (feature, value) => {
    const { device } = this.state;
    const buttons = FEATURES_BY_CATEGORY[device.model];
    const selectedButton = buttons[`${feature}-${value}`] || buttons[feature];

    this.setState({
      selectedButton
    });
  };

  deleteButton = () => {
    const { selectedButton = {}, buttons } = this.state;

    const newButtons = update(buttons, {
      $unset: [selectedButton.key]
    });

    this.setState({
      buttons: newButtons,
      selectedButton: undefined
    });
  };

  constructor(props) {
    super(props);

    const { device } = props;

    const buttons = {};
    const { params = [] } = device;

    let peripheral = props.peripheral;
    params.forEach(param => {
      const { name, value } = param;

      if (name.startsWith(PARAMS.CODE)) {
        const buttonName = name.replace(PARAMS.CODE, '');
        buttons[buttonName] = value;
      } else if (name === PARAMS.PERIPHERAL) {
        peripheral = value;
      }
    });

    this.state = {
      device,
      buttons,
      peripheral
    };
  }

  render(
    { houses = [], broadlinkPeripherals = [], ...props },
    { device, selectedButton, buttons = {}, learnAllMode, peripheral, saveStatus }
  ) {
    const canSave = Object.keys(buttons).length === 0 || !device.name;

    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{device.name || <Text id="integration.broadlink.setup.noNameLabel" />}</h3>
        </div>
        <div class="card-body">
          {saveStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="integration.broadlink.setup.saveError" />
            </div>
          )}

          {saveStatus === RequestStatus.Success && <RemoteCreationSuccess />}

          {saveStatus !== RequestStatus.Success && (
            <div>
              <div class="form-group">
                <label class="form-label" for="remoteName">
                  <Text id="integration.broadlink.remote.nameLabel" />
                </label>
                <Localizer>
                  <input
                    type="text"
                    value={device.name}
                    onInput={this.updateDeviceName}
                    class="form-control"
                    placeholder={<Text id="integration.broadlink.remote.namePlaceholder" />}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label class="form-label" for="remoteRoom">
                  <Text id="integration.broadlink.remote.roomLabel" />
                </label>
                <select onChange={this.updateDeviceRoom} class="form-control">
                  <option value="">
                    <Text id="global.emptySelectOption" />
                  </option>
                  {houses.map(house => (
                    <optgroup label={house.name}>
                      {house.rooms.map(room => (
                        <option selected={room.id === device.room_id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="remotePeripheral">
                  <Text id="integration.broadlink.setup.peripheralLabel" />
                </label>
                <select onChange={this.updatePeripheralModel} class="form-control">
                  <option value="" disabled selected={!peripheral}>
                    <Text id="global.emptySelectOption" />
                  </option>
                  {broadlinkPeripherals.map(peripheral => (
                    <option selected={peripheral.mac === peripheral} value={peripheral.mac}>
                      <Text
                        id="integration.broadlink.setup.peripheralSelectLabel"
                        fields={{
                          name: peripheral.name,
                          address: peripheral.address
                        }}
                      />
                    </option>
                  ))}
                </select>
              </div>

              <RemoteControlSelector
                remoteType={device.model}
                updateRemoteType={this.updateDeviceModel}
                disabled={!peripheral}
              />

              {device.model && (
                <RemoteButtonEditionPanel
                  {...props}
                  device={device}
                  peripheral={peripheral}
                  selectedButton={selectedButton}
                  buttons={buttons}
                  learnAllMode={learnAllMode}
                  selectButton={this.selectButton}
                  learnAll={this.learnAll}
                  storeButtonCode={this.storeButtonCode}
                  quitLearnMode={this.quitLearnMode}
                  deleteButton={this.deleteButton}
                />
              )}

              <div class="row mt-5">
                <div class="col">
                  <button onClick={this.saveDevice} disabled={canSave} class="btn btn-success mr-2">
                    <Text id="integration.broadlink.setup.saveButton" />
                  </button>
                </div>
                <div class="col text-right">
                  <Link
                    href={`/dashboard/integration/device/broadlink${props.peripheral ? '/peripheral' : ''}`}
                    class="mr-2"
                  >
                    <button class="btn btn-danger">
                      <Text id="integration.broadlink.setup.cancel" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default RemoteCreation;
