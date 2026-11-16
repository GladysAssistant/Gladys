import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import { route } from 'preact-router';
import get from 'get-value';

import { DEVICE_POLL_FREQUENCIES, DEVICE_FEATURE_CATEGORIES_LIST } from '../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../utils/consts';
import { isSheetEntryOnTop } from '../sheet/sheetHistory';
import BottomSheet from '../sheet/BottomSheet';
import withIntlAsProp from '../../utils/withIntlAsProp';
import {
  FocusPage,
  MobileNavBar,
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobileNotice,
  MobileField,
  fieldClass,
  MobileBottomBar,
  BigButton,
  DirtyLabel,
  MobileToast,
  kitStyle
} from '../mobile';
import FeatureHistorySize from './FeatureHistorySize';
import MobileFeatureSheet from './MobileFeatureSheet';
import style from './mobileUpdateDevice.css';

const POLL_FREQUENCIES = [
  { value: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES, textId: 'everyMinutes' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS, textId: 'every30Seconds' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS, textId: 'every10Seconds' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_2_SECONDS, textId: 'every2Seconds' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_SECONDS, textId: 'every1Seconds' }
];

// what the device looks like once saved: the comparison that tells whether something changed
const snapshotOf = device => (device ? JSON.stringify(device) : null);

/**
 * @description A device being edited, on a phone (docs/specs/mobile-pages/device-edit.md): the
 * name and the room first, one row per feature opening its sheet, and the save in the bottom
 * bar. Same props as the desktop card (UpdateDevice.jsx): the state, the requests and the
 * mutations stay in the container of the page.
 */
