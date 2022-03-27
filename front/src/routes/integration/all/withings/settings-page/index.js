import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from './actions';
import actionsWithingsDevice from '../device-page/actions';
import actionsOAuth2 from '../../../../../components/oauth2/actions';
import WithingsPage from '../WithingsPage';
import OAuth2Config from '../../../../../components/oauth2/OAuth2Config';
import { RequestStatus } from '../../../../../utils/consts';
import { combineActions } from '../../../../../utils/combineActions';
import Device from '../device-page/Device';

@connect(
  'user,session,clientIdInDb,withingsSaveStatus,oauth2GetStatus,oauth2ErrorMsg,houses,withingsClientId,withingsGetStatus,withingsImgMap,withingsDevices',
  combineActions(actions, actionsOAuth2, actionsWithingsDevice)
)
class WithingsSettingsPage extends Component {
  componentWillMount() {
    this.props.updateIntegrationName('withings');
    this.props.getCurrentConfig();
    this.props.initWithingsDevices();
  }

  render(props, {}) {
    const loading = props.oauth2GetStatus === RequestStatus.Getting;
    return (
      <WithingsPage user={props.user} {...props} loading={loading}>
        <OAuth2Config integrationName="withings" user={props.user} {...props}>
          {props.withingsDevices && (
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <Text id="integration.withings.device.title" />
                </h3>
              </div>
              <div class="card-body">
                <div class="alert alert-info">
                  <Text id="integration.withings.settings.chooseDevice" />
                </div>
                <div class="row">
                  {props.withingsDevices.map((withingsDevice, index) => (
                    <Device
                      device={withingsDevice}
                      deviceIndex={index}
                      houses={props.houses}
                      updateDeviceProperty={props.updateDeviceProperty}
                      saveDevice={props.saveDevice}
                      deleteDevice={props.deleteDevice}
                      user={props.user}
                      settingsPage
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </OAuth2Config>
      </WithingsPage>
    );
  }
}

export default WithingsSettingsPage;
