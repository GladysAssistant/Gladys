import { h, Component } from 'preact';
import { Router } from 'preact-router';
import createStore from 'unistore';
import get from 'get-value';
import config from '../config';
import { Provider, connect } from 'unistore/preact';
import { IntlProvider } from 'preact-i18n';
import translations from '../config/i18n';
import actions from '../actions/main';

import { getDefaultState } from '../utils/getDefaultState';

import Header from './header';
import Layout from './layout';
import Redirect from './router/Redirect';
import Login from '../routes/login';
import Locked from '../routes/locked';
import Error from '../routes/error';
import ForgotPassword from '../routes/forgot-password';
import ResetPassword from '../routes/reset-password';

// Gateway
import LoginGateway from '../routes/login-gateway';
import LinkGatewayUser from '../routes/gateway-setup';
import SignupGateway from '../routes/signup-gateway';
import ConfigureTwoFactorGateway from '../routes/gateway-configure-two-factor';
import GatewayForgotPassword from '../routes/gateway-forgot-password';
import GatewayResetPassword from '../routes/gateway-reset-password';
import GatewayConfirmEmail from '../routes/gateway-confirm-email';
import GoogleHomeGateway from '../routes/integration/all/google-home-gateway';
import AlexaGateway from '../routes/integration/all/alexa-gateway';
import EnedisGateway from '../routes/integration/all/enedis-gateway/Welcome';
import EnedisGatewayUsagePoints from '../routes/integration/all/enedis-gateway/UsagePoints';

import SignupWelcomePage from '../routes/signup/1-welcome';
import SignupCreateAccountLocal from '../routes/signup/2-create-account-local';
import SignupCreateAccountGladysGateway from '../routes/signup/2-create-account-gladys-gateway';
import SignupPreferences from '../routes/signup/3-preferences';
import SignupConfigureHouse from '../routes/signup/4-configure-house';
import SignupSuccess from '../routes/signup/5-success';

// Dashboard
import Dashboard from '../routes/dashboard';
import NewDashboard from '../routes/dashboard/new-dashboard';
import EditDashboard from '../routes/dashboard/edit-dashboard';

import IntegrationPage from '../routes/integration';
import ChatPage from '../routes/chat';
import MapPage from '../routes/map';
import MapNewAreaPage from '../routes/map/NewArea';
import CalendarPage from '../routes/calendar';
import ScenePage from '../routes/scene';
import NewScenePage from '../routes/scene/new-scene';
import DuplicateScenePage from '../routes/scene/duplicate-scene';
import EditScenePage from '../routes/scene/edit-scene';
import ProfilePage from '../routes/profile';
import SettingsSessionPage from '../routes/settings/settings-session';
import SettingsHousePage from '../routes/settings/settings-house';
import SettingsUserPage from '../routes/settings/settings-users';
import SettingsEditUserPage from '../routes/settings/settings-users/edit-user';
import SettingsCreateUserPage from '../routes/settings/settings-users/create-user';
import SettingsSystemPage from '../routes/settings/settings-system';
import SettingsServicePage from '../routes/settings/settings-service';
import SettingsGateway from '../routes/settings/settings-gateway';
import SettingsBackup from '../routes/settings/settings-backup';
import SettingsBilling from '../routes/settings/settings-billing';
import SettingsGatewayUsers from '../routes/settings/settings-gateway-users';
import SettingsGatewayOpenApi from '../routes/settings/settings-gateway-open-api';
import SettingsBackgroundJobs from '../routes/settings/settings-background-jobs';

// Integrations
import TelegramPage from '../routes/integration/all/telegram';
import AlexaWelcomePage from '../routes/integration/all/alexa-gateway/welcome';
import GoogleHomeWelcomePage from '../routes/integration/all/google-home-gateway/welcome';
import HomeKitPage from '../routes/integration/all/homekit';
import OwntracksWelcomePage from '../routes/integration/all/owntracks/welcome';
import CalDAVAccountPage from '../routes/integration/all/caldav/account-page';
import CalDAVSyncPage from '../routes/integration/all/caldav/sync-page';
import CalDAVSharePage from '../routes/integration/all/caldav/share-page';
import OpenWeatherPage from '../routes/integration/all/openweather';
import PhilipsHueSetupPage from '../routes/integration/all/philips-hue/setup-page';
import PhilipsHueDevicePage from '../routes/integration/all/philips-hue/device-page';
import TPLinkDevicePage from '../routes/integration/all/tp-link/device-page';
import RtspCameraPage from '../routes/integration/all/rtsp-camera';
import XiaomiPage from '../routes/integration/all/xiaomi';
import EditXiaomiPage from '../routes/integration/all/xiaomi/edit-page';
import NextcloudTalkPage from '../routes/integration/all/nextcloud-talk';

