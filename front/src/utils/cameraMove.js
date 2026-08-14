import { CAMERA_MOVE } from '../../../server/utils/constants';

// Canonical description of each CAMERA_MOVE movement value: the feather icon used by the
// control surfaces (camera widget overlay, devices-in-room row) and the i18n key of its label
// (deviceFeatureAction.category.camera.move.<i18nKey>). STOP is not listed: it is always
// supported and rendered as the dedicated stop control.
export const CAMERA_MOVE_OPTIONS = [
  { value: CAMERA_MOVE.PAN_LEFT, i18nKey: 'pan-left', icon: 'arrow-left' },
  { value: CAMERA_MOVE.PAN_RIGHT, i18nKey: 'pan-right', icon: 'arrow-right' },
  { value: CAMERA_MOVE.TILT_UP, i18nKey: 'tilt-up', icon: 'arrow-up' },
  { value: CAMERA_MOVE.TILT_DOWN, i18nKey: 'tilt-down', icon: 'arrow-down' },
  { value: CAMERA_MOVE.ZOOM_IN, i18nKey: 'zoom-in', icon: 'zoom-in' },
  { value: CAMERA_MOVE.ZOOM_OUT, i18nKey: 'zoom-out', icon: 'zoom-out' }
];

// Movement values supported by a camera's move feature, derived from its supported_options.
// A feature without any supported_options row supports every movement (spec fallback,
// mirroring the AC-mode legacy behavior).
export const getSupportedMoves = moveFeature => {
  const supportedOptions =
    moveFeature && Array.isArray(moveFeature.supported_options) ? moveFeature.supported_options : [];
  if (supportedOptions.length === 0) {
    return CAMERA_MOVE_OPTIONS.map(option => option.value);
  }
  return supportedOptions.map(option => option.value);
};
