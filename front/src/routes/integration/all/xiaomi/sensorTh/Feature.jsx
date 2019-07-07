import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

class Feature extends Component {
  componentWillMount() {}

  updateFeatureName = e => {
    this.props.updateNameFeature(this.props.deviceIndex, this.props.featureIndex, 'name', e.target.value);
  };

  render(props, { loading, saveError, testConnectionError }) {
    return (
      <div class="form-group">
        {this.props.feature.unit && this.props.feature.unit === 'celsius' && (
          <label>
            <Text id="integration.xiaomi.nameLabelTemperature" />
          </label>
        )}
        {this.props.feature.unit && this.props.feature.unit === '%' && (
          <label>
            <Text id="integration.xiaomi.nameLabelHumidity" />
          </label>
        )}
        <Localizer>
          <input
            type="text"
            value={this.props.feature.name}
            onInput={this.updateFeatureName}
            class="form-control"
            placeholder={<Text id="integration.xiaomi.nameLabelFeature" />}
          />
        </Localizer>
      </div>
    );
  }
}

export default Feature;