// Deprecated integration
import ZwaveNodePage from '../routes/integration/all/zwave/node-page';

// Broadlink integration
import BroadlinkDevicePage from '../routes/integration/all/broadlink/device-page';
import BroadlinkRemoteSetupPage from '../routes/integration/all/broadlink/remote-page';
import BroadlinkPeripheralPage from '../routes/integration/all/broadlink/peripheral-page';

// LAN-Manager integration
import LANManagerDevicePage from '../routes/integration/all/lan-manager/device-page';
import LANManagerDiscoverPage from '../routes/integration/all/lan-manager/discover-page';
import LANManagerSettingsPage from '../routes/integration/all/lan-manager/settings-page';

// MQTT integration
import MqttDevicePage from '../routes/integration/all/mqtt/device-page';
import MqttDeviceSetupPage from '../routes/integration/all/mqtt/device-page/setup';
import MqttSetupPage from '../routes/integration/all/mqtt/setup-page';

// Zigbee2mqtt
import Zigbee2mqttPage from '../routes/integration/all/zigbee2mqtt/device-page';
import Zigbee2mqttDiscoverPage from '../routes/integration/all/zigbee2mqtt/discover-page';
import Zigbee2mqttSettingsPage from '../routes/integration/all/zigbee2mqtt/settings-page';
import Zigbee2mqttSetupPage from '../routes/integration/all/zigbee2mqtt/setup-page';
import Zigbee2mqttEditPage from '../routes/integration/all/zigbee2mqtt/edit-page';

// Tasmota
import TasmotaPage from '../routes/integration/all/tasmota/device-page';
import TasmotaEditPage from '../routes/integration/all/tasmota/edit-page';
import TasmotaMqttDiscoverPage from '../routes/integration/all/tasmota/discover-mqtt';
import TasmotaHttpDiscoverPage from '../routes/integration/all/tasmota/discover-http';

// Integrations Bluetooth
import BluetoothDevicePage from '../routes/integration/all/bluetooth/device-page';
import BluetoothEditDevicePage from '../routes/integration/all/bluetooth/edit-page';
import BluetoothSetupPage from '../routes/integration/all/bluetooth/setup-page';
import BluetoothSetupPeripheralPage from '../routes/integration/all/bluetooth/setup-page/setup-peripheral';
import BluetoothSettingsPage from '../routes/integration/all/bluetooth/settings-page';

// EweLink
import EweLinkPage from '../routes/integration/all/ewelink/device-page';
import EweLinkEditPage from '../routes/integration/all/ewelink/edit-page';
import EweLinkDiscoverPage from '../routes/integration/all/ewelink/discover-page';
import EweLinkSetupPage from '../routes/integration/all/ewelink/setup-page';

// OpenAI integration
import OpenAIPage from '../routes/integration/all/openai/index';

// Tuya integration
import TuyaPage from '../routes/integration/all/tuya/device-page';
import TuyaEditPage from '../routes/integration/all/tuya/edit-page';
import TuyaSetupPage from '../routes/integration/all/tuya/setup-page';
import TuyaDiscoverPage from '../routes/integration/all/tuya/discover-page';

// Sonos integration
import SonosDevicePage from '../routes/integration/all/sonos/device-page';
import SonosDiscoveryPage from '../routes/integration/all/sonos/discover-page';

// MELCloud integration
import MELCloudPage from '../routes/integration/all/melcloud/device-page';
import MELCloudEditPage from '../routes/integration/all/melcloud/edit-page';
import MELCloudSetupPage from '../routes/integration/all/melcloud/setup-page';
import MELCloudDiscoverPage from '../routes/integration/all/melcloud/discover-page';

// NodeRed integration
import NodeRedPage from '../routes/integration/all/node-red/setup-page';

const defaultState = getDefaultState();
const store = createStore(defaultState);

