import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import Select from '../../../../components/form/Select';

@connect('httpClient', {})
class TurnOnLight extends Component {
  onDeviceFeatureChange = deviceFeature => {
    this.setState({ selectedDeviceFeature: deviceFeature });
    if (deviceFeature) {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', deviceFeature.selector);
      if (deviceFeature.selector !== this.props.trigger.device_feature) {
        this.props.updateTriggerProperty(this.props.index, 'value', null);
      }
    } else {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', null);
    }
    if (deviceFeature && deviceFeature.type === 'binary') {
      this.props.updateTriggerProperty(this.props.index, 'operator', '=');
    }
  };
  handleOperatorChange = operator => {
    this.props.updateTriggerProperty(this.props.index, 'operator', operator.value);
  };
  handleValueChange = e => {
    if (!isNaN(parseFloat(e.target.value))) {
      this.props.updateTriggerProperty(this.props.index, 'value', parseFloat(e.target.value));
    } else {
      this.props.updateTriggerProperty(this.props.index, 'value', null);
    }
  };
  handleValueChangeBinary = newValue => () => {
    this.props.updateTriggerProperty(this.props.index, 'value', newValue);
  };
  getBinaryOperator = () => (
    <div class="col-2">
      <div class="text-center" style={{ marginTop: '10px' }}>
        <i class="fe fe-arrow-right" style={{ fontSize: '20px' }} />
      </div>
    </div>
  );
  getBinaryButtons = () => (
    <div class="col-4">
      <div class="form-group">
        <div class="row">
          <div class="col-6">
            <button
              class={cx('btn btn-block', {
                'btn-primary': this.props.trigger.value === 1,
                'btn-outline-primary': this.props.trigger.value !== 1,
                active: this.props.trigger.value === 1
              })}
              onClick={this.handleValueChangeBinary(1)}
            >
              <Text id="editScene.triggersCard.newState.on" />
            </button>
          </div>
          <div class="col-6">
            <button
              class={cx('btn btn-block', {
                'btn-primary': this.props.trigger.value === 0,
                'btn-outline-primary': this.props.trigger.value !== 0,
                active: this.props.trigger.value === 0
              })}
              onClick={this.handleValueChangeBinary(0)}
            >
              <Text id="editScene.triggersCard.newState.off" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  render(props, { selectedDeviceFeature }) {
    return (
      <div>
        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <SelectDeviceFeature
                value={this.props.trigger.device_feature}
                onDeviceFeatureChange={this.onDeviceFeatureChange}
              />
            </div>
          </div>
          {selectedDeviceFeature && selectedDeviceFeature.type === 'binary' && this.getBinaryOperator()}
          {selectedDeviceFeature && selectedDeviceFeature.type === 'binary' && this.getBinaryButtons()}
          {selectedDeviceFeature && selectedDeviceFeature.type !== 'binary' && (
            <div class="col-3">
              <div class="form-group">
                <Select
                  onChange={this.handleOperatorChange}
                  value={props.trigger.operator}
                  uniqueKey="value"
                  options={[
                    {
                      value: '=',
                      label: <Text id="editScene.triggersCard.newState.equal" />
                    },
                    {
                      value: '>=',
                      label: <Text id="editScene.triggersCard.newState.superiorOrEqual" />
                    },
                    {
                      value: '>',
                      label: <Text id="editScene.triggersCard.newState.superior" />
                    },
                    {
                      value: '!=',
                      label: <Text id="editScene.triggersCard.newState.different" />
                    },
                    {
                      value: '<=',
                      label: <Text id="editScene.triggersCard.newState.lessOrEqual" />
                    },
                    {
                      value: '<',
                      label: <Text id="editScene.triggersCard.newState.less" />
                    }
                  ]}
                />
              </div>
            </div>
          )}
          {selectedDeviceFeature && selectedDeviceFeature.type !== 'binary' && (
            <div class="col-3">
              <div class="form-group">
                <div class="input-group">
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                      value={props.trigger.value}
                      onChange={this.handleValueChange}
                    />
                  </Localizer>
                  {selectedDeviceFeature.unit && (
                    <span class="input-group-append" id="basic-addon2">
                      <span class="input-group-text">
                        <Text id={`deviceFeatureUnitShort.${selectedDeviceFeature.unit}`} />
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TurnOnLight;
