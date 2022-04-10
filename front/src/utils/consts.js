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
    [DEVICE_FEATURE_TYPES.CAMERA.IMAGE]: 'device-cctv'
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
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: 'brightness-half',
    [DEVICE_FEATURE_TYPES.LIGHT.HUE]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: 'palette',
    [DEVICE_FEATURE_TYPES.LIGHT.SATURATION]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: 'thermometer',
    [DEVICE_FEATURE_TYPES.LIGHT.POWER]: 'zap',
    [DEVICE_FEATURE_TYPES.LIGHT.EFFECT_MODE]: 'player-play',
    [DEVICE_FEATURE_TYPES.LIGHT.EFFECT_SPEED]: 'activity'
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'temperature'
  },
  [DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR]: {
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.BINARY]: 'alert-circle',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.STATUS]: 'alert-circle',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.TILT_ANGLE]: 'rotate-clockwise-2',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_X]: 'axis-x',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_Y]: 'axis-y',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_Z]: 'zap',
    [DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.BED_ACTIVITY]: 'moon'
  },
  [DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: 'numbers'
  },
  [DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: 'flare',
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'flare'
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
    [DEVICE_FEATURE_TYPES.TELEVISION.GUIDE]: 'book',
    [DEVICE_FEATURE_TYPES.TELEVISION.MENU]: 'menu',
    [DEVICE_FEATURE_TYPES.TELEVISION.TOOLS]: 'settings',
    [DEVICE_FEATURE_TYPES.TELEVISION.INFO]: 'info',
    [DEVICE_FEATURE_TYPES.TELEVISION.ENTER]: 'corner-down-left',
    [DEVICE_FEATURE_TYPES.TELEVISION.RETURN]: 'rotate-ccw',
    [DEVICE_FEATURE_TYPES.TELEVISION.EXIT]: 'x',
    [DEVICE_FEATURE_TYPES.TELEVISION.LEFT]: 'arrow-left',
    [DEVICE_FEATURE_TYPES.TELEVISION.RIGHT]: 'arrow-right',
    [DEVICE_FEATURE_TYPES.TELEVISION.UP]: 'arrow-up',
    [DEVICE_FEATURE_TYPES.TELEVISION.DOWN]: 'arrow-down',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_UP]: 'arrow-up',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_DOWN]: 'arrow-down',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_PREVIOUS]: 'arrow-left',
    [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL]: 'hash',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP]: 'volume-2',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN]: 'volume',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE]: 'volume-x',
    [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME]: 'volume',
    [DEVICE_FEATURE_TYPES.TELEVISION.PLAY]: 'player-play',
    [DEVICE_FEATURE_TYPES.TELEVISION.PAUSE]: 'player-pause',
    [DEVICE_FEATURE_TYPES.TELEVISION.STOP]: 'player-stop',
    [DEVICE_FEATURE_TYPES.TELEVISION.REWIND]: 'rewind',
    [DEVICE_FEATURE_TYPES.TELEVISION.FORWARD]: 'fast-forward',
    [DEVICE_FEATURE_TYPES.TELEVISION.RECORD]: 'circle'
  },
  [DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'flame',
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'flame'
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
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'lock-square'
  },
  [DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'drop-circle'
  },
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'droplet-filled-2'
  },
  [DEVICE_FEATURE_CATEGORIES.CO_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'alert-circle'
  },
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'bar-chart-2'
  },
  [DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'ruler-2'
  },
  [DEVICE_FEATURE_CATEGORIES.CUBE]: {
    [DEVICE_FEATURE_TYPES.CUBE.MODE]: 'activity',
    [DEVICE_FEATURE_TYPES.CUBE.ROTATION]: 'rotate-cw'
  },
  [DEVICE_FEATURE_CATEGORIES.BUTTON]: {
    [DEVICE_FEATURE_TYPES.BUTTON.CLICK]: 'circle-dot'
  },
  [DEVICE_FEATURE_CATEGORIES.UNKNOWN]: {
    [DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN]: 'help-circle'
  }
};
