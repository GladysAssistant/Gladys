import { Component, Fragment } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

class BinaryDeviceState extends Component {
  handleValueChangeBinary = newValue => () => {
    this.props.updateTriggerProperty(this.props.index, 'value', newValue);
  };

  getBinaryButton = (category, value) => (
    <div class="col-6">
      <button
        class={cx('btn', 'btn-block', 'p-1', {
          'btn-primary': this.props.trigger.value === value,
          'btn-outline-primary': this.props.trigger.value !== value,
          active: this.props.trigger.value === value
        })}
        onClick={this.handleValueChangeBinary(value)}
      >
        <Text id={`deviceFeatureValue.category.${category}.binary`} plural={value}>
          <Text id={`editScene.triggersCard.newState.${value ? 'on' : 'off'}`} />
        </Text>
      </button>
    </div>
  );

  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');
  }

  render({ selectedDeviceFeature }) {
    const { category } = selectedDeviceFeature;

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
              {this.getBinaryButton(category, 1)}
              {this.getBinaryButton(category, 0)}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default BinaryDeviceState;
