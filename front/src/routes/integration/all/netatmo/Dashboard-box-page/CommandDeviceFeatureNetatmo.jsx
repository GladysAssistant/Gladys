import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { NETATMO_VALUES } from '../../../../../../../server/services/netatmo/lib/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import actions from './actions';
import { connect } from 'unistore/preact';
import { Component } from 'preact';

import style from '../style.css';

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
            <td class="align-self-center" style="padding-bottom: 0px">
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
        {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SETPOINT &&
          props.deviceFeature.type === DEVICE_FEATURE_TYPES.SETPOINT.DECIMAL && (
            <td class="align-self-center" style="padding-bottom: 0px">
              <div class="page-options form-group text-right">
                <Localizer>
                  <input
                    readonly="readonly"
                    class="form-control text-center"
                    value={`${props.deviceFeature.last_value} °C`}
                    style={{ minWidth: '80px' }}
                    title={<Text id="integration.netatmo.box.noCommand" />}
                  />
                </Localizer>
              </div>
            </td>
          )}
        {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SETPOINT &&
          props.deviceFeature.type === DEVICE_FEATURE_TYPES.SETPOINT.STRING && (
            <td class="align-self-center" style="padding-bottom: 0px">
              <div class="form-group">
                <Localizer>
                  <select
                    style={{ minWidth: '80px' }}
                    onChange={''}
                    class="form-control"
                    title={<Text id="integration.netatmo.box.noCommand" />}
                  >
                    {props.netatmoSetpointMode.map(mode => (
                      <Localizer>
                        <option
                          selected={mode === props.deviceFeature.last_value}
                          value={mode}
                          disabled
                          title={<Text id="integration.netatmo.box.noCommand" />}
                        >
                          {<Text id={`integration.netatmo.DeviceFeatureValues.energy.setpointmode.${mode}`} />}
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
    const netatmoSetpointMode = [];
    Object.keys(NETATMO_VALUES.ENERGY.SETPOINT_MODE).forEach(key => {
      const indexNetatmoSetpointMode = netatmoSetpointMode.findIndex(
        element => element === NETATMO_VALUES.ENERGY.SETPOINT_MODE[key]
      );
      if (indexNetatmoSetpointMode === -1) {
        netatmoSetpointMode.push(NETATMO_VALUES.ENERGY.SETPOINT_MODE[key]);
      }
    });
    if (netatmoIsConnect && netatmoIsConnect.value === 'disconnect') {
      return (
        <RenderCommandGlobal
          {...props}
          netatmoSecurityLight={netatmoSecurityLight}
          netatmoSetpointMode={netatmoSetpointMode}
          netatmoIsConnect={netatmoIsConnect}
          styleTest={style.opacityLegerdisconnect}
          title={<Text id={`integration.netatmo.box.disconnect`} />}
        />
      );
    }
    return (
      <RenderCommandGlobal
        {...props}
        netatmoSecurityLight={netatmoSecurityLight}
        netatmoSetpointMode={netatmoSetpointMode}
        netatmoIsConnect={netatmoIsConnect}
      />
    );
  }
}

export default CommandDeviceFeature;
