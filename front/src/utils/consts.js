import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../server/utils/constants';

export const LoginStatus = {
  Processing: 'Processing',
  WrongCredentialsError: 'WrongCredentialsError',
  WrongEmailError: 'WrongEmailError',
  LoginSuccess: 'LoginSuccess'
};

export const CreateUserErrors = {
  PasswordTooShort: 'PasswordTooShort',
  PasswordNotMatching: 'PasswordNotMatching',
  InvalidEmail: 'InvalidEmail',
  InstanceAlreadyConfigured: 'InstanceAlreadyConfigured'
};

export const ForgotPasswordStatus = {
  WrongEmailError: 'WrongEmailError',
  UserNotFound: 'UserNotFound'
};

export const ResetPasswordStatus = {
  ResetTokenNotFound: 'ResetTokenNotFound'
};

export const TelegramGetApiKeyStatus = {
  Getting: 'Getting',
  GetError: 'GetError',
  Success: 'Success'
};

export const TelegramSaveApiKeyStatus = {
  Saving: 'Saving',
  SavingError: 'SavingError',
  Success: 'Success'
};

export const DeviceGetByRoomStatus = {
  Getting: 'Getting',
  Success: 'Success',
  Error: 'Error'
};

export const SceneGetStatus = {
  Getting: 'Getting',
  Success: 'Success',
  Error: 'Error'
};

export const CalDAVStatus = {
  Getting: 'Getting',
  Success: 'Success',
  Error: 'Error',
  BadCredentialsError: 'BadCredentialsError',
  BadUrlError: 'BadUrlError',
  RetrievePrincipalUrlError: 'RetrievePrincipalUrlError',
  RetrieveHomeUrlError: 'RetrieveHomeUrlError',
  RequestCalendarsError: 'RequestCalendarsError',
  RequestChangesError: 'RequestChangesError',
  RequestEventsError: 'RequestEventsError'
};

export const CalendarGetEventsStatus = {
  Getting: 'Getting',
  GetError: 'GetError',
  Success: 'Success'
};

export const RequestStatus = {
  Getting: 'Getting',
  Success: 'Success',
  Error: 'Error',
  NetworkError: 'NetworkError',
  ConflictError: 'ConflictError',
  ValidationError: 'ValidationError',
  RateLimitError: 'RateLimitError',
  ServiceNotConfigured: 'ServiceNotConfigured',
  GatewayNoInstanceFound: 'GatewayNoInstanceFound',
  UserNotAcceptedLocally: 'UserNotAcceptedLocally',
  PhilipsHueBridgeButtonNotPressed: 'PhilipsHueBridgeButtonNotPressed',
  RoomConflictError: 'RoomConflictError',
  RoomValidationError: 'RoomValidationError'
};

export const GetWeatherStatus = {
  HouseHasNoCoordinates: 'HouseHasNoCoordinates',
  ServiceNotConfigured: 'ServiceNotConfigured',
  RequestToThirdPartyFailed: 'RequestToThirdPartyFailed'
};

export const GetWeatherModes = {
  AdvancedWeather: 'advancedWeather',
  HourlyForecast: 'hourlyForecast',
  DailyForecast: 'dailyForecast'
};

export const DASHBOARD_BOX_STATUS_KEY = 'DashboardBoxStatus';
export const DASHBOARD_BOX_DATA_KEY = 'DashboardBoxData';

