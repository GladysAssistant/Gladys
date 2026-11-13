import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import BottomSheet from '../sheet/BottomSheet';
import DeviceFeaturePicker from './DeviceFeaturePicker';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import { getDeviceFeatureDescription } from '../../utils/device';
import { isMobileViewport, watchMobileViewport } from '../../utils/mobileViewport';
import withIntlAsProp from '../../utils/withIntlAsProp';
import style from './devicePickerField.css';

// the picker's sheet opens from a field that already sits in a sheet (a step or a trigger of the
// mobile scene editor, themselves stacked by depth): it goes above any of them
const PICKER_SHEET_DEPTH = 10;

const getFeatureIcon = (feature, defaultIcon) =>
  (feature && get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)) || defaultIcon || 'sliders';

/**
 * @description A multi-selection of devices (or device features) as a form field, for a phone
 * (docs/specs/scene-editor-mobile.md, E.10): the selection reads as rows (icon, name, room, a
 * 44px remove button), and one button opens the device picker of the dashboard
 * (DeviceFeaturePicker: search, room chips, checkbox rows) in a full-height sheet, where devices
 * are added and removed in one validation. On a wider screen the field renders its children,
 * the select the form already had.
 *
 * devices: the devices to pick from, each with its room and its features (null while loading).
 * selected: the selectors of the selection (device selectors with pickDevices, feature selectors
 * otherwise). onChange receives the new ordered selection.
 * single: one device at most. The field shows it with a "Change" button, tapping a row of the
 * picker replaces it and closes the sheet; the selection can only be emptied with clearable.
 * defaultIcon: the icon of a device whose features do not tell one (a camera).
 */
class DevicePickerField extends Component {
  state = {
    isMobile: isMobileViewport(),
    pickerOpen: false
  };

  componentDidMount() {
    this.unwatchViewport = watchMobileViewport(isMobile => this.setState({ isMobile }));
  }

  componentWillUnmount() {
    if (this.unwatchViewport) {
      this.unwatchViewport();
    }
  }

  openPicker = () => this.setState({ pickerOpen: true });
  closePicker = () => this.setState({ pickerOpen: false });

  validatePicker = selected => {
    this.setState({ pickerOpen: false });
    this.props.onChange(selected);
  };

  remove = selector => () => {
    this.props.onChange((this.props.selected || []).filter(selected => selected !== selector));
  };

  // what a selector of the selection stands for: its name, its room and its icon. A selector
  // whose device is gone (or not loaded yet) keeps its row, so it can still be removed.
  getItems() {
    const { devices, selected, pickDevices, filterFeature, intl } = this.props;
    return (selected || []).map(selector => {
      let match = null;
      (devices || []).some(device => {
        const features = (device.features || []).filter(feature => !filterFeature || filterFeature(feature, device));
        if (pickDevices) {
          if (device.selector === selector) {
            match = { name: device.name, room: get(device, 'room.name'), feature: features[0] || null };
          }
        } else {
          const feature = features.find(candidate => candidate.selector === selector);
          if (feature) {
            // the device on the first line, what is measured and where on the second
            match = {
              name: device.name,
              room: [getDeviceFeatureDescription(intl.dictionary, device, feature), get(device, 'room.name')]
                .filter(Boolean)
                .join(' · '),
              feature
            };
          }
        }
        return match !== null;
      });
      return { selector, ...(match || { name: selector, notFound: true }) };
    });
  }

  render(props, { isMobile, pickerOpen }) {
    if (!isMobile) {
      return props.children;
    }
    const items = this.getItems();
    const loading = !props.devices;
    const removable = !props.single || props.clearable;
    let openLabelId = 'devicePickerField.choose';
    let openIcon = 'plus';
    if (props.single) {
      openLabelId = items.length > 0 ? 'devicePickerField.changeOne' : 'devicePickerField.chooseOne';
      openIcon = items.length > 0 ? 'repeat' : 'plus';
    } else if (items.length > 0) {
      openLabelId = 'devicePickerField.edit';
      openIcon = 'edit-2';
    }
    return (
      <div class={style.field} data-cy={props.dataCy || 'device-picker-field'}>
        {items.length > 0 && (
          <ul class={style.items}>
            {items.map(item => (
              <li class={style.item} key={item.selector} data-cy={`device-picker-item-${item.selector}`}>
                <span class={style.itemIcon} aria-hidden="true">
                  <i class={`fe fe-${getFeatureIcon(item.feature, props.defaultIcon)}`} />
                </span>
                <span class={style.itemText}>
                  <span class={style.itemName}>{item.name}</span>
                  {(item.room || item.notFound) && !loading && (
                    <span class={style.itemRoom}>
                      {item.notFound ? <Text id="devicePickerField.notFound" /> : item.room}
                    </span>
                  )}
                </span>
                {removable && (
                  <Localizer>
                    <button
                      type="button"
                      class={style.removeButton}
                      onClick={this.remove(item.selector)}
                      aria-label={<Text id="devicePickerField.remove" fields={{ name: item.name }} />}
                      data-cy={`device-picker-remove-${item.selector}`}
                    >
                      <i class="fe fe-x" aria-hidden="true" />
                    </button>
                  </Localizer>
                )}
              </li>
            ))}
          </ul>
        )}
        {items.length === 0 && (
          <p class={style.empty}>
            <Text id="devicePickerField.empty" />
          </p>
        )}
        <button
          type="button"
          class={style.openButton}
          onClick={this.openPicker}
          disabled={loading || props.disabled}
          data-cy="device-picker-open"
        >
          <i class={`fe fe-${openIcon}`} aria-hidden="true" />
          <Text id={openLabelId} />
        </button>

        <BottomSheet
          open={pickerOpen}
          size="full"
          depth={PICKER_SHEET_DEPTH}
          title={
            props.sheetTitle ||
            get(props.intl.dictionary, props.single ? 'devicePickerField.titleOne' : 'devicePickerField.title')
          }
          onClose={this.closePicker}
          dataCy="device-picker-sheet"
        >
          {pickerOpen && (
            <div class={style.pickerHost}>
              <DeviceFeaturePicker
                devices={props.devices}
                selected={props.selected || []}
                filterFeature={props.filterFeature}
                pickDevices={props.pickDevices}
                sameKindOnly={props.sameKindOnly}
                single={props.single}
                defaultIcon={props.defaultIcon}
                onValidate={this.validatePicker}
                onCancel={this.closePicker}
                hideBackButton
              />
            </div>
          )}
        </BottomSheet>
      </div>
    );
  }
}

export default withIntlAsProp(DevicePickerField);
