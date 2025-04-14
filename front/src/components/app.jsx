import { h, Component } from 'preact';
import { Router } from 'preact-router';
import createStore from 'unistore';
import get from 'get-value';
import config from '../config';
import { Provider, connect } from 'unistore/preact';
import AsyncRoute from 'preact-async-route';
import { IntlProvider } from 'preact-i18n';
import translations from '../config/i18n';
import actions from '../actions/main';
import { getDefaultState } from '../utils/getDefaultState';

// Keep core components and routes that don't need lazy loading
import Header from './header';
import Layout from './layout';
import Redirect from './router/Redirect';
import Locked from '../routes/locked';
import Error from '../routes/error';

// Gateway core components
import LinkGatewayUser from '../routes/gateway-setup';
import SignupGateway from '../routes/signup-gateway';
import ConfigureTwoFactorGateway from '../routes/gateway-configure-two-factor';
import GatewayConfirmEmail from '../routes/gateway-confirm-email';

// Add these new imports
import Welcome from '../routes/signup/1-welcome';
import CreateAccountLocal from '../routes/signup/2-create-account-local';
import CreateAccountGladysGateway from '../routes/signup/2-create-account-gladys-gateway';
import Preferences from '../routes/signup/3-preferences';
import ConfigureHouse from '../routes/signup/4-configure-house';
import Success from '../routes/signup/5-success';

const defaultState = getDefaultState();
const store = createStore(defaultState);

const SafeAsyncRoute = props => (
  <div class="async-route-wrapper">
    <AsyncRoute {...props} loading={() => <div class="loading-placeholder" />} />
  </div>
);

