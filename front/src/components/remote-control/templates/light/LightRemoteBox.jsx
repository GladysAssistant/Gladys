import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import ButtonBox from '../../ButtonBox';
import ButtonOptions from './template';

const renderButton = (featureName, editionMode, featureByType, onClick) => (
  <ButtonBox
    category={DEVICE_FEATURE_CATEGORIES.LIGHT}
    featureName={featureName}
    buttonProps={ButtonOptions[featureName]}
    onClick={onClick}
    editionMode={editionMode}
    edited={featureByType && featureByType[featureName]}
  />
);

const LightRemoteBox = ({ editionMode, featureByType, onClick }) => (
  <div>
    <div class="d-flex">
      <div class="flex-fill btn-group">
        {renderButton(DEVICE_FEATURE_TYPES.LIGHT.DIMMER_BUTTON, editionMode, featureByType, onClick)}
        {renderButton(DEVICE_FEATURE_TYPES.LIGHT.BRIGHTER_BUTTON, editionMode, featureByType, onClick)}
      </div>
      <div class="flex-fill" />
      <div class="flex-fill btn-group">
        {renderButton(DEVICE_FEATURE_TYPES.LIGHT.POWER_OFF_BUTTON, editionMode, featureByType, onClick)}
        {renderButton(DEVICE_FEATURE_TYPES.LIGHT.POWER_ON_BUTTON, editionMode, featureByType, onClick)}
      </div>
    </div>

    <div class="d-flex btn-group mt-3">
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.RED_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.GREEN_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.BLUE_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.WHITE_BUTTON, editionMode, featureByType, onClick)}
    </div>

    <div class="d-flex btn-group mt-3">
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.RED_LIGHT_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.LIME_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.INDIGO_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.FLASH_BUTTON, editionMode, featureByType, onClick)}
    </div>

    <div class="d-flex btn-group mt-3">
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.ORANGE_DARK_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.TEAL_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.NIGHT_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.STROBE_BUTTON, editionMode, featureByType, onClick)}
    </div>

    <div class="d-flex btn-group mt-3">
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.ORANGE_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.CYAN_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.PURPLE_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.FADE_BUTTON, editionMode, featureByType, onClick)}
    </div>

    <div class="d-flex btn-group mt-3">
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.YELLOW_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.AZURE_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.PINK_BUTTON, editionMode, featureByType, onClick)}
      {renderButton(DEVICE_FEATURE_TYPES.LIGHT.SMOOTH_BUTTON, editionMode, featureByType, onClick)}
    </div>
  </div>
);

export default LightRemoteBox;
