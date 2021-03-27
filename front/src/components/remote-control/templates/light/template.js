import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import style from './style.css';

export default {
  [DEVICE_FEATURE_TYPES.LIGHT.POWER_ON_BUTTON]: {
    icon: 'power',
    buttonClass: 'btn-success flex-fill'
  },
  [DEVICE_FEATURE_TYPES.LIGHT.POWER_OFF_BUTTON]: {
    icon: 'power',
    buttonClass: 'btn-danger flex-fill'
  },
  [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTER_BUTTON]: {
    icon: 'sun',
    buttonClass: 'btn-secondary flex-fill'
  },
  [DEVICE_FEATURE_TYPES.LIGHT.DIMMER_BUTTON]: {
    icon: 'moon',
    buttonClass: 'btn-secondary flex-fill'
  },
  [DEVICE_FEATURE_TYPES.LIGHT.RED_BUTTON]: {
    text: 'R',
    buttonClass: `${style['btn-outline']} text-red flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.RED_LIGHT_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} ${style['text-red-light']} flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.ORANGE_DARK_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} ${style['text-orange-dark']} flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.ORANGE_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-orange flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.YELLOW_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-yellow flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.GREEN_BUTTON]: {
    text: 'G',
    buttonClass: `${style['btn-outline']} text-green flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.LIME_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-lime flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.TEAL_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-teal flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.CYAN_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-cyan flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.AZURE_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-azure flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.BLUE_BUTTON]: {
    text: 'B',
    buttonClass: `${style['btn-outline']} text-blue flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.NIGHT_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} ${style['text-night']} flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.INDIGO_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-indigo flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.PURPLE_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-purple flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.PINK_BUTTON]: {
    icon: 'minus',
    buttonClass: `${style['btn-outline']} text-pink flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.WHITE_BUTTON]: {
    text: 'W',
    buttonClass: `${style['btn-outline']} text-gray flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.FLASH_BUTTON]: {
    icon: 'zap',
    buttonClass: `${style['btn-rainbow']} flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.STROBE_BUTTON]: {
    icon: 'play',
    buttonClass: `${style['btn-gradient-night']} flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.FADE_BUTTON]: {
    icon: 'bar-chart-2',
    buttonClass: `${style['btn-rainbow']} flex-fill`
  },
  [DEVICE_FEATURE_TYPES.LIGHT.SMOOTH_BUTTON]: {
    icon: 'fast-forward',
    buttonClass: `${style['btn-rainbow']} flex-fill`
  }
};
