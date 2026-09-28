import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import formatBytes from '../../utils/formatBytes';

// How much history a feature holds, shown next to the "keep history" switch
// that controls it, so the user can tell which features are worth keeping.
// It is only an information: while it loads, or when it cannot be loaded,
// nothing is displayed.
class FeatureHistorySize extends Component {
  getStatesSize = async () => {
    const { feature } = this.props;
    // a feature that is not saved yet has no history
    if (!feature.id || !feature.selector) {
      return;
    }
    try {
      const statesSize = await this.props.httpClient.get(`/api/v1/device_feature/${feature.selector}/states_size`);
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
    return (
      <small class={cx('d-block', 'text-muted', props.class)}>
        {statesSize.states > 0 ? (
          <Text
            id="deviceFeatureHistorySize.size"
            plural={statesSize.states}
            fields={{
              count: statesSize.states.toLocaleString(),
              size: formatBytes(statesSize.estimated_size_in_bytes)
            }}
          />
        ) : (
          <Text id="deviceFeatureHistorySize.empty" />
        )}
      </small>
    );
  }
}

export default connect('httpClient', {})(FeatureHistorySize);
