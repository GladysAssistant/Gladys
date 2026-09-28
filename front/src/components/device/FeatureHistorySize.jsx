import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import formatBytes from '../../utils/formatBytes';

// All the features of a device page mount together: they share one request
// for the whole device, forgotten once answered so a later visit asks again.
const requestsByDeviceSelector = new Map();
const getDeviceStatesSize = (httpClient, deviceSelector) => {
  if (!requestsByDeviceSelector.has(deviceSelector)) {
    const request = (async () => {
      try {
        return await httpClient.get(`/api/v1/device/${deviceSelector}/states_size`);
      } finally {
        requestsByDeviceSelector.delete(deviceSelector);
      }
    })();
    requestsByDeviceSelector.set(deviceSelector, request);
  }
  return requestsByDeviceSelector.get(deviceSelector);
};

// How much history a feature holds, shown next to the "keep history" switch
// that controls it, so the user can tell which features are worth keeping.
// It is only an information: while it loads, or when it cannot be loaded,
// nothing is displayed.
class FeatureHistorySize extends Component {
  getStatesSize = async () => {
    const { device, feature } = this.props;
    // a device or a feature that is not saved yet has no history
    if (!device || !device.id || !device.selector || !feature.id) {
      return;
    }
    try {
      const deviceStatesSize = await getDeviceStatesSize(this.props.httpClient, device.selector);
      const statesSize = deviceStatesSize.features.find(
        featureStatesSize => featureStatesSize.device_feature_selector === feature.selector
      );
      this.setState({ statesSize });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getStatesSize();
  }

  render(props, { statesSize }) {
    if (!statesSize) {
      return null;
    }
    const language = props.user && props.user.language;
    return (
      <small class={cx('d-block', 'text-muted', props.class)}>
        {statesSize.states > 0 ? (
          <Text
            id="deviceFeatureHistorySize.size"
            plural={statesSize.states}
            fields={{
              count: statesSize.states.toLocaleString(language),
              size: formatBytes(statesSize.estimated_size_in_bytes, language)
            }}
          />
        ) : (
          <Text id="deviceFeatureHistorySize.empty" />
        )}
      </small>
    );
  }
}

export default connect('httpClient,user', {})(FeatureHistorySize);
