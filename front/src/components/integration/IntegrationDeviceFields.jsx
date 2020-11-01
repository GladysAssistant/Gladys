import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';

import { DeviceFeatureCategoriesIcon } from '../../utils/consts';

@connect('httpClient,user')
class IntegrationDeviceFields extends Component {
  constructor(props) {
    super(props);

    const { device } = props;
    const { features = [] } = device;

    let mostRecentValueAt = null;
    features
      .filter(feature => feature.last_value_changed)
      .forEach(feature => {
        const changeDate = new Date(feature.last_value_changed);
        if (changeDate > mostRecentValueAt) {
          mostRecentValueAt = changeDate;
        }
      });

    this.state = {
      mostRecentValueAt
    };
  }

  render({ children, disableForm, houses = [], user, device, updateName, updateRoom }, { mostRecentValueAt }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editDeviceForm.nameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              value={device.name}
              onInput={updateName}
              disabled={disableForm}
              class="form-control"
              placeholder={<Text id="editDeviceForm.namePlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editDeviceForm.roomLabel" />
          </label>
          <select onChange={updateRoom} class="form-control" disabled={disableForm}>
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
        {children}
        <div class="form-group">
          <label class="form-label">
            <Text id="editDeviceForm.featuresLabel" />
          </label>
          {device.features && (
            <div class="tags">
              {device.features.map(feature => (
                <span class="tag">
                  <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                  <div class="tag-addon">
                    <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
                  </div>
                </span>
              ))}
            </div>
          )}
          {(!device.features || device.features.length === 0) && (
            <div class="text-center font-italic mt-3 featureList">
              <Text id="editDeviceForm.noFeatures" />
            </div>
          )}
        </div>
        <div class="form-group mt-4">
          {mostRecentValueAt && (
            <Text
              id="editDeviceForm.mostRecentValueAt"
              fields={{
                mostRecentValueAt: dayjs(mostRecentValueAt)
                  .locale(user.language)
                  .fromNow()
              }}
            />
          )}
          {!mostRecentValueAt && <Text id="editDeviceForm.noValueReceived" />}
        </div>
      </div>
    );
  }
}

export default IntegrationDeviceFields;