export const DeviceFeatureCategoriesIcon = {
  [DEVICE_FEATURE_CATEGORIES.BATTERY]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: 'battery'
  },
  [DEVICE_FEATURE_CATEGORIES.CAMERA]: {
    [DEVICE_FEATURE_TYPES.CAMERA.IMAGE]: 'camera'
  },
  [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'eye',
    [DEVICE_FEATURE_TYPES.SENSOR.PUSH]: 'eye'
  },
  [DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.PUSH]: 'users'
  },
  [DEVICE_FEATURE_CATEGORIES.SISMIC_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'activity'
  },
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.HUE]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.SATURATION]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: 'thermometer',
    [DEVICE_FEATURE_TYPES.LIGHT.POWER]: 'zap',
    [DEVICE_FEATURE_TYPES.LIGHT.EFFECT_MODE]: 'play',
    [DEVICE_FEATURE_TYPES.LIGHT.EFFECT_SPEED]: 'activity'
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'thermometer'
  },
  [DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'cpu'
  },
  [DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR]: {
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.BINARY]: 'alert-circle',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.STATUS]: 'alert-circle',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.TILT_ANGLE]: 'rotate-cw',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_X]: 'zap',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_Y]: 'zap',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_Z]: 'zap',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.BED_ACTIVITY]: 'moon'
  },
  [DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: 'plus'
  },
  [DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: 'sun',
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'sun'
  },
  [DEVICE_FEATURE_CATEGORIES.SIGNAL]: {
    [DEVICE_FEATURE_TYPES.SIGNAL.QUALITY]: 'radio'
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: 'power',
    [DEVICE_FEATURE_TYPES.SWITCH.BURGLAR]: 'users',
    [DEVICE_FEATURE_TYPES.SWITCH.POWER]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.ENERGY]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.CURRENT]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.DIMMER]: 'bar-chart-2'
  },
  [DEVICE_FEATURE_CATEGORIES.TELEVISION]: {
    [DEVICE_FEATURE_TYPES.TELEVISION.BINARY]: 'power',
    [DEVICE_FEATURE_TYPES.TELEVISION.SOURCE]: 'airplay',
    [DEVICE_FEATURE_TYPES.TELEVISION.GUIDE]: 'book-open',
    [DEVICE_FEATURE_TYPES.TELEVISION.MENU]: 'menu',
    [DEVICE_FEATURE_TYPES.TELEVISION.TOOLS]: 'settings',
    [DEVICE_FEATURE_TYPES.TELEVISION.INFO]: 'info',
    [DEVICE_FEATURE_TYPES.TELEVISION.ENTER]: 'corner-down-left',
    [DEVICE_FEATURE_TYPES.TELEVISION.RETURN]: 'rotate-ccw',
    [DEVICE_FEATURE_TYPES.TELEVISION.EXIT]: 'x',
    [DEVICE_FEATURE_TYPES.TELEVISION.LEFT]: 'chevron-left',
    [DEVICE_FEATURE_TYPES.TELEVISION.RIGHT]: 'chevron-right',
    [DEVICE_FEATURE_TYPES.TELEVISION.UP]: 'chevron-up',
    [DEVICE_FEATURE_TYPES.TELEVISION.DOWN]: 'chevron-down',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_UP]: 'chevron-up',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_DOWN]: 'chevron-down',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_PREVIOUS]: 'chevrons-left',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL]: 'hash',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP]: 'volume-2',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN]: 'volume',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE]: 'volume-x',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME]: 'volume-1',
    [DEVICE_FEATURE_TYPES.TELEVISION.PLAY]: 'play',
    [DEVICE_FEATURE_TYPES.TELEVISION.PAUSE]: 'pause',
    [DEVICE_FEATURE_TYPES.TELEVISION.STOP]: 'square',
    [DEVICE_FEATURE_TYPES.TELEVISION.REWIND]: 'rewind',
    [DEVICE_FEATURE_TYPES.TELEVISION.FORWARD]: 'fast-forward',
    [DEVICE_FEATURE_TYPES.TELEVISION.RECORD]: 'circle'
  },
  [DEVICE_FEATURE_CATEGORIES.SHUTTER]: {
    [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: 'sliders',
    [DEVICE_FEATURE_TYPES.SHUTTER.POSITION]: 'sliders'
  },
  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: {
    [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: 'sliders',
    [DEVICE_FEATURE_TYPES.CURTAIN.POSITION]: 'sliders'
  },
  [DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'wind',
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'wind'
  },
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'cloud'
  },
  [DEVICE_FEATURE_CATEGORIES.SIREN]: {
    [DEVICE_FEATURE_TYPES.SIREN.BINARY]: 'bell'
  },
  [DEVICE_FEATURE_CATEGORIES.ACCESS_CONTROL]: {
    [DEVICE_FEATURE_TYPES.ACCESS_CONTROL.MODE]: 'lock'
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'info'
  },
  [DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'droplet'
  },
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'droplet'
  },
  [DEVICE_FEATURE_CATEGORIES.CO_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'alert-circle'
  },
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'bar-chart-2'
  },
  [DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'italic'
  },
  [DEVICE_FEATURE_CATEGORIES.CUBE]: {
    [DEVICE_FEATURE_TYPES.CUBE.MODE]: 'activity',
    [DEVICE_FEATURE_TYPES.CUBE.ROTATION]: 'rotate-cw'
  },
  [DEVICE_FEATURE_CATEGORIES.BUTTON]: {
    [DEVICE_FEATURE_TYPES.BUTTON.CLICK]: 'circle'
  },
  [DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR]: {
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.BINARY]: 'power',
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER]: 'zap',
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY]: 'zap',
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT]: 'zap',
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE]: 'zap',
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX]: 'zap'
  },
  [DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SPEED_SENSOR.DECIMAL]: 'wind'
  },
  [DEVICE_FEATURE_CATEGORIES.UV_SENSOR]: {
    [DEVICE_FEATURE_TYPES.UV_SENSOR.INTEGER]: 'sun'
  },
  [DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR]: {
    [DEVICE_FEATURE_TYPES.PRECIPITATION_SENSOR.DECIMAL]: 'umbrella'
  },
  [DEVICE_FEATURE_CATEGORIES.CURRENCY]: {
    [DEVICE_FEATURE_TYPES.CURRENCY.DECIMAL]: 'dollar-sign'
  },
  [DEVICE_FEATURE_CATEGORIES.VOLUME_SENSOR]: {
    [DEVICE_FEATURE_TYPES.VOLUME_SENSOR.DECIMAL]: 'package',
    [DEVICE_FEATURE_TYPES.VOLUME_SENSOR.INTEGER]: 'package'
  },
  [DEVICE_FEATURE_CATEGORIES.DURATION]: {
    [DEVICE_FEATURE_TYPES.DURATION.DECIMAL]: 'watch',
    [DEVICE_FEATURE_TYPES.DURATION.INTEGER]: 'clock'
  },
  [DEVICE_FEATURE_CATEGORIES.VOC_SENSOR]: {
    [DEVICE_FEATURE_TYPES.VOC_SENSOR.DECIMAL]: 'bar-chart-2'
  },
  [DEVICE_FEATURE_CATEGORIES.DATA]: {
    [DEVICE_FEATURE_TYPES.DATA.SIZE]: 'hard-drive'
  },
  [DEVICE_FEATURE_CATEGORIES.DATARATE]: {
    [DEVICE_FEATURE_TYPES.DATARATE.RATE]: 'activity'
  },
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: 'thermometer'
  },
  [DEVICE_FEATURE_CATEGORIES.UNKNOWN]: {
    [DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN]: 'help-circle'
  }
};
