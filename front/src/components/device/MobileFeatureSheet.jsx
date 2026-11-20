import { Text, Localizer, MarkupText } from 'preact-i18n';
import get from 'get-value';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS_BY_CATEGORY,
  DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE
} from '../../../../server/utils/constants';
import BottomSheet from '../sheet/BottomSheet';
import withIntlAsProp from '../../utils/withIntlAsProp';
import { MobileGroup, MobileRow, MobileField, MobileSwitch, fieldClass, BigButton, kitStyle } from '../mobile';
import FeatureHistorySize from './FeatureHistorySize';
import style from './mobileUpdateDevice.css';

// Same rule as the desktop card (UpdateDeviceFeature.jsx): the categories a feature may be moved to
const DEVICE_FEATURE_COMPATIBLE_CATEGORY = {
  [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: [DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_CATEGORIES.SWITCH],
  [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: [DEVICE_FEATURE_CATEGORIES.SHUTTER, DEVICE_FEATURE_CATEGORIES.CURTAIN]
};

/**
 * @description One feature of a device, in a sheet (docs/specs/mobile-pages/device-edit.md, C):
 * its name, its category when it can change, its unit, whether its history is kept, and its
 * external id. The fields write through the same `updateFeatureProperty` as the desktop card.
 */
const MobileFeatureSheet = ({
  open,
  feature,
  featureIndex,
  device,
  canEditCategory,
  allowModifyFeatures,
  updateFeatureProperty,
  deleteFeature,
  onClose,
  intl
}) => {
  if (!feature) {
    return null;
  }
  const update = property => e => updateFeatureProperty(featureIndex, property, e.target.value);
  const typeLabel = get(intl.dictionary, `deviceFeatureCategory.${feature.category}.${feature.type}`);
  // The current category must belong to the compatible list: types are not unique across
  // categories (SWITCH.BINARY and SENSOR.BINARY are both 'binary')
  const compatibleCategories = DEVICE_FEATURE_COMPATIBLE_CATEGORY[feature.type];
  const allowModifyCategory =
    canEditCategory &&
    canEditCategory(device, feature) &&
    compatibleCategories &&
    compatibleCategories.includes(feature.category);
  const availableUnits =
    get(DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE, `${feature.category}.${feature.type}`) ||
    DEVICE_FEATURE_UNITS_BY_CATEGORY[feature.category];
  // a music player is live: the core forces keep_history off on the whole category
  const hasHistory = feature.category !== DEVICE_FEATURE_CATEGORIES.MUSIC;
  return (
    <BottomSheet
      open={open}
      title={typeLabel || feature.name}
      onClose={onClose}
      onOk={onClose}
      dataCy="device-feature-sheet"
    >
      <MobileField label={<Text id="editDeviceForm.nameLabel" />} htmlFor="featureName">
        <Localizer>
          <input
            id="featureName"
            type="text"
            class={fieldClass.input}
            value={feature.name}
            onInput={update('name')}
            placeholder={<Text id="editDeviceForm.namePlaceholder" />}
            autocomplete="off"
            autocapitalize="sentences"
            enterkeyhint="done"
            data-cy="device-feature-name"
          />
        </Localizer>
      </MobileField>
      {allowModifyCategory && (
        <MobileField label={<Text id="editDeviceForm.featureCategoryLabel" />} htmlFor="featureCategory">
          <select
            id="featureCategory"
            class={fieldClass.select}
            value={feature.category}
            onChange={update('category')}
            data-cy="device-feature-category"
          >
            {compatibleCategories.map(category => (
              <option value={category}>
                {get(intl.dictionary, `deviceFeatureCategory.${category}.shortCategoryName`) || category}
              </option>
            ))}
          </select>
        </MobileField>
      )}
      {availableUnits && availableUnits.length > 0 && (
        <MobileField label={<Text id="editDeviceForm.unitLabel" />} htmlFor="featureUnit">
          <select
            id="featureUnit"
            class={fieldClass.select}
            value={feature.unit}
            onChange={update('unit')}
            data-cy="device-feature-unit"
          >
            <option value="">{get(intl.dictionary, 'global.emptySelectOption')}</option>
            {availableUnits.map(unit => (
              <option value={unit}>{get(intl.dictionary, `deviceFeatureUnit.${unit}`) || unit}</option>
            ))}
          </select>
        </MobileField>
      )}
      {allowModifyFeatures && (
        <div class={kitStyle.buttonsRow}>
          <MobileField label={<Text id="editDeviceForm.minLabel" />} htmlFor="featureMin" class={style.halfField}>
            <input
              id="featureMin"
              type="number"
              inputmode="decimal"
              class={fieldClass.input}
              value={feature.min}
              onInput={update('min')}
            />
          </MobileField>
          <MobileField label={<Text id="editDeviceForm.maxLabel" />} htmlFor="featureMax" class={style.halfField}>
            <input
              id="featureMax"
              type="number"
              inputmode="decimal"
              class={fieldClass.input}
              value={feature.max}
              onInput={update('max')}
            />
          </MobileField>
        </div>
      )}
      {hasHistory && (
        <div class={style.sheetBlock}>
          <MobileGroup>
            <MobileRow
              title={<Text id="editDeviceForm.mobile.keepHistory" />}
              subtitle={<FeatureHistorySize device={device} feature={feature} inline />}
              trailing={
                <MobileSwitch
                  checked={Boolean(feature.keep_history)}
                  onChange={checked => updateFeatureProperty(featureIndex, 'keep_history', checked)}
                  label={get(intl.dictionary, 'editDeviceForm.mobile.keepHistory')}
                  dataCy="device-feature-keep-history"
                />
              }
            />
          </MobileGroup>
          <div class={kitStyle.footnote}>
            <MarkupText id="editDeviceForm.keepHistoryDescription" />
          </div>
        </div>
      )}
      {allowModifyFeatures ? (
        <MobileField
          label={<Text id="editDeviceForm.externalIdLabel" />}
          htmlFor="featureExternalId"
          help={<Text id="editDeviceForm.externalIdMessage" />}
        >
          <Localizer>
            <input
              id="featureExternalId"
              type="text"
              class={fieldClass.input}
              value={feature.external_id}
              onInput={update('external_id')}
              placeholder={<Text id="editDeviceForm.externalIdPlaceholder" />}
              autocomplete="off"
              autocapitalize="off"
              spellcheck={false}
            />
          </Localizer>
        </MobileField>
      ) : (
        <div class={style.sheetBlock}>
          <div class={style.externalId}>
            <div class={style.externalIdLabel}>
              <Text id="editDeviceForm.externalIdLabel" />
            </div>
            <div class={style.externalIdValue} data-cy="device-feature-external-id">
              {feature.external_id}
            </div>
          </div>
          <p class={kitStyle.footnote}>
            <Text id="editDeviceForm.externalIdMessage" />
          </p>
        </div>
      )}
      {allowModifyFeatures && (
        <BigButton variant="dangerSoft" icon="trash-2" onClick={deleteFeature} data-cy="device-feature-delete">
          <Text id="editDeviceForm.deleteLabel" />
        </BigButton>
      )}
    </BottomSheet>
  );
};

export default withIntlAsProp(MobileFeatureSheet);