const AppRouter = connect(
  'currentUrl,user,profilePicture,showDropDown,showCollapsedMenu,fullScreen',
  actions
)(props => (
  <div id="app">
    <Layout currentUrl={props.currentUrl}>
      <Header {...props} />
      <Router onChange={props.handleRoute}>
        <Redirect path="/" to="/dashboard" />

        {/** GATEWAY MODE ROUTES */}
        {config.gatewayMode ? (
          <SafeAsyncRoute path="/login" getComponent={() => import('../routes/login-gateway').then(m => m.default)} />
        ) : (
          <SafeAsyncRoute path="/login" getComponent={() => import('../routes/login').then(m => m.default)} />
        )}
        {config.gatewayMode ? (
          <SafeAsyncRoute
            path="/forgot-password"
            getComponent={() => import('../routes/gateway-forgot-password').then(m => m.default)}
          />
        ) : (
          <SafeAsyncRoute
            path="/forgot-password"
            getComponent={() => import('../routes/forgot-password').then(m => m.default)}
          />
        )}
        {config.gatewayMode ? (
          <SafeAsyncRoute
            path="/reset-password"
            getComponent={() => import('../routes/gateway-reset-password').then(m => m.default)}
          />
        ) : (
          <SafeAsyncRoute
            path="/reset-password"
            getComponent={() => import('../routes/reset-password').then(m => m.default)}
          />
        )}
        <Locked path="/locked" />
        {config.gatewayMode && <LinkGatewayUser path="/link-gateway-user" />}
        {config.gatewayMode && <SignupGateway path="/signup-gateway" />}
        {config.gatewayMode && <ConfigureTwoFactorGateway path="/gateway-configure-two-factor" />}
        {config.gatewayMode && <GatewayConfirmEmail path="/confirm-email" />}
        {config.gatewayMode && (
          <SafeAsyncRoute
            path="/dashboard/settings/billing"
            getComponent={() => import('../routes/settings/settings-billing').then(m => m.default)}
          />
        )}
        {config.gatewayMode && (
          <SafeAsyncRoute
            path="/dashboard/settings/gateway-users"
            getComponent={() => import('../routes/settings/settings-gateway-users').then(m => m.default)}
          />
        )}
        {config.gatewayMode && (
          <SafeAsyncRoute
            path="/dashboard/settings/gateway-open-api"
            getComponent={() => import('../routes/settings/settings-gateway-open-api').then(m => m.default)}
          />
        )}

        {/** SIGNUP ROUTES */}
        {!config.gatewayMode && <Welcome path="/signup" />}
        <CreateAccountLocal path="/signup/create-account-local" />
        <CreateAccountGladysGateway path="/signup/create-account-gladys-gateway" />
        <Preferences path="/signup/preference" />
        <ConfigureHouse path="/signup/configure-house" />
        <Success path="/signup/success" />
        {!config.gatewayMode && (
          <SafeAsyncRoute
            path="/signup"
            getComponent={() => import('../routes/signup/1-welcome').then(m => m.default)}
          />
        )}
        <SafeAsyncRoute
          path="/signup/create-account-local"
          getComponent={() => import('../routes/signup/2-create-account-local').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/signup/create-account-gladys-gateway"
          getComponent={() => import('../routes/signup/2-create-account-gladys-gateway').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/signup/preference"
          getComponent={() => import('../routes/signup/3-preferences').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/signup/configure-house"
          getComponent={() => import('../routes/signup/4-configure-house').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/signup/success"
          getComponent={() => import('../routes/signup/5-success').then(m => m.default)}
        />

        {/** DASHBOARD ROUTES */}
        <SafeAsyncRoute path="/dashboard" getComponent={() => import('../routes/dashboard').then(m => m.default)} />
        <SafeAsyncRoute
          path="/dashboard/:dashboardSelector"
          getComponent={() => import('../routes/dashboard').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/:dashboardSelector/edit"
          getComponent={() => import('../routes/dashboard/edit-dashboard').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/create/new"
          getComponent={() => import('../routes/dashboard/new-dashboard').then(m => m.default)}
        />

        {/** INTEGRATION ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration"
          getComponent={() => import('../routes/integration').then(m => m.default)}
        />

        {/** INTEGRATION CATEGORY ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device"
          getComponent={() => import('../routes/integration').then(m => m.default)}
          category="device"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/communication"
          getComponent={() => import('../routes/integration').then(m => m.default)}
          category="communication"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/calendar"
          getComponent={() => import('../routes/integration').then(m => m.default)}
          category="calendar"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/music"
          getComponent={() => import('../routes/integration').then(m => m.default)}
          category="music"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/health"
          getComponent={() => import('../routes/integration').then(m => m.default)}
          category="health"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/weather"
          getComponent={() => import('../routes/integration').then(m => m.default)}
          category="weather"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/navigation"
          getComponent={() => import('../routes/integration').then(m => m.default)}
          category="navigation"
        />

        {/** SPECIFIC INTEGRATION ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/communication/telegram"
          getComponent={() => import('../routes/integration/all/telegram').then(m => m.default)}
        />
        <Redirect
          path="/dashboard/integration/communication/nextcloudtalk"
          to="/dashboard/integration/communication/nextcloud-talk"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/communication/nextcloud-talk"
          getComponent={() => import('../routes/integration/all/nextcloud-talk').then(m => m.default)}
        />

        {/** CALDAV ROUTES */}
        <Redirect path="/dashboard/integration/calendar/caldav" to="/dashboard/integration/calendar/caldav/account" />
        <SafeAsyncRoute
          path="/dashboard/integration/calendar/caldav/account"
          getComponent={() => import('../routes/integration/all/caldav/account-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/calendar/caldav/sync"
          getComponent={() => import('../routes/integration/all/caldav/sync-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/calendar/caldav/share"
          getComponent={() => import('../routes/integration/all/caldav/share-page').then(m => m.default)}
        />

        {/** WEATHER INTEGRATION */}
        <SafeAsyncRoute
          path="/dashboard/integration/weather/openweather"
          getComponent={() => import('../routes/integration/all/openweather').then(m => m.default)}
        />

        {/** PHILIPS HUE ROUTES */}
        <Redirect
          path="/dashboard/integration/device/philips-hue"
          to="/dashboard/integration/device/philips-hue/device"
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/philips-hue/setup"
          getComponent={() => import('../routes/integration/all/philips-hue/setup-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/philips-hue/device"
          getComponent={() => import('../routes/integration/all/philips-hue/device-page').then(m => m.default)}
        />

        {/** TP-LINK ROUTES */}
        <Redirect path="/dashboard/integration/device/tp-link" to="/dashboard/integration/device/tp-link/device" />
        <SafeAsyncRoute
          path="/dashboard/integration/device/tp-link/device"
          getComponent={() => import('../routes/integration/all/tp-link/device-page').then(m => m.default)}
        />

        {/** RTSP CAMERA ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/rtsp-camera"
          getComponent={() => import('../routes/integration/all/rtsp-camera').then(m => m.default)}
        />

        {/** MQTT ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/mqtt"
          getComponent={() => import('../routes/integration/all/mqtt/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/mqtt/edit"
          getComponent={() => import('../routes/integration/all/mqtt/device-page/setup').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/mqtt/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/mqtt/device-page/setup').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/mqtt/setup"
          getComponent={() => import('../routes/integration/all/mqtt/setup-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/mqtt/debug"
          getComponent={() => import('../routes/integration/all/mqtt/debug-page/Debug').then(m => m.default)}
        />

        {/** ZIGBEE2MQTT ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/zigbee2mqtt"
          getComponent={() => import('../routes/integration/all/zigbee2mqtt/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/zigbee2mqtt/discover"
          getComponent={() => import('../routes/integration/all/zigbee2mqtt/discover-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/zigbee2mqtt/setup"
          getComponent={() => import('../routes/integration/all/zigbee2mqtt/setup-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/zigbee2mqtt/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/zigbee2mqtt/edit-page').then(m => m.default)}
        />

        {/** NODE-RED ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/node-red"
          getComponent={() => import('../routes/integration/all/node-red/setup-page').then(m => m.default)}
        />

        {/** COMMUNICATION ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/communication/free-mobile"
          getComponent={() => import('../routes/integration/all/free-mobile').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/communication/callmebot"
          getComponent={() => import('../routes/integration/all/callmebot/setup-page').then(m => m.default)}
        />

        {/** XIAOMI ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/xiaomi"
          getComponent={() => import('../routes/integration/all/xiaomi').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/xiaomi/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/xiaomi/edit-page').then(m => m.default)}
        />

        {/** TASMOTA ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/tasmota"
          getComponent={() => import('../routes/integration/all/tasmota/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/tasmota/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/tasmota/edit-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/tasmota/mqtt"
          getComponent={() => import('../routes/integration/all/tasmota/discover-mqtt').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/tasmota/http"
          getComponent={() => import('../routes/integration/all/tasmota/discover-http').then(m => m.default)}
        />

        {/** EWELINK ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/ewelink"
          getComponent={() => import('../routes/integration/all/ewelink/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/ewelink/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/ewelink/edit-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/ewelink/discover"
          getComponent={() => import('../routes/integration/all/ewelink/discover-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/ewelink/setup"
          getComponent={() => import('../routes/integration/all/ewelink/setup-page').then(m => m.default)}
        />

        {/** HOMEKIT & OPENAI ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/communication/homekit"
          getComponent={() => import('../routes/integration/all/homekit').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/communication/openai"
          getComponent={() => import('../routes/integration/all/openai').then(m => m.default)}
        />

        {/** TUYA ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/tuya"
          getComponent={() => import('../routes/integration/all/tuya/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/tuya/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/tuya/edit-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/tuya/discover"
          getComponent={() => import('../routes/integration/all/tuya/discover-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/tuya/setup"
          getComponent={() => import('../routes/integration/all/tuya/setup-page').then(m => m.default)}
        />

        {/** NETATMO ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/netatmo"
          getComponent={() => import('../routes/integration/all/netatmo/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/netatmo/discover"
          getComponent={() => import('../routes/integration/all/netatmo/discover-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/netatmo/setup"
          getComponent={() => import('../routes/integration/all/netatmo/setup-page').then(m => m.default)}
        />

        {/** SONOS ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/sonos"
          getComponent={() => import('../routes/integration/all/sonos/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/sonos/discover"
          getComponent={() => import('../routes/integration/all/sonos/discover-page').then(m => m.default)}
        />

        {/** GOOGLE CAST ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/google-cast"
          getComponent={() => import('../routes/integration/all/google-cast/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/google-cast/discover"
          getComponent={() => import('../routes/integration/all/google-cast/discover-page').then(m => m.default)}
        />

        {/** AIRPLAY ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/airplay"
          getComponent={() => import('../routes/integration/all/airplay/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/airplay/discover"
          getComponent={() => import('../routes/integration/all/airplay/discover-page').then(m => m.default)}
        />

        {/** ZWAVE ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/zwavejs-ui"
          getComponent={() => import('../routes/integration/all/zwavejs-ui/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/zwavejs-ui/discover"
          getComponent={() => import('../routes/integration/all/zwavejs-ui/discover-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/zwavejs-ui/setup"
          getComponent={() => import('../routes/integration/all/zwavejs-ui/setup-page').then(m => m.default)}
        />

        {/** MELCLOUD ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/melcloud"
          getComponent={() => import('../routes/integration/all/melcloud/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/melcloud/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/melcloud/edit-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/melcloud/discover"
          getComponent={() => import('../routes/integration/all/melcloud/discover-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/melcloud/setup"
          getComponent={() => import('../routes/integration/all/melcloud/setup-page').then(m => m.default)}
        />

        {/** BLUETOOTH ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/bluetooth"
          getComponent={() => import('../routes/integration/all/bluetooth/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/bluetooth/:deviceSelector"
          getComponent={() => import('../routes/integration/all/bluetooth/edit-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/bluetooth/setup"
          getComponent={() => import('../routes/integration/all/bluetooth/setup-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/bluetooth/setup/:uuid"
          getComponent={() =>
            import('../routes/integration/all/bluetooth/setup-page/setup-peripheral').then(m => m.default)
          }
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/bluetooth/config"
          getComponent={() => import('../routes/integration/all/bluetooth/settings-page').then(m => m.default)}
        />

        {/** BROADLINK ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/broadlink"
          getComponent={() => import('../routes/integration/all/broadlink/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/broadlink/edit"
          getComponent={() => import('../routes/integration/all/broadlink/remote-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/broadlink/edit/:deviceSelector"
          getComponent={() => import('../routes/integration/all/broadlink/remote-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/broadlink/peripheral"
          getComponent={() => import('../routes/integration/all/broadlink/peripheral-page').then(m => m.default)}
        />

        {/** LAN MANAGER ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/lan-manager"
          getComponent={() => import('../routes/integration/all/lan-manager/device-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/lan-manager/discover"
          getComponent={() => import('../routes/integration/all/lan-manager/discover-page').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/lan-manager/config"
          getComponent={() => import('../routes/integration/all/lan-manager/settings-page').then(m => m.default)}
        />

        {/** GOOGLE HOME & ALEXA ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/integration/communication/googlehome"
          getComponent={() => import('../routes/integration/all/google-home-gateway/welcome').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/google-home/authorize"
          getComponent={() => import('../routes/integration/all/google-home-gateway').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/communication/alexa"
          getComponent={() => import('../routes/integration/all/alexa-gateway/welcome').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/alexa/authorize"
          getComponent={() => import('../routes/integration/all/alexa-gateway').then(m => m.default)}
        />

        {/** OTHER DEVICE INTEGRATIONS */}
        <SafeAsyncRoute
          path="/dashboard/integration/device/owntracks"
          getComponent={() => import('../routes/integration/all/owntracks/welcome').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/enedis"
          getComponent={() => import('../routes/integration/all/enedis-gateway/Welcome').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/enedis/usage-points"
          getComponent={() => import('../routes/integration/all/enedis-gateway/UsagePoints').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/integration/device/enedis/redirect"
          getComponent={() => import('../routes/integration/all/enedis-gateway/Welcome').then(m => m.default)}
        />

        {/** MAIN APP ROUTES */}
        <SafeAsyncRoute path="/dashboard/chat" getComponent={() => import('../routes/chat').then(m => m.default)} />
        <SafeAsyncRoute path="/dashboard/maps" getComponent={() => import('../routes/map').then(m => m.default)} />
        <SafeAsyncRoute
          path="/dashboard/maps/area/new"
          getComponent={() => import('../routes/map/NewArea').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/maps/area/edit/:areaSelector"
          getComponent={() => import('../routes/map/NewArea').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/calendar"
          getComponent={() => import('../routes/calendar').then(m => m.default)}
        />
        <SafeAsyncRoute path="/dashboard/scene" getComponent={() => import('../routes/scene').then(m => m.default)} />
        <SafeAsyncRoute
          path="/dashboard/scene/new"
          getComponent={() => import('../routes/scene/new-scene').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/scene/:scene_selector/duplicate"
          getComponent={() => import('../routes/scene/duplicate-scene').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/scene/:scene_selector"
          getComponent={() => import('../routes/scene/edit-scene').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/profile"
          getComponent={() => import('../routes/profile').then(m => m.default)}
        />

        {/** SETTINGS ROUTES */}
        <SafeAsyncRoute
          path="/dashboard/settings/house"
          getComponent={() => import('../routes/settings/settings-house').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/session"
          getComponent={() => import('../routes/settings/settings-session').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/user"
          getComponent={() => import('../routes/settings/settings-users').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/user/edit/:user_selector"
          getComponent={() => import('../routes/settings/settings-users/edit-user').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/user/new"
          getComponent={() => import('../routes/settings/settings-users/create-user').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/system"
          getComponent={() => import('../routes/settings/settings-system').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/gateway"
          getComponent={() => import('../routes/settings/settings-gateway').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/service"
          getComponent={() => import('../routes/settings/settings-service').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/backup"
          getComponent={() => import('../routes/settings/settings-backup').then(m => m.default)}
        />
        <SafeAsyncRoute
          path="/dashboard/settings/jobs"
          getComponent={() => import('../routes/settings/settings-background-jobs').then(m => m.default)}
        />

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
