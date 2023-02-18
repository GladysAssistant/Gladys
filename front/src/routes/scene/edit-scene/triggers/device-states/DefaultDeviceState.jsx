import { Component, Fragment } from 'preact';
import { Text, Localizer } from 'preact-i18n';

class DefaultDeviceState extends Component {
  handleOperatorChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'operator', e.target.value);
  };

  handleValueChange = e => {
    let value = e.target.value;
    if (value.includes(',')) {
      value = value.replaceAll(',', '.');
    }
    const lastCharacter = value.length > 0 ? value[value.length - 1] : '';
    if (!isNaN(parseFloat(e.target.value)) && lastCharacter !== '.') {
      this.props.updateTriggerProperty(this.props.index, 'value', parseFloat(value));
    } else {
      this.props.updateTriggerProperty(this.props.index, 'value', value);
    }
  };

  render({ selectedDeviceFeature, trigger }) {
    return (
      <Fragment>
        <div class="col-md-3">
          <div class="form-group">
            <select class="form-control" onChange={this.handleOperatorChange} value={trigger.operator}>
              <option value="">
                <Text id="global.emptySelectOption" />
              </option>
              <option value="=">
                <Text id="editScene.triggersCard.newState.equal" />
              </option>
              <option value=">=">
                <Text id="editScene.triggersCard.newState.superiorOrEqual" />
              </option>
              <option value=">">
                <Text id="editScene.triggersCard.newState.superior" />
              </option>
              <option value="!=">
                <Text id="editScene.triggersCard.newState.different" />
              </option>
              <option value="<=">
                <Text id="editScene.triggersCard.newState.lessOrEqual" />
              </option>
              <option value="<">
                <Text id="editScene.triggersCard.newState.less" />
              </option>
            </select>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <div class="input-group">
              <Localizer>
                <input
                  type="text"
                  class="form-control"
                  placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                  value={trigger.value}
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
      </Fragment>
    );
  }
}

export default DefaultDeviceState;
