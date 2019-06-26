import { DEVICE_FEATURE_CATEGORIES } from '../../../server/utils/constants';

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

export const PhilipsHueGetBridgesStatus = {
  Getting: 'Getting',
  Success: 'Success',
  Error: 'Error'
};

export const SceneGetStatus = {
  Getting: 'Getting',
  Success: 'Success',
  Error: 'Error'
};

export const RequestStatus = {
  Getting: 'Getting',
  Success: 'Success',
  Error: 'Error',
  NetworkError: 'NetworkError',
  ConflictError: 'ConflictError',
  ValidationError: 'ValidationError',
  RateLimitError: 'RateLimitError',
  ServiceNotConfigured: 'ServiceNotConfigured'
};

export const GetWeatherStatus = {
  HouseHasNoCoordinates: 'HouseHasNoCoordinates',
  ServiceNotConfigured: 'ServiceNotConfigured',
  RequestToThirdPartyFailed: 'RequestToThirdPartyFailed'
};

export const DASHBOARD_BOX_STATUS_KEY = 'DashboardBoxStatus';
export const DASHBOARD_BOX_DATA_KEY = 'DashboardBoxData';

export const DeviceFeatureCategoriesIcon = {
  [DEVICE_FEATURE_CATEGORIES.BATTERY]: 'battery',
  [DEVICE_FEATURE_CATEGORIES.CAMERA]: 'camera',
  [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: 'eye',
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: 'fe-toggle-right',
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: 'thermometer',
  [DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR]: 'sun',
  [DEVICE_FEATURE_CATEGORIES.UNKNOWN]: 'help-circle'
};
