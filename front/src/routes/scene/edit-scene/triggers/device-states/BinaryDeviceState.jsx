import { Component, Fragment } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import style from '../style.css';

class BinaryDeviceState extends Component {
  handleValueChangeBinary = newValue => () => {
    this.props.updateTriggerProperty(this.props.index, 'value', newValue);
  };

  getBinaryButton = (category, type, value) => {
    // Some categories hold several binary types with their own labels (ex: water-valve),
    // in that case prefer the type-specific translation over the generic category one.
    const customText = get(this.props.intl.dictionary, `deviceFeatureValue.category.${category}.${type}`);

    return (
      <div class="col-6 d-flex">
        <button
          class={cx('btn', 'btn-block', 'p-1', style.deviceStateButton, {
            'btn-primary': this.props.trigger.value === value,
            'btn-outline-primary': this.props.trigger.value !== value,
            active: this.props.trigger.value === value
          })}
          onClick={this.handleValueChangeBinary(value)}
        >
          <Text id={`deviceFeatureValue.category.${category}.binary`} plural={value}>
            {!customText && <Text id={`editScene.triggersCard.newState.${value ? 'on' : 'off'}`} />}
            {customText && <Text id={`deviceFeatureValue.category.${category}.${type}.${value}`} />}
          </Text>
        </button>
      </div>
    );
  };

  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');
  }

  render({ selectedDeviceFeature }) {
    const { category, type } = selectedDeviceFeature;

    return (
      <Fragment>
        <div class="col-12 col-md-1">
          <div class="text-center">
            <i
              class="fe fe-arrow-down d-block d-xs-none d-sm-none"
              style={{ fontSize: '20px', marginBottom: '15px' }}
            />
            <i class="fe fe-arrow-right d-none d-xs-block d-sm-block" style={{ fontSize: '20px', marginTop: '10px' }} />
          </div>
        </div>
        <div class="col-12 col-md-5">
          <div class="form-group mt-1">
            <div class="row d-flex justify-content-center">
              {this.getBinaryButton(category, type, 1)}
              {this.getBinaryButton(category, type, 0)}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withIntlAsProp(BinaryDeviceState);
