import { h, Component } from 'preact';
import { Router } from 'preact-router';
import createStore from 'unistore';
import get from 'get-value';
import config from '../../config';
import { Provider, connect } from 'unistore/preact';
import { IntlProvider } from 'preact-i18n';
import translations from '../config/i18n';
import actions from '../actions/main';

import { getDefaultState } from '../utils/getDefaultState';

import Header from './header';
import Layout from './layout';
import Redirect from './router/Redirect';
import Login from '../routes/login';
import Error from '../routes/error';
import ForgotPassword from '../routes/forgot-password';
import ResetPassword from '../routes/reset-password';
import LoginGateway from '../routes/login-gateway';
import LinkGatewayUser from '../routes/gateway-setup';
import SignupGateway from '../routes/signup-gateway';
import SubscribeGateway from '../routes/subscribe-gateway';
import ConfigureTwoFactorGateway from '../routes/gateway-configure-two-factor';
import GatewayForgotPassword from '../routes/gateway-forgot-password';
import GatewayResetPassword from '../routes/gateway-reset-password';
import GatewayConfirmEmail from '../routes/gateway-confirm-email';

import SignupWelcomePage from '../routes/signup/1-welcome';
import SignupCreateAccountLocal from '../routes/signup/2-create-account-local';
import SignupCreateAccountGladysGateway from '../routes/signup/2-create-account-gladys-gateway';
import SignupPreferences from '../routes/signup/3-preferences';
import SignupConfigureHouse from '../routes/signup/4-configure-house';
import SignupSuccess from '../routes/signup/5-success';

import Dashboard from '../routes/dashboard';
import Device from '../routes/device';
import IntegrationPage from '../routes/integration';
import ChatPage from '../routes/chat';
import MapPage from '../routes/map';
import CalendarPage from '../routes/calendar';
import ScenePage from '../routes/scene';
import NewScenePage from '../routes/scene/new-scene';
import EditScenePage from '../routes/scene/edit-scene';
import TriggerPage from '../routes/trigger';
import ProfilePage from '../routes/profile';
import SettingsSessionPage from '../routes/settings/settings-session';
import SettingsHousePage from '../routes/settings/settings-house';
import SettingsSystemPage from '../routes/settings/settings-system';
import SettingsGateway from '../routes/settings/settings-gateway';
import SettingsBackup from '../routes/settings/settings-backup';
import SettingsBilling from '../routes/settings/settings-billing';
import SettingsGatewayUsers from '../routes/settings/settings-gateway-users';
import SettingsGatewayOpenApi from '../routes/settings/settings-gateway-open-api';

// Integrations
import TelegramPage from '../routes/integration/all/telegram';
import CaldavPage from '../routes/integration/all/caldav';
import DarkSkyPage from '../routes/integration/all/darksky';
import PhilipsHueSetupPage from '../routes/integration/all/philips-hue/setup-page';
import PhilipsHueDevicePage from '../routes/integration/all/philips-hue/device-page';
import ZwaveNodePage from '../routes/integration/all/zwave/node-page';
import ZwaveNetworkPage from '../routes/integration/all/zwave/network-page';
import ZwaveSettingsPage from '../routes/integration/all/zwave/settings-page';
import ZwaveSetupPage from '../routes/integration/all/zwave/setup-page';
import ZwaveNodeOperationPage from '../routes/integration/all/zwave/node-operation-page';
import ZwaveEditPage from '../routes/integration/all/zwave/edit-page';
import RtspCameraPage from '../routes/integration/all/rtsp-camera';
import XiaomiPage from '../routes/integration/all/xiaomi';
import EditXiaomiPage from '../routes/integration/all/xiaomi/edit-page';

// MQTT integration
import MqttDevicePage from '../routes/integration/all/mqtt/device-page';
import MqttDeviceSetupPage from '../routes/integration/all/mqtt/device-page/setup';
import MqttSetupPage from '../routes/integration/all/mqtt/setup-page';

// Tasmota
import TasmotaPage from '../routes/integration/all/tasmota/device-page';
import TasmotaEditPage from '../routes/integration/all/tasmota/edit-page';
import TasmotaDiscoverPage from '../routes/integration/all/tasmota/discover-page';

const defaultState = getDefaultState();
const store = createStore(defaultState);

