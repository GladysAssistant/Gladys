import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

import { MANAGED_FEATURES } from '../features';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';

class RemoteFeatureEdition extends Component {
  delete = () => {
    this.props.deleteFeature(this.props.type);
  };

  test = () => {
    this.props.testFeature(this.props.type);
  };

  updateName = e => {
    const name = e.target.value;

    const { type, featureWithCodes = {} } = this.props;
    const { feature = {} } = featureWithCodes;

    const newEditedFeature = { ...featureWithCodes, feature: { ...feature, name } };

    this.props.updateFeature(type, newEditedFeature);
  };

  selectValue = selectedValue => () => {
    if (this.props.selectedValue !== selectedValue) {
      this.props.selectValue(selectedValue);
    }
  };

  deleteValue = () => {
    const { selectedValue } = this.props;

    if (selectedValue === undefined) {
      this.delete();
    } else {
      const { type, featureWithCodes = {} } = this.props;
      const { codes = {} } = featureWithCodes;
      delete codes[`${type}-${selectedValue}`];

      const newEditedFeature = { ...featureWithCodes, codes };

      this.props.updateFeature(type, newEditedFeature);
    }
  };

  render({ category, type, featureWithCodes = {}, selectedValue, disabled, displayAction }) {
    const { feature = {}, codes = {} } = featureWithCodes;
    const { name } = feature;
    const values = get(MANAGED_FEATURES, `${category}.${type}.values`, { default: [] });
    const codeExist = get(codes, `${type}-${selectedValue}`, { default: codes[type] });

    return (
      <div>
        <div class="row">
          <div class="col">
            <div class="input-icon">
              <span class="input-icon-addon">
                <i class={`fe fe-${DeviceFeatureCategoriesIcon[category][type]}`} />
              </span>
              <Localizer>
                <input
                  type="text"
                  placeholder={<Text id={`deviceFeatureCategory.${category}.${type}`} />}
                  defaultValue={name}
                  class="form-control"
                  onInput={this.updateName}
                />
              </Localizer>
            </div>
          </div>
          <div class="col btn-group">
            {values.map(value => {
              const valued = codes[`${type}-${value}`];
              const selected = selectedValue === value;

              return (
                <button
                  class={cx('btn', {
                    'btn-outline-primary': !disabled && valued,
                    'btn-outline-secondary': !disabled && !valued,
                    active: !disabled && selected,
                    'btn-primary': disabled && valued && !selected,
                    'btn-secondary': disabled && !valued && !selected,
                    'btn-dark': disabled && selected
                  })}
                  onClick={this.selectValue(value)}
                  disabled={disabled}
                >
                  <Text
                    id={`integration.broadlink.setup.features.${category}.${type}`}
                    plural={value}
                    fields={{ value }}
                  >
                    {`${value}`}
                  </Text>
                </button>
              );
            })}
          </div>
        </div>
        {displayAction && (
          <div class="d-flex justify-content-around mt-2">
            <button class="btn btn-sm btn-outline-success" onClick={this.test} disabled={!codeExist || disabled}>
              <Text id="integration.broadlink.setup.testLabel" />
            </button>

            <button class="btn btn-sm btn-outline-danger" onClick={this.deleteValue} disabled={!codeExist || disabled}>
              <Text id="integration.broadlink.setup.deleteLabel" />
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default RemoteFeatureEdition;
