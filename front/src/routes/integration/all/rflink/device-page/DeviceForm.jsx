import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import { DEVICE_MODELS_LIST } from '../../../../../../../server/utils/constants';
import get from 'get-value';

class RflinkDeviceForm extends Component {
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  updateModel = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'model', e.target.value);
  };
  checkModel = e => {


    for (let i=0;i<DEVICE_MODELS_LIST.length;i++) {
        if (e === DEVICE_MODELS_LIST[`${i}`]) {
          return true;
        }

    }


    DEVICE_MODELS_LIST.forEach((model) => {
        if(e === model) {
          return true;
        }
    })
  };

  updateExternalId = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'external_id', e.target.value);
  };
  render({ ...props }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label" for="deviceName">
            <Text id="integration.rflink.device.nameLabel" />
          </label>
          <Localizer>
            <input
              id="deviceName"
              type="text"
              value={props.device.name}
              onInput={this.updateName}
              class="form-control"
              placeholder={<Text id="integration.rflink.device.nameLabel" />}
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label class="form-label" for="room">
            <Text id="integration.rflink.device.roomLabel" />
          </label>
          <select onChange={this.updateRoom} class="form-control" id="room">
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

        {(props.device.model === undefined || this.checkModel(props.device.model) === true) && (
          <div class="form-group">
            <label class="form-label" for="model">
              <Text id="integration.rflink.feature.model" />
            </label>
            <select onChange={this.updateModel} class="form-control" id="room">
              <option value="">
                <Text id="global.emptySelectOption" />
              </option>
              {DEVICE_MODELS_LIST.map(model => (
                <option selected={model === props.device.model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        )}
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.rflink.device.featuresLabel" />
          </label>
          <div class="tags">
            {props.device &&
              props.device.features &&
              props.device.features.map(feature => (
                <span class="tag">
                  <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                  <div class="tag-addon">
                    <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
                  </div>
                </span>
              ))}
            {(!props.device.features || props.device.features.length === 0) && (
              <Text id="integration.rflink.device.noFeatures" />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default RflinkDeviceForm;
