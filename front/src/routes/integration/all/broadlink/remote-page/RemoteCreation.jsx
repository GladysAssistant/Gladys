import { Component, Fragment } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import update from 'immutability-helper';
import get from 'get-value';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

import { PARAMS } from '../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';
import RemoteFeatureEditionPanel from './RemoteFeatureEditionPanel';
import { MANAGED_CATEGORIES, MANAGED_FEATURES } from './features';
import RemoteFeatureTag from './edition/RemoteFeatureTag';

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

  updateDeviceModel = e => {
    const model = e.target.value;
    const { device } = this.state;
    if (device.model !== model) {
      this.setState({ device: { ...device, model }, selectedFeature: undefined });
    }
  };

  updatePeripheralModel = e => {
    const peripheral = e.target.value;
    if (this.state.peripheral !== peripheral) {
      this.setState({ peripheral, selectedFeature: undefined });
    }
  };

  updateFeature = (type, updatedFeature) => {
    const editedFeatures = update(this.state.editedFeatures, {
      [type]: {
        $set: updatedFeature
      }
    });
    this.setState({ editedFeatures });
  };

  selectValue = selectedValue => {
    this.setState({ selectedValue });
  };

  saveDevice = async () => {
    this.setState({
      saveStatus: RequestStatus.Getting
    });

    const { device, editedFeatures, peripheral } = this.state;
    const category = device.model;

    const deviceExternalId = `broadlink:${device.id}`;

    const params = [
      {
        name: PARAMS.PERIPHERAL,
        value: peripheral
      },
      {
        name: PARAMS.REMOTE_TYPE,
        value: category
      }
    ];

    const remoteFeatures = MANAGED_FEATURES[category];

    const deviceFeatures = [];

    Object.keys(editedFeatures).forEach(type => {
      const { feature, codes } = editedFeatures[type];
      const { feature: defaultFeature = {} } = remoteFeatures[type];
      const featureExternalId = `${deviceExternalId}:${type}`;

      let nbCodes = 0;
      Object.keys(codes).forEach(codeKey => {
        params.push({
          name: `${PARAMS.IR_CODE}${codeKey}`,
          value: codes[codeKey]
        });

        nbCodes += 1;
      });

      if (nbCodes > 0) {
        const name = get(this.props.intl.dictionary, `deviceFeatureCategory.${category}.${type}`);
        deviceFeatures.push({
          name,
          external_id: featureExternalId,
          selector: featureExternalId,
          category,
          type,
          read_only: false,
          keep_history: false,
          has_feedback: true,
          min: defaultFeature.min || 0,
          max: defaultFeature.max || 1,
          ...feature
        });
      }
    });

    const deviceToCreate = {
      ...device,
      external_id: deviceExternalId,
      selector: deviceExternalId,
      service_id: this.props.currentIntegration.id,
      model: category,
      features: deviceFeatures,
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

  prepareEditedFeature = feature => {
    const editedFeature = this.state.editedFeatures[feature] || {};
    return { codes: {}, ...editedFeature };
  };

  storeFeatureCode = code => {
    let { selectedFeature, learnAllMode, selectedValue, toLearn = [], editedFeatures } = this.state;

    let codeName = selectedFeature;
    if (selectedValue !== undefined) {
      codeName = `${selectedFeature}-${selectedValue}`;
    }

    if (code) {
      // Save new code
      const editedFeature = this.prepareEditedFeature(selectedFeature);
      editedFeature.codes[codeName] = code;

      editedFeatures = update(editedFeatures, {
        [selectedFeature]: {
          $set: editedFeature
        }
      });
    } else {
      // Clear saved code
      editedFeatures = editedFeatures = update(editedFeatures, {
        $unset: [selectedFeature]
      });
    }

    if (learnAllMode) {
      const [current] = toLearn;
      selectedFeature = current.key;
      const { values } = current;

      // On first feature to learn, check if there is missing values
      if (values.length > 0) {
        // Select next value and pop current
        selectedValue = values.shift();
      } else {
        // Select next feature
        toLearn.shift();

        learnAllMode = toLearn.length > 0;

        if (learnAllMode) {
          const [next] = toLearn;
          selectedFeature = next.key;
          selectedValue = undefined;

          if (next.values.length > 0) {
            selectedValue = next.values.shift();
          }
        }
      }
    }

    this.setState({
      editedFeatures,
      toLearn,
      learnAllMode,
      selectedFeature,
      selectedValue
    });

    return learnAllMode;
  };

  setLearning = learning => {
    this.setState({ learning });
  };

  learnAll = () => {
    const { model } = this.state.device;
    const features = MANAGED_FEATURES[model];
    const toLearn = Object.keys(features).map(key => {
      const { values = [] } = features[key];

      return {
        key,
        values: Array.from(values)
      };
    });

    const [firstFeature = {}] = toLearn;
    const { key: selectedFeature, values } = firstFeature;
    const selectedValue = values.shift();

    this.setState({
      learning: true,
      learnAllMode: true,
      toLearn,
      selectedFeature,
      selectedValue
    });
  };

  quitLearnMode = () => {
    this.setState({
      learning: false,
      learnAllMode: false,
      toLearn: undefined,
      selectedFeature: undefined,
      selectedValue: undefined
    });
  };

  selectFeature = selectedFeature => {
    this.setState({
      selectedFeature,
      selectedValue: undefined
    });
  };

  deleteFeature = feature => {
    const editedFeatures = update(this.state.editedFeatures, {
      $unset: [feature]
    });

    this.setState({
      editedFeatures,
      selectedFeature: undefined
    });
  };

  constructor(props) {
    super(props);

    const { device, peripheral } = props;

    const { features = [], params = [] } = device;

    const editedFeatures = {};

    // Prepares existing features
    features.forEach(feature => {
      const { type } = feature;
      const codes = {};

      // Get feature codes
      const paramPrefix = `${PARAMS.IR_CODE}${type}`;
      params
        .filter(param => param.name.startsWith(paramPrefix))
        .forEach(param => {
          codes[param.name.replace(PARAMS.IR_CODE, '')] = param.value;
        });

      editedFeatures[type] = { feature, codes };
    });

    this.state = {
      device,
      editedFeatures,
      peripheral
    };
  }

  render(
    { housesWithRooms = [], broadlinkPeripherals = [], ...props },
    { device, selectedFeature, selectedValue, editedFeatures = {}, learning, learnAllMode, peripheral, saveStatus }
  ) {
    const canSave = Object.keys(editedFeatures).length === 0 || !device.name;
    const category = device.model;

    return (
      <div
        class={cx('dimmer', {
          active: saveStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card">
            <div class="card-header">
              <Link
                href={`/dashboard/integration/device/broadlink${
                  props.deviceSelector || !props.peripheral ? '' : '/peripheral'
                }`}
              >
                <button class="btn btn-secondary mr-2">
                  <Text id="global.backButton" />
                </button>
              </Link>
              <h3 class="card-title">{device.name || <Text id="integration.broadlink.setup.noNameLabel" />}</h3>
            </div>
            <div class="card-body">
              {saveStatus === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="integration.broadlink.setup.saveError" />
                </div>
              )}

              {saveStatus === RequestStatus.Success && (
                <div class="alert alert-success">
                  <Text id="integration.broadlink.setup.saveSuccess" />
                </div>
              )}

              <div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.broadlink.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={device.name}
                      onInput={this.updateDeviceName}
                      class="form-control"
                      data-cy="remote-name"
                      placeholder={<Text id="integration.broadlink.device.namePlaceholder" />}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.broadlink.device.roomLabel" />
                  </label>
                  <select onChange={this.updateDeviceRoom} class="form-control" data-cy="remote-room">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {housesWithRooms.map(house => (
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
                  <label class="form-label">
                    <Text id="integration.broadlink.setup.peripheralLabel" />
                  </label>
                  <select
                    onChange={this.updatePeripheralModel}
                    class="form-control"
                    data-cy="remote-peripheral"
                    disabled={learning}
                  >
                    <option value="" disabled selected>
                      <Text id="global.emptySelectOption" />
                    </option>
                    {broadlinkPeripherals.map(availablePeripheral => (
                      <option selected={availablePeripheral.mac === peripheral} value={availablePeripheral.mac}>
                        <Text
                          id="integration.broadlink.setup.peripheralSelectLabel"
                          fields={{
                            name: availablePeripheral.name,
                            address: availablePeripheral.address
                          }}
                        />
                      </option>
                    ))}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.broadlink.setup.categoryLabel" />
                  </label>
                  <select
                    class="form-control"
                    onChange={this.updateDeviceModel}
                    disabled={!peripheral || learning}
                    data-cy="remote-category"
                  >
                    <option value="" disabled selected={!category}>
                      <Text id="global.emptySelectOption" />
                    </option>
                    {MANAGED_CATEGORIES.map(cat => (
                      <option value={cat} selected={cat === category}>
                        <Text id={`deviceFeatureCategory.${cat}.shortCategoryName`} />
                      </option>
                    ))}
                  </select>
                </div>

                {category && (
                  <Fragment>
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.broadlink.setup.featuresLabel" />
                      </label>
                      <div class="tags">
                        {Object.keys(MANAGED_FEATURES[category]).map(type => (
                          <RemoteFeatureTag
                            disabled={learning}
                            category={category}
                            type={type}
                            editedFeature={editedFeatures[type]}
                            selected={selectedFeature === type}
                            selectFeature={this.selectFeature}
                          />
                        ))}
                      </div>
                    </div>

                    <RemoteFeatureEditionPanel
                      {...props}
                      device={device}
                      peripheral={peripheral}
                      selectedFeature={selectedFeature}
                      selectedValue={selectedValue}
                      editedFeatures={editedFeatures}
                      learnAllMode={learnAllMode}
                      learning={learning}
                      learnAll={this.learnAll}
                      storeFeatureCode={this.storeFeatureCode}
                      quitLearnMode={this.quitLearnMode}
                      deleteFeature={this.deleteFeature}
                      updateFeature={this.updateFeature}
                      selectFeature={this.selectFeature}
                      selectValue={this.selectValue}
                      setLearning={this.setLearning}
                    />
                  </Fragment>
                )}

                <div class="form-group">
                  <Link
                    href={`/dashboard/integration/device/broadlink${
                      props.deviceSelector || !props.peripheral ? '' : '/peripheral'
                    }`}
                  >
                    <button class="btn btn-secondary mr-2">
                      <Text id="global.backButton" />
                    </button>
                  </Link>
                  <button onClick={this.saveDevice} disabled={canSave || learning} class="btn btn-success mr-2">
                    <Text id="integration.broadlink.setup.saveButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(RemoteCreation);
