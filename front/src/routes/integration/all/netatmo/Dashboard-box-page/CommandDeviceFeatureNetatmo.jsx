import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { NETATMO_VALUES } from '../../../../../../../server/services/netatmo/lib/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import actions from '../../../../../actions/dashboard/boxes/camera';
import { connect } from 'unistore/preact';
import { Component } from 'preact';

import style from './style.css';

const RenderCommandGlobal = ({ children, ...props }) => {
  return (
    <Localizer>
      <tr class={props.styleTest} title={props.title}>
        <td>
          <i
            class={`mr-2 fe fe-${get(
              DeviceFeatureCategoriesIcon,
              `${props.deviceFeature.category}.${props.deviceFeature.type}`
            )}`}
          />
        </td>
        <td>{props.deviceFeature.name}</td>

        {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
          props.deviceFeature.type === DEVICE_FEATURE_TYPES.LIGHT.STRING && (
            <td class="text-right" style="padding-top: 0px; padding-bottom: 0px">
              <div class="form-group">
                <Localizer>
                  <select
                    style={{ minWidth: '80px' }}
                    onChange={''}
                    class="form-control"
                    title={<Text id="integration.netatmo.box.noCommand" />}
                  >
                    {props.netatmoSecurityLight.map(light => (
                      <Localizer>
                        <option
                          selected={light === props.deviceFeature.last_value}
                          value={light}
                          disabled
                          title={<Text id="integration.netatmo.box.noCommand" />}
                        >
                          {<Text id={`integration.netatmo.DeviceFeatureValues.security.light.${light}`} />}
                        </option>
                      </Localizer>
                    ))}
                  </select>
                </Localizer>
              </div>
            </td>
          )}
      </tr>
    </Localizer>
  );
};

@connect('session,httpClient,user', actions)
class CommandDeviceFeature extends Component {
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
    const netatmoSecurityLight = [];
    Object.keys(NETATMO_VALUES.SECURITY.LIGHT).forEach(key => {
      netatmoSecurityLight.push(NETATMO_VALUES.SECURITY.LIGHT[key]);
    });
    if (netatmoIsConnect && netatmoIsConnect.value === 'disconnect') {
      return (
        <RenderCommandGlobal
          {...props}
          netatmoSecurityLight={netatmoSecurityLight}
          netatmoIsConnect={netatmoIsConnect}
          styleTest={style.opacityLegerdisconnect}
          title={<Text id={`integration.netatmo.box.disconnect`} />}
        />
      );
    }
    return (
      <RenderCommandGlobal {...props} netatmoSecurityLight={netatmoSecurityLight} netatmoIsConnect={netatmoIsConnect} />
    );
  }
}

export default CommandDeviceFeature;