const AppRouter = connect(
  'currentUrl,user,profilePicture,showDropDown,showCollapsedMenu,integrationCategories',
  actions
)(props => (
  <div id="app">
    <Layout currentUrl={props.currentUrl}>
      <Header
        currentUrl={props.currentUrl}
        user={props.user}
        profilePicture={props.profilePicture}
        toggleDropDown={props.toggleDropDown}
        showDropDown={props.showDropDown}
        toggleCollapsedMenu={props.toggleCollapsedMenu}
        showCollapsedMenu={props.showCollapsedMenu}
        logout={props.logout}
      />
      <Router onChange={props.handleRoute}>
        <Redirect path="/" to="/dashboard" />
        {/** ROUTE WHICH ARE DIFFERENT IN GATEWAY MODE */}
        {config.gatewayMode ? <LoginGateway path="/login" /> : <Login path="/login" />}
        {config.gatewayMode ? (
          <GatewayForgotPassword path="/forgot-password" />
        ) : (
          <ForgotPassword path="/forgot-password" />
        )}
        {config.gatewayMode ? (
          <GatewayResetPassword path="/reset-password" />
        ) : (
          <ResetPassword path="/reset-password" />
        )}
        {config.gatewayMode ? <LinkGatewayUser path="/link-gateway-user" /> : <Error type="404" default />}
        {config.gatewayMode ? <SignupGateway path="/signup-gateway" /> : <Error type="404" default />}
        {config.gatewayMode ? <SubscribeGateway path="/subscribe-gateway" /> : <Error type="404" default />}
        {config.gatewayMode ? (
          <ConfigureTwoFactorGateway path="/gateway-configure-two-factor" />
        ) : (
          <Error type="404" default />
        )}
        {config.gatewayMode ? <GatewayConfirmEmail path="/confirm-email" /> : <Error type="404" default />}
        {config.gatewayMode ? <SettingsBilling path="/dashboard/settings/billing" /> : <Error type="404" default />}
        {config.gatewayMode ? (
          <SettingsGatewayUsers path="/dashboard/settings/gateway-users" />
        ) : (
          <Error type="404" default />
        )}
        {config.gatewayMode ? (
          <SettingsGatewayOpenApi path="/dashboard/settings/gateway-open-api" />
        ) : (
          <Error type="404" default />
        )}

        {!config.gatewayMode ? <SignupWelcomePage path="/signup" /> : <Error type="404" default />}
        <SignupCreateAccountLocal path="/signup/create-account-local" />
        <SignupCreateAccountGladysGateway path="/signup/create-account-gladys-gateway" />
        <SignupPreferences path="/signup/preference" />
        <SignupConfigureHouse path="/signup/configure-house" />
        <SignupSuccess path="/signup/success" />
        <Dashboard path="/dashboard" />
        <Device path="/dashboard/device" />
        <IntegrationPage path="/dashboard/integration" />
        {props.integrationCategories.map(category => (
          <IntegrationPage path={`/dashboard/integration/${category.type}`} category={category.type} />
        ))}

        <TelegramPage path="/dashboard/integration/communication/telegram" />
        <CaldavPage path="/dashboard/integration/calendar/caldav" />
        <DarkSkyPage path="/dashboard/integration/weather/darksky" />
        <Redirect
          path="/dashboard/integration/device/philips-hue"
          to="/dashboard/integration/device/philips-hue/device"
        />
        <PhilipsHueSetupPage path="/dashboard/integration/device/philips-hue/setup" />
        <PhilipsHueDevicePage path="/dashboard/integration/device/philips-hue/device" />
        <Redirect path="/dashboard/integration/device/zwave" to="/dashboard/integration/device/zwave/node" />
        <ZwaveNodePage path="/dashboard/integration/device/zwave/node" />
        <ZwaveNetworkPage path="/dashboard/integration/device/zwave/network" />
        <ZwaveSettingsPage path="/dashboard/integration/device/zwave/settings" />
        <ZwaveSetupPage path="/dashboard/integration/device/zwave/setup" />
        <ZwaveNodeOperationPage path="/dashboard/integration/device/zwave/node-operation" />
        <ZwaveEditPage path="/dashboard/integration/device/zwave/edit/:deviceSelector" />
        <RtspCameraPage path="/dashboard/integration/device/rtsp-camera" />
        <MqttDevicePage path="/dashboard/integration/device/mqtt" />
        <MqttDeviceSetupPage path="/dashboard/integration/device/mqtt/edit" />
        <MqttDeviceSetupPage path="/dashboard/integration/device/mqtt/edit/:deviceSelector" />
        <MqttSetupPage path="/dashboard/integration/device/mqtt/setup" />
        <XiaomiPage path="/dashboard/integration/device/xiaomi" />
        <EditXiaomiPage path="/dashboard/integration/device/xiaomi/edit/:deviceSelector" />
        <TasmotaPage path="/dashboard/integration/device/tasmota" />
        <TasmotaEditPage path="/dashboard/integration/device/tasmota/edit/:deviceSelector" />
        <TasmotaDiscoverPage path="/dashboard/integration/device/tasmota/discover" />

        <ChatPage path="/dashboard/chat" />
        <MapPage path="/dashboard/maps" />
        <CalendarPage path="/dashboard/calendar" />
        <ScenePage path="/dashboard/scene" />
        <NewScenePage path="/dashboard/scene/new" />
        <EditScenePage path="/dashboard/scene/:scene_selector" />
        <TriggerPage path="/dashboard/trigger" />
        <ProfilePage path="/dashboard/profile" />
        <SettingsSessionPage path="/dashboard/settings/session" />
        <SettingsHousePage path="/dashboard/settings/house" />
        <SettingsSystemPage path="/dashboard/settings/system" />
        <SettingsGateway path="/dashboard/settings/gateway" />
        <SettingsBackup path="/dashboard/settings/backup" />
        <Error type="404" default />
      </Router>
    </Layout>
  </div>
));

@connect('user', actions)
class MainApp extends Component {
  componentWillMount() {
    this.props.checkSession();
    this.props.getIntegrations();
  }

  render({ user }, {}) {
    const translationDefinition = get(translations, user.language, { default: translations.en });
    return (
      <IntlProvider definition={translationDefinition}>
        <AppRouter />
      </IntlProvider>
    );
  }
}

const App = () => (
  <Provider store={store}>
    <MainApp />
  </Provider>
);

export default App;
