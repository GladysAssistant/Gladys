import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import RemoteControlSelector from '../../../../../../components/remote-control/RemoteControlSelector';
import RemoteControlLayout from '../../../../../../components/remote-control/RemoteControlLayout';
import LearningMode from './LearningMode';
import ButtonBox from '../../../../../../components/remote-control/ButtonBox';
import ButtonOptions from '../../../../../../components/remote-control/templates';

class RemoteCreation extends Component {
  updateDeviceName = e => {
    this.props.updateDeviceProperty('name', e.target.value);
  };

  updateDeviceRoom = e => {
    this.props.updateDeviceProperty('room_id', e.target.value);
  };

  updatePeripheralModel = e => {
    const peripheralName = e.target.value;
    const selectedModel = this.props.broadlinkPeripherals.find(p => p.name === peripheralName);
    const newState = {
      selectedModel
    };
    this.props.updateState(newState);
  };

  updateDeviceType = remoteType => {
    this.props.updateState({
      selectedRemoteType: remoteType
    });
  };

  render(props) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label" for="remoteName">
            <Text id="integration.broadlink.remote.nameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              id="remoteName"
              value={props.device.name}
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
          <select onChange={this.updateDeviceRoom} class="form-control" id="remoteRoom">
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {props.houses &&
              props.houses.map(house => (
                <optgroup label={house.name}>
                  {house.rooms.map(room => (
                    <option selected={room.id === props.device.room_id} value={room.id}>
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
          <select onChange={this.updatePeripheralModel} class="form-control" id="remotePeripheral">
            <option value="" disabled selected={!props.selectedModel}>
              <Text id="global.emptySelectOption" />
            </option>
            {props.broadlinkPeripherals &&
              props.broadlinkPeripherals.map(peripheral => (
                <option
                  selected={props.selectedModel && peripheral.mac === props.selectedModel.mac}
                  value={peripheral.name}
                >
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
          remoteType={props.selectedRemoteType}
          updateRemoteTypeAndButtons={this.updateDeviceType}
        />

        {props.selectedRemoteType && (
          <div class="row">
            <div class="col-sm-4">
              <Localizer>
                <RemoteControlLayout
                  remoteType={props.selectedRemoteType}
                  remoteName={props.device.name || <Text id="integration.broadlink.setup.noNameLabel" />}
                  onClick={props.selectButton}
                  editionMode
                  featureByType={props.buttons}
                />
              </Localizer>
            </div>

            <div class="col-sm-8 mb-5">
              {!props.selectedButton && (
                <div>
                  <div class="alert alert-secondary">
                    <Text id="integration.broadlink.setup.selectButtonLabel" />
                  </div>
                  <div class="d-flex justify-content-center">
                    <button class="btn btn-primary" onClick={props.learnAll}>
                      <Text id="integration.broadlink.setup.learnAllLabel" />
                    </button>
                  </div>
                </div>
              )}
              {props.selectedButton && (
                <div class="text-center">
                  <div class="form-group">
                    <label class="form-label" for="remotePeripheral">
                      <Text id="integration.broadlink.setup.selectedButtonLabel" />
                    </label>

                    <ButtonBox
                      category={props.selectedRemoteType}
                      featureName={props.selectedButton}
                      buttonProps={ButtonOptions[props.selectedRemoteType][props.selectedButton]}
                      edited
                    />
                    <span class="ml-3">
                      <Text id={`deviceFeatureCategory.${props.selectedRemoteType}.${props.selectedButton}`}>
                        {props.selectedButton}
                      </Text>
                    </span>
                  </div>

                  <LearningMode {...props} />

                  {props.learnAllMode && (
                    <div class="d-flex justify-content-around mt-3">
                      <button class="btn btn-danger" onClick={props.quitLearnMode}>
                        <Text id="integration.broadlink.setup.quitLearnModeLabel" />
                      </button>
                    </div>
                  )}

                  {!props.learnAllMode && (
                    <div class="d-flex justify-content-around mt-3">
                      <button class="btn btn-warning" onClick={props.selectButton}>
                        <Text id="integration.broadlink.setup.cancel" />
                      </button>

                      <button
                        class="btn btn-success"
                        onClick={props.testSelectedButton}
                        disabled={!props.buttons[props.selectedButton]}
                      >
                        <Text id="integration.broadlink.setup.testLabel" />
                      </button>

                      <button
                        class="btn btn-danger"
                        onClick={props.deleteButton}
                        disabled={!props.buttons[props.selectedButton]}
                      >
                        <Text id="integration.broadlink.setup.deleteLabel" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default RemoteCreation;
