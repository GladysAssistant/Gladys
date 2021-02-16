import { Text, Localizer } from 'preact-i18n';
import actions from './actions';
import { connect } from 'unistore/preact';
import { Component } from 'preact';

import style from '../style.css';

const RenderCommandGlobal = ({ children, ...props }) => {
  function updateValue() {
    props.updateValue(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      props.deviceFeature.last_value === 0 ? 1 : 0
    );
  }

  return (
    <Localizer>
      <tr class={props.styleTest} title={props.title}>
        <td>
          <i class="fe fe-toggle-right" />
        </td>
        <td>{props.deviceFeature.name}</td>
        <td class="text-right">
          <label class="custom-switch">
            <input
              type="radio"
              name={props.deviceFeature.id}
              value="1"
              class="custom-switch-input"
              checked={props.deviceFeature.last_value}
              onClick={updateValue}
              disabled="disabled"
            />
            <Localizer>
              <span class="custom-switch-indicator" title={<Text id="integration.netatmo.box.noCommand" />} />
            </Localizer>
          </label>
        </td>
      </tr>
    </Localizer>
  );
};

@connect('session,httpClient,user', actions)
class BinaryDeviceType extends Component {
  async getNetatmoConnect(netatmoIsConnect) {
    netatmoIsConnect = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_IS_CONNECT');
    this.setState({ netatmoIsConnect }, () => {
      netatmoIsConnect;
    });
  }
  componentWillMount() {
    this.getNetatmoConnect();
  }

  render({ children, ...props }, { netatmoIsConnect }) {
    if (netatmoIsConnect && netatmoIsConnect.value === 'disconnect') {
      return (
        <RenderCommandGlobal
          {...props}
          netatmoIsConnect={netatmoIsConnect}
          styleTest={style.opacityLegerdisconnect}
          title={<Text id={`integration.netatmo.box.disconnect`} />}
        />
      );
    }
    return <RenderCommandGlobal {...props} netatmoIsConnect={netatmoIsConnect} />;
  }
}

export default BinaryDeviceType;