class MobileUpdateDevice extends Component {
  state = {
    // the device as loaded or last saved, serialized: null until the device is there
    savedSnapshot: snapshotOf(!this.props.loading ? this.props.device : null),
    // the feature of the sheet: the index stays while the sheet slides out
    featureIndex: null,
    featureOpen: false,
    addFeatureOpen: false,
    leaveOpen: false,
    errorClosed: false,
    toastKey: 0,
    toastVisible: false
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  componentDidUpdate(prevProps) {
    // the device just arrived: this is the saved version
    if (this.state.savedSnapshot === null && this.props.device && !this.props.loading) {
      this.rebase();
    }
    // a save went through: what is on screen is the saved version (the server may have completed
    // it — selectors, ids)
    const saveFinished =
      (prevProps.loading && !this.props.loading) ||
      (prevProps.saveStatus !== this.props.saveStatus && !this.props.loading);
    if (saveFinished && this.saving) {
      this.saving = false;
      if (this.props.saveStatus === RequestStatus.Success) {
        this.onSaved();
      } else {
        this.leaveAfterSave = false;
        this.showError();
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  rebase = () => this.setState({ savedSnapshot: snapshotOf(this.props.device) });

  showError = () => this.setState({ errorClosed: false });

  onSaved = () => {
    this.setState(prevState => ({
      savedSnapshot: snapshotOf(this.props.device),
      toastVisible: true,
      toastKey: prevState.toastKey + 1
    }));
    if (this.leaveAfterSave) {
      this.leaveAfterSave = false;
      this.leave();
    }
  };

  isDirty = () =>
    this.state.savedSnapshot !== null &&
    Boolean(this.props.device) &&
    snapshotOf(this.props.device) !== this.state.savedSnapshot;

  onBeforeUnload = event => {
    if (this.isDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  save = () => {
    this.saving = true;
    this.setState({ errorClosed: false });
    this.props.saveDevice();
  };

  // a navigation started while the entry of a sheet is on top of the history replaces it:
  // "back" from the next page then lands on this page once
  leave = () => route(this.props.backHref, isSheetEntryOnTop());

  onBack = () => {
    if (this.isDirty()) {
      this.setState({ leaveOpen: true });
    } else {
      this.leave();
    }
  };

  saveAndLeave = () => {
    this.leaveAfterSave = true;
    this.setState({ leaveOpen: false });
    this.save();
  };

  leaveWithoutSaving = () => {
    this.setState({ leaveOpen: false });
    this.leave();
  };

  closeLeave = () => {
    this.leaveAfterSave = false;
    this.setState({ leaveOpen: false });
  };

  closeError = () => this.setState({ errorClosed: true });
  closeToast = () => this.setState({ toastVisible: false });

  updateName = e => this.props.updateDeviceProperty('name', e.target.value);
  updateRoom = e => this.props.updateDeviceProperty('room_id', e.target.value);
  updatePollFrequency = e => this.props.updateDeviceProperty('poll_frequency', e.target.value);

  openFeature = index => () => this.setState({ featureIndex: index, featureOpen: true });
  closeFeature = () => this.setState({ featureOpen: false });

  deleteOpenFeature = () => {
    const index = this.state.featureIndex;
    this.setState({ featureOpen: false, featureIndex: null });
    this.props.deleteFeature(index);
  };

  openAddFeature = () => this.setState({ addFeatureOpen: true });
  closeAddFeature = () => this.setState({ addFeatureOpen: false });
  addFeature = () => {
    this.props.addFeature();
    this.setState({ addFeatureOpen: false });
  };

  renderFeatureRow = (feature, index) => {
    const typeLabel = <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />;
    const historyKept = feature.keep_history && feature.category !== 'music';
    return (
      <MobileRow
        key={feature.id || feature.selector || index}
        icon={get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`) || 'box'}
        title={feature.name || typeLabel}
        subtitle={
          <span>
            {feature.name && typeLabel}
            {feature.name && feature.unit && ' · '}
            {feature.unit && <Text id={`deviceFeatureUnitShort.${feature.unit}`}>{feature.unit}</Text>}
          </span>
        }
        meta={
          <span data-cy="device-feature-history">
            <Text id={historyKept ? 'editDeviceForm.mobile.historyKept' : 'editDeviceForm.mobile.historyNotKept'} />
            {historyKept && (
              <FeatureHistorySize
                device={this.props.device}
                feature={feature}
                inline
                hideEmpty
                class={style.historySize}
              />
            )}
          </span>
        }
        onClick={this.openFeature(index)}
        dataCy="device-feature-row"
      />
    );
  };

  render(props, { featureIndex, featureOpen, addFeatureOpen, leaveOpen, errorClosed, toastVisible, toastKey }) {
    const { device, loading, intl } = props;
    const dirty = this.isDirty();
    const saveFailed = props.saveStatus === RequestStatus.Error || props.saveStatus === RequestStatus.ConflictError;
    const error = saveFailed && !errorClosed && (
      <Text
        id={
          props.saveStatus === RequestStatus.ConflictError
            ? 'editDeviceForm.saveConflictError'
            : 'editDeviceForm.saveError'
        }
      />
    );
    const features = (device && device.features) || [];
    const sheetFeature = featureIndex !== null ? features[featureIndex] : null;
    return (
      <FocusPage>
        <div class={kitStyle.page} data-cy="device-edit-mobile">
          <MobileNavBar
            title={(device && device.name) || <Text id="editDeviceForm.noName" />}
            onBack={this.onBack}
            backLabel={props.backLabel}
          />
          <div class={`${kitStyle.content} ${device ? kitStyle.contentWithBottomBar : ''}`}>
            {loading && !device && (
              <div class="dimmer active">
                <div class="loader" />
                <div class={`dimmer-content ${style.loadingBlock}`} />
              </div>
            )}
            {!loading && !device && (
              <MobileNotice tone="danger" icon="alert-circle">
                <Text id="editDeviceForm.notFound" />
              </MobileNotice>
            )}
            {device && (
              <div>
                <MobileField label={<Text id="editDeviceForm.nameLabel" />} htmlFor="deviceName">
                  <Localizer>
                    <input
                      id="deviceName"
                      type="text"
                      class={fieldClass.input}
                      value={device.name}
                      onInput={this.updateName}
                      placeholder={<Text id="editDeviceForm.namePlaceholder" />}
                      autocomplete="off"
                      autocapitalize="sentences"
                      enterkeyhint="done"
                      data-cy="device-name"
                    />
                  </Localizer>
                </MobileField>
                <MobileField label={<Text id="editDeviceForm.roomLabel" />} htmlFor="room">
                  <select id="room" class={fieldClass.select} onChange={this.updateRoom} data-cy="device-room">
                    <option value="">{get(intl.dictionary, 'editDeviceForm.mobile.noRoom')}</option>
                    {props.houses &&
                      props.houses.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === device.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </MobileField>
                {device.should_poll && (
                  <MobileField label={<Text id="editDeviceForm.pollFrequency.label" />} htmlFor="pollFrequency">
                    <select
                      id="pollFrequency"
                      class={fieldClass.select}
                      onChange={this.updatePollFrequency}
                      value={device.poll_frequency}
                    >
                      {POLL_FREQUENCIES.map(frequency => (
                        <option value={frequency.value}>
                          {get(intl.dictionary, `editDeviceForm.pollFrequency.${frequency.textId}`)}
                        </option>
                      ))}
                    </select>
                  </MobileField>
                )}

                <MobileSectionHeader
                  title={
                    <Text
                      id="editDeviceForm.mobile.featuresTitle"
                      plural={features.length}
                      fields={{ count: features.length }}
                    />
                  }
                />
                {features.length > 0 && <MobileGroup>{features.map(this.renderFeatureRow)}</MobileGroup>}
                {features.length === 0 && (
                  <p class={kitStyle.footnote}>
                    <Text id="device.noFeatures" />
                  </p>
                )}
                {features.length > 0 && (
                  <div class={kitStyle.footnote}>
                    <MarkupText id="editDeviceForm.mobile.featuresHint" />
                  </div>
                )}
                {props.allowModifyFeatures && (
                  <button type="button" class={`${kitStyle.dashedButton} mt-3`} onClick={this.openAddFeature}>
                    <i class="fe fe-plus" aria-hidden="true" />
                    <Text id="editDeviceForm.addButton" />
                  </button>
                )}
              </div>
            )}
          </div>

          {device && (
            <MobileBottomBar error={error} onCloseError={this.closeError} dataCy="device-edit-bottom-bar">
              {dirty && <DirtyLabel />}
              <BigButton
                variant="primary"
                fit={dirty}
                onClick={this.save}
                disabled={!dirty}
                loading={loading}
                data-cy="device-save"
              >
                <Text id="editDeviceForm.saveButton" />
              </BigButton>
            </MobileBottomBar>
          )}

          <MobileFeatureSheet
            open={featureOpen && Boolean(sheetFeature)}
            feature={sheetFeature}
            featureIndex={featureIndex}
            device={device}
            canEditCategory={props.canEditCategory}
            allowModifyFeatures={props.allowModifyFeatures}
            updateFeatureProperty={props.updateFeatureProperty}
            deleteFeature={this.deleteOpenFeature}
            onClose={this.closeFeature}
          />

          {props.allowModifyFeatures && (
            <BottomSheet
              open={addFeatureOpen}
              title={get(intl.dictionary, 'editDeviceForm.addButton')}
              onClose={this.closeAddFeature}
              dataCy="device-add-feature-sheet"
            >
              <MobileField label={<Text id="editDeviceForm.mobile.featureType" />} htmlFor="newFeatureType">
                <select id="newFeatureType" class={fieldClass.select} onChange={props.selectFeature}>
                  <option value="" selected={!props.selectedFeature}>
                    {get(intl.dictionary, 'global.emptySelectOption')}
                  </option>
                  {DEVICE_FEATURE_CATEGORIES_LIST.map(category =>
                    Object.keys(DeviceFeatureCategoriesIcon[category] || {}).map(type => (
                      <option value={`${category}|${type}`}>
                        {get(intl.dictionary, `deviceFeatureCategory.${category}.${type}`)}
                      </option>
                    ))
                  )}
                </select>
              </MobileField>
              <BigButton variant="primary" onClick={this.addFeature} disabled={!props.selectedFeature}>
                <Text id="editDeviceForm.addButton" />
              </BigButton>
            </BottomSheet>
          )}

          <BottomSheet
            open={leaveOpen}
            title={get(intl.dictionary, 'mobileKit.leaveTitle')}
            onClose={this.closeLeave}
            dataCy="device-leave-confirm"
          >
            <p class={kitStyle.sheetText}>
              <Text id="mobileKit.leaveText" />
            </p>
            <div class={kitStyle.buttons}>
              <BigButton variant="primary" onClick={this.saveAndLeave} data-cy="device-leave-save">
                <Text id="mobileKit.saveAndLeave" />
              </BigButton>
              <BigButton variant="dangerSoft" onClick={this.leaveWithoutSaving} data-cy="device-leave-discard">
                <Text id="mobileKit.leaveWithoutSaving" />
              </BigButton>
              <BigButton variant="ghost" onClick={this.closeLeave} data-cy="device-leave-keep-editing">
                <Text id="mobileKit.keepEditing" />
              </BigButton>
            </div>
          </BottomSheet>

          <MobileToast
            message={toastVisible ? get(intl.dictionary, 'mobileKit.saved') : null}
            toastKey={toastKey}
            onClose={this.closeToast}
            aboveBar
            dataCy="device-saved-toast"
          />
        </div>
      </FocusPage>
    );
  }
}

export default withIntlAsProp(MobileUpdateDevice);
