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
  RoomValidationError: 'RoomValidationError',
  ConnectedNoDevice: 'ConnectedNoDevice',
  ServiceConnected: 'ServiceConnected',
  ServiceDisconnected: 'ServiceDisconnected'
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
    [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: 'sun',
    [DEVICE_FEATURE_TYPES.LIGHT.POWER]: 'zap',
    [DEVICE_FEATURE_TYPES.LIGHT.EFFECT_MODE]: 'play',
    [DEVICE_FEATURE_TYPES.LIGHT.EFFECT_SPEED]: 'activity',
    [DEVICE_FEATURE_TYPES.LIGHT.STRING]: 'sun'
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'thermometer'
  },
  [DEVICE_FEATURE_CATEGORIES.SETPOINT]: {
    [DEVICE_FEATURE_TYPES.SETPOINT.DECIMAL]: 'sliders',
    [DEVICE_FEATURE_TYPES.SETPOINT.INTEGER]: 'sliders',
    [DEVICE_FEATURE_TYPES.SETPOINT.STRING]: 'sliders'
  },
  [DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR]: {
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
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: 'power',
    [DEVICE_FEATURE_TYPES.SWITCH.BURGLAR]: 'users',
    [DEVICE_FEATURE_TYPES.SWITCH.POWER]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.ENERGY]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.CURRENT]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]: 'zap',
    [DEVICE_FEATURE_TYPES.SWITCH.DIMMER]: 'bar-chart-2',
    [DEVICE_FEATURE_TYPES.SWITCH.INTEGER]: 'power'
  },
  [DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'wind',
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'wind'
  },
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'cloud'
  },
  [DEVICE_FEATURE_CATEGORIES.WINDSPEED_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: 'wind',
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'wind'
  },
  [DEVICE_FEATURE_CATEGORIES.RAINFALL_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'cloud'
  },
  [DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.STRING]: 'rotate-cw',
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'rotate-cw'
  },
  [DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: 'volume'
  },
  [DEVICE_FEATURE_CATEGORIES.SIREN]: {
    [DEVICE_FEATURE_TYPES.SIREN.BINARY]: 'bell'
  },
  [DEVICE_FEATURE_CATEGORIES.ACCESS_CONTROL]: {
    [DEVICE_FEATURE_TYPES.ACCESS_CONTROL.MODE]: 'lock'
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'lock'
  },
  [DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: 'droplet'
  },
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: 'droplet'
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
  [DEVICE_FEATURE_CATEGORIES.INDEX]: {
    [DEVICE_FEATURE_TYPES.INDEX.INTEGER]: 'heart',
    [DEVICE_FEATURE_TYPES.INDEX.DIMMER]: 'heart'
  },
  [DEVICE_FEATURE_CATEGORIES.UNKNOWN]: {
    [DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN]: 'help-circle'
  }
};
