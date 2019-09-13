import { h, Component } from 'preact';
import { Router } from 'preact-router';
import createStore from 'unistore';
import config from '../../config';
import { Provider, connect } from 'unistore/preact';
import { IntlProvider } from 'preact-i18n';
import translationEn from '../config/i18n/en.json';
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
import SettingsAdvancedPage from '../routes/settings/settings-advanced';
import SettingsSystemPage from '../routes/settings/settings-system';
import SettingsGateway from '../routes/settings/settings-gateway';
import SettingsBackup from '../routes/settings/settings-backup';

// Integrations
import TelegramPage from '../routes/integration/all/telegram';
import DarkSkyPage from '../routes/integration/all/darksky';
import PhilipsHuePage from '../routes/integration/all/philips-hue';
import ZwaveNodePage from '../routes/integration/all/zwave/node-page';
import ZwaveNetworkPage from '../routes/integration/all/zwave/network-page';
import ZwaveSettingsPage from '../routes/integration/all/zwave/settings-page';
import ZwaveSetupPage from '../routes/integration/all/zwave/setup-page';
import RtspCameraPage from '../routes/integration/all/rtsp-camera';

// MQTT integration
import MqttDevicePage from '../routes/integration/all/mqtt/device-page';
import MqttDeviceSetupPage from '../routes/integration/all/mqtt/device-page/setup';
import MqttSetupPage from '../routes/integration/all/mqtt/setup-page';

const defaultState = getDefaultState();
const store = createStore(defaultState);

const AppRouter = connect(
  'currentUrl,user,profilePicture,showDropDown,showCollapsedMenu',
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
        {config.gatewayMode ? <ForgotPassword path="/forgot-password" /> : <ForgotPassword path="/forgot-password" />}
        {config.gatewayMode ? <ResetPassword path="/reset-password" /> : <ResetPassword path="/reset-password" />}
        {config.gatewayMode ? <LinkGatewayUser path="/link-gateway-user" /> : <Error type="404" default />}

        <SignupWelcomePage path="/signup" />
        <SignupCreateAccountLocal path="/signup/create-account-local" />
        <SignupCreateAccountGladysGateway path="/signup/create-account-gladys-gateway" />
        <SignupPreferences path="/signup/preference" />
        <SignupConfigureHouse path="/signup/configure-house" />
        <SignupSuccess path="/signup/success" />

        <Dashboard path="/dashboard" />
        <Device path="/dashboard/device" />
        <IntegrationPage path="/dashboard/integration" />
        <IntegrationPage path="/dashboard/integration/device" />
        <IntegrationPage path="/dashboard/integration/communication" />
        <IntegrationPage path="/dashboard/integration/calendar" />
        <IntegrationPage path="/dashboard/integration/music" />
        <IntegrationPage path="/dashboard/integration/health" />
        <IntegrationPage path="/dashboard/integration/weather" />
        <IntegrationPage path="/dashboard/integration/navigation" />

        <TelegramPage path="/dashboard/integration/communication/telegram" />
        <DarkSkyPage path="/dashboard/integration/weather/darksky" />
        <PhilipsHuePage path="/dashboard/integration/device/philips-hue" />
        <Redirect path="/dashboard/integration/device/zwave" to="/dashboard/integration/device/zwave/node" />
        <ZwaveNodePage path="/dashboard/integration/device/zwave/node" />
        <ZwaveNetworkPage path="/dashboard/integration/device/zwave/network" />
        <ZwaveSettingsPage path="/dashboard/integration/device/zwave/settings" />
        <ZwaveSetupPage path="/dashboard/integration/device/zwave/setup" />
        <RtspCameraPage path="/dashboard/integration/device/rtsp-camera" />

        <MqttDevicePage path="/dashboard/integration/device/mqtt" />
        <MqttDeviceSetupPage path="/dashboard/integration/device/mqtt/edit" />
        <MqttDeviceSetupPage path="/dashboard/integration/device/mqtt/edit/:deviceSelector" />
        <MqttSetupPage path="/dashboard/integration/device/mqtt/setup" />

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
        <SettingsAdvancedPage path="/dashboard/settings/advanced" />
        <SettingsSystemPage path="/dashboard/settings/system" />
        <SettingsGateway path="/dashboard/settings/gateway" />
        <SettingsBackup path="/dashboard/settings/backup" />
        <Error type="404" default />
      </Router>
    </Layout>
  </div>
));

@connect(
  '',
  actions
)
class MainApp extends Component {
  componentWillMount() {
    this.props.checkSession();
  }

  render({}, {}) {
    return <AppRouter />;
  }
}

const App = () => (
  <Provider store={store}>
    <IntlProvider definition={translationEn}>
      <MainApp />
    </IntlProvider>
  </Provider>
);

export default App;