const AppRouter = connect(
  'currentUrl,user,profilePicture,showDropDown,showCollapsedMenu,fullScreen',
  actions
)(props => (
  <div id="app">
    <Layout currentUrl={props.currentUrl}>
      <Header
        currentUrl={props.currentUrl}
        user={props.user}
        fullScreen={props.fullScreen}
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
        <Locked path="/locked" />
        {config.gatewayMode ? <LinkGatewayUser path="/link-gateway-user" /> : <Error type="404" default />}
        {config.gatewayMode ? <SignupGateway path="/signup-gateway" /> : <Error type="404" default />}
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
        <Dashboard path="/dashboard/:dashboardSelector" />
        <EditDashboard path="/dashboard/:dashboardSelector/edit" />
        <NewDashboard path="/dashboard/create/new" />
        <IntegrationPage path="/dashboard/integration" />

        <IntegrationPage path="/dashboard/integration/device" category="device" />
        <IntegrationPage path="/dashboard/integration/communication" category="communication" />
        <IntegrationPage path="/dashboard/integration/calendar" category="calendar" />
        <IntegrationPage path="/dashboard/integration/music" category="music" />
        <IntegrationPage path="/dashboard/integration/health" category="health" />
        <IntegrationPage path="/dashboard/integration/weather" category="weather" />
        <IntegrationPage path="/dashboard/integration/navigation" category="navigation" />

        <TelegramPage path="/dashboard/integration/communication/telegram" />
        <Redirect
          path="/dashboard/integration/communication/nextcloudtalk"
          to="/dashboard/integration/communication/nextcloud-talk"
        />
        <NextcloudTalkPage path="/dashboard/integration/communication/nextcloud-talk" />
        <Redirect path="/dashboard/integration/calendar/caldav" to="/dashboard/integration/calendar/caldav/account" />
        <CalDAVAccountPage path="/dashboard/integration/calendar/caldav/account" />
        <CalDAVSyncPage path="/dashboard/integration/calendar/caldav/sync" />
        <CalDAVSharePage path="/dashboard/integration/calendar/caldav/share" />
        <OpenWeatherPage path="/dashboard/integration/weather/openweather" />
        <Redirect
          path="/dashboard/integration/device/philips-hue"
          to="/dashboard/integration/device/philips-hue/device"
        />
        <PhilipsHueSetupPage path="/dashboard/integration/device/philips-hue/setup" />
        <PhilipsHueDevicePage path="/dashboard/integration/device/philips-hue/device" />
        <Redirect path="/dashboard/integration/device/tp-link" to="/dashboard/integration/device/tp-link/device" />
        <TPLinkDevicePage path="/dashboard/integration/device/tp-link/device" />
        <Redirect path="/dashboard/integration/device/zwave" to="/dashboard/integration/device/zwave/node" />
        <ZwaveNodePage path="/dashboard/integration/device/zwave/node" />
        <RtspCameraPage path="/dashboard/integration/device/rtsp-camera" />
        <MqttDevicePage path="/dashboard/integration/device/mqtt" />
        <MqttDeviceSetupPage path="/dashboard/integration/device/mqtt/edit" />
        <MqttDeviceSetupPage path="/dashboard/integration/device/mqtt/edit/:deviceSelector" />
        <MqttSetupPage path="/dashboard/integration/device/mqtt/setup" />
        <Zigbee2mqttPage path="/dashboard/integration/device/zigbee2mqtt" />
        <Zigbee2mqttDiscoverPage path="/dashboard/integration/device/zigbee2mqtt/discover" />
        <Zigbee2mqttSettingsPage path="/dashboard/integration/device/zigbee2mqtt/settings" />
        <Zigbee2mqttSetupPage path="/dashboard/integration/device/zigbee2mqtt/setup" />
        <Zigbee2mqttEditPage path="/dashboard/integration/device/zigbee2mqtt/edit/:deviceSelector" />

        <NodeRedPage path="/dashboard/integration/device/node-red" />

        <XiaomiPage path="/dashboard/integration/device/xiaomi" />
        <EditXiaomiPage path="/dashboard/integration/device/xiaomi/edit/:deviceSelector" />
        <TasmotaPage path="/dashboard/integration/device/tasmota" />
        <TasmotaEditPage path="/dashboard/integration/device/tasmota/edit/:deviceSelector" />
        <TasmotaMqttDiscoverPage path="/dashboard/integration/device/tasmota/mqtt" />
        <TasmotaHttpDiscoverPage path="/dashboard/integration/device/tasmota/http" />
        <EweLinkPage path="/dashboard/integration/device/ewelink" />
        <EweLinkEditPage path="/dashboard/integration/device/ewelink/edit/:deviceSelector" />
        <EweLinkDiscoverPage path="/dashboard/integration/device/ewelink/discover" />
        <EweLinkSetupPage path="/dashboard/integration/device/ewelink/setup" />
        <HomeKitPage path="/dashboard/integration/communication/homekit" />
        <OpenAIPage path="/dashboard/integration/communication/openai" />

        <TuyaPage path="/dashboard/integration/device/tuya" />
        <TuyaEditPage path="/dashboard/integration/device/tuya/edit/:deviceSelector" />
        <TuyaDiscoverPage path="/dashboard/integration/device/tuya/discover" />
        <TuyaSetupPage path="/dashboard/integration/device/tuya/setup" />

        <SonosDevicePage path="/dashboard/integration/device/sonos" />
        <SonosDiscoveryPage path="/dashboard/integration/device/sonos/discover" />

        <MELCloudPage path="/dashboard/integration/device/melcloud" />
        <MELCloudEditPage path="/dashboard/integration/device/melcloud/edit/:deviceSelector" />
        <MELCloudDiscoverPage path="/dashboard/integration/device/melcloud/discover" />
        <MELCloudSetupPage path="/dashboard/integration/device/melcloud/setup" />

        <BluetoothDevicePage path="/dashboard/integration/device/bluetooth" />
        <BluetoothEditDevicePage path="/dashboard/integration/device/bluetooth/:deviceSelector" />
        <BluetoothSetupPage path="/dashboard/integration/device/bluetooth/setup" />
        <BluetoothSetupPeripheralPage path="/dashboard/integration/device/bluetooth/setup/:uuid" />
        <BluetoothSettingsPage path="/dashboard/integration/device/bluetooth/config" />

        <BroadlinkDevicePage path="/dashboard/integration/device/broadlink" />
        <BroadlinkRemoteSetupPage path="/dashboard/integration/device/broadlink/edit" />
        <BroadlinkRemoteSetupPage path="/dashboard/integration/device/broadlink/edit/:deviceSelector" />
        <BroadlinkPeripheralPage path="/dashboard/integration/device/broadlink/peripheral" />

        <LANManagerDevicePage path="/dashboard/integration/device/lan-manager" />
        <LANManagerDiscoverPage path="/dashboard/integration/device/lan-manager/discover" />
        <LANManagerSettingsPage path="/dashboard/integration/device/lan-manager/config" />

        <GoogleHomeWelcomePage path="/dashboard/integration/communication/googlehome" />
        <GoogleHomeGateway path="/dashboard/integration/device/google-home/authorize" />
        <AlexaWelcomePage path="/dashboard/integration/communication/alexa" />
        <OwntracksWelcomePage path="/dashboard/integration/device/owntracks" />
        <AlexaGateway path="/dashboard/integration/device/alexa/authorize" />
        <EnedisGateway path="/dashboard/integration/device/enedis" />
        <EnedisGatewayUsagePoints path="/dashboard/integration/device/enedis/usage-points" />
        <EnedisGateway path="/dashboard/integration/device/enedis/redirect" />

        <ChatPage path="/dashboard/chat" />
        <MapPage path="/dashboard/maps" />
        <MapNewAreaPage path="/dashboard/maps/area/new" />
        <MapNewAreaPage path="/dashboard/maps/area/edit/:areaSelector" />
        <CalendarPage path="/dashboard/calendar" />
        <ScenePage path="/dashboard/scene" />
        <NewScenePage path="/dashboard/scene/new" />
        <DuplicateScenePage path="/dashboard/scene/:scene_selector/duplicate" />
        <EditScenePage path="/dashboard/scene/:scene_selector" />
        <ProfilePage path="/dashboard/profile" />
        <SettingsSessionPage path="/dashboard/settings/session" />
        <SettingsHousePage path="/dashboard/settings/house" />
        <SettingsUserPage path="/dashboard/settings/user" />
        <SettingsEditUserPage path="/dashboard/settings/user/edit/:user_selector" />
        <SettingsCreateUserPage path="/dashboard/settings/user/new" />
        <SettingsSystemPage path="/dashboard/settings/system" />
        <SettingsGateway path="/dashboard/settings/gateway" />
        <SettingsServicePage path="/dashboard/settings/service" />
        <SettingsBackup path="/dashboard/settings/backup" />
        <SettingsBackgroundJobs path="/dashboard/settings/jobs" />
        <Error type="404" default />
      </Router>
    </Layout>
  </div>
));

class MainApp extends Component {
  componentWillMount() {
    this.props.checkSession();
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

const MainAppConnected = connect('user', actions)(MainApp);

const App = () => (
  <Provider store={store}>
    <MainAppConnected />
  </Provider>
);

export default App;
