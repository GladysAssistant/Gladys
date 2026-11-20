import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { route } from 'preact-router';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../components/sheet/BottomSheet';
import { isSheetEntryOnTop } from '../../components/sheet/sheetHistory';
import withIntlAsProp from '../../utils/withIntlAsProp';
import {
  FocusPage,
  MobileNavBar,
  MobileGroup,
  MobileRow,
  MobileField,
  MobileNotice,
  fieldClass,
  BigButton,
  ConfirmSheet,
  SystemBackGuard,
  kitStyle
} from '../../components/mobile';
import MobileAreaMap from './MobileAreaMap';
import { AREA_COLORS } from './areaColors';
import {
  MIN_RADIUS,
  MAX_RADIUS,
  SLIDER_STEPS,
  clampRadius,
  parseRadius,
  radiusToSlider,
  sliderToRadius,
  stepRadius
} from './areaRadius';
import mapStyle from './style.css';
import style from './mobileArea.css';

const MAP_PAGE_PATH = '/dashboard/maps';
const MESSAGE_DURATION_MS = 5000;

const isLocated = house =>
  house.latitude !== null && house.latitude !== undefined && house.longitude !== null && house.longitude !== undefined;

// what is compared to tell whether the zone changed: the radius as a number, typed or not
const comparable = area =>
  JSON.stringify([area.name, area.color, parseRadius(area.radius), area.latitude, area.longitude]);

/**
 * @description A zone created or edited on a phone (docs/specs/mobile-pages/map-areas.md): the
 * map fills the screen, the zone is drawn on it with a finger, and a panel under it holds the
 * name, the radius and the save. Same state and requests as the desktop form (NewArea.jsx).
 */
class MobileNewArea extends Component {
  state = {
    detailsOpen: false,
    deleteOpen: false,
    leaveOpen: false,
    housesOpen: false,
    locating: false,
    // the radius while it is typed: an empty field or a value below the minimum is not a radius yet
    radiusDraft: null,
    // { textId, fields, undo } — a message about the map, shown above the panel
    message: null,
    errorClosed: false
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  componentDidUpdate(prevProps) {
    // a new error is shown even when the previous one was closed
    const hadError = prevProps.createAreaError || prevProps.deleteAreaError;
    const hasError = this.props.createAreaError || this.props.deleteAreaError;
    if (hasError && !hadError && this.state.errorClosed) {
      this.showError();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    clearTimeout(this.messageTimer);
  }

  showError = () => this.setState({ errorClosed: false });
  closeError = () => this.setState({ errorClosed: true });

  isDirty = () => Boolean(this.props.initialArea) && comparable(this.props) !== comparable(this.props.initialArea);

  onBeforeUnload = event => {
    if (this.isDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  // What keeps the zone from being saved, the most basic first
  getMissing = () => {
    if (this.props.latitude === null || this.props.longitude === null) {
      return 'center';
    }
    if (parseRadius(this.props.radius) === null || this.state.radiusDraft !== null) {
      return 'radius';
    }
    if (!this.props.name || this.props.name.trim().length === 0) {
      return 'name';
    }
    return null;
  };

  // ---------- leaving ----------

  // a navigation started while the entry of a sheet is on top of the history replaces it
  leave = () => route(MAP_PAGE_PATH, isSheetEntryOnTop());

  onBack = () => {
    if (this.isDirty()) {
      this.setState({ leaveOpen: true });
    } else {
      this.leave();
    }
  };

  // the system "back" with unsaved changes (SystemBackGuard): the same sheet as the back control
  openLeave = () => this.setState({ leaveOpen: true });

  closeLeave = () => this.setState({ leaveOpen: false });

  leaveWithoutSaving = () => {
    this.setState({ leaveOpen: false });
    this.leave();
  };

  save = () => {
    // one request at a time: a zone being loaded, saved or deleted is not saved again
    if (this.props.loading) {
      return;
    }
    this.setState({ errorClosed: false, leaveOpen: false });
    // the page leaves for the map once the zone is saved
    this.props.saveArea();
  };

  // ---------- name and color ----------

  openDetails = () => {
    this.setState({ detailsOpen: true });
    // a zone with no name yet: the field is ready to be typed in
    if (!this.props.name) {
      setTimeout(() => {
        if (this.nameInput && !this.unmounted) {
          this.nameInput.focus();
        }
      }, 60);
    }
  };

  closeDetails = () => this.setState({ detailsOpen: false });

  setNameInputRef = element => {
    this.nameInput = element;
  };

  onNameKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.closeDetails();
    }
  };

  selectColor = color => () => this.props.setColor(color);

  // ---------- radius ----------

  setRadius = radius => {
    this.setState({ radiusDraft: null });
    this.props.setRadiusValue(radius);
  };

  onRadiusInput = event => {
    const digits = event.target.value.replace(/[^0-9]/g, '');
    const radius = parseRadius(digits);
    if (radius !== null && radius >= MIN_RADIUS && radius <= MAX_RADIUS) {
      this.setRadius(radius);
    } else {
      // not a radius yet ("", "1" on the way to "150"): kept in the field, the zone waits
      this.setState({ radiusDraft: digits });
    }
  };

  // leaving the field on a value out of bounds brings it back to the nearest one
  onRadiusBlur = () => {
    const { radiusDraft } = this.state;
    if (radiusDraft === null) {
      return;
    }
    const radius = parseRadius(radiusDraft);
    if (radius === null) {
      this.setState({ radiusDraft: null });
    } else {
      this.setRadius(clampRadius(radius));
    }
  };

  onRadiusKeyDown = event => {
    if (event.key === 'Enter') {
      event.target.blur();
    }
  };

  onSliderInput = event => this.setRadius(sliderToRadius(event.target.value));

  decreaseRadius = () => this.setRadius(stepRadius(this.props.radius, -1));
  increaseRadius = () => this.setRadius(stepRadius(this.props.radius, 1));

  // ---------- placing the zone without a gesture ----------

  showMessage = message => {
    clearTimeout(this.messageTimer);
    this.setState({ message });
    this.messageTimer = setTimeout(this.closeMessage, MESSAGE_DURATION_MS);
  };

  closeMessage = () => {
    clearTimeout(this.messageTimer);
    if (!this.unmounted) {
      this.setState({ message: null });
    }
  };

  // Places the zone somewhere, and offers to put it back where it was
  placeArea = (latitude, longitude, textId, fields) => {
    const previous = { latitude: this.props.latitude, longitude: this.props.longitude };
    const hadCenter = previous.latitude !== null && previous.longitude !== null;
    this.props.setLatLong(latitude, longitude);
    this.showMessage({
      textId,
      fields,
      undo: hadCenter ? () => this.props.setLatLong(previous.latitude, previous.longitude) : null
    });
  };

  undoMessage = () => {
    const { message } = this.state;
    this.closeMessage();
    if (message && message.undo) {
      message.undo();
    }
  };

  locate = () => {
    if (!navigator.geolocation) {
      this.showMessage({ textId: 'newArea.mobile.positionUnavailable' });
      return;
    }
    this.setState({ locating: true });
    navigator.geolocation.getCurrentPosition(
      position => {
        if (this.unmounted) {
          return;
        }
        this.setState({ locating: false });
        // the position arrives while the zone is being saved or deleted: it is not placed there
        // anymore, the request has left with the zone as it was
        if (this.props.loading) {
          return;
        }
        this.placeArea(position.coords.latitude, position.coords.longitude, 'newArea.mobile.placedAtPosition');
      },
      error => {
        if (this.unmounted) {
          return;
        }
        this.setState({ locating: false });
        // 1: the permission was refused — or the page is not served over HTTPS
        this.showMessage({
          textId: error && error.code === 1 ? 'newArea.mobile.positionDenied' : 'newArea.mobile.positionUnavailable'
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  getLocatedHouses = () => (this.props.houses || []).filter(isLocated);

  placeAtHouse = house => () => {
    this.setState({ housesOpen: false });
    this.placeArea(house.latitude, house.longitude, 'newArea.mobile.placedAtHouse', { name: house.name });
  };

  onHouseButton = () => {
    const houses = this.getLocatedHouses();
    if (houses.length === 1) {
      this.placeAtHouse(houses[0])();
    } else {
      this.setState({ housesOpen: true });
    }
  };

  closeHouses = () => this.setState({ housesOpen: false });

  // ---------- deleting ----------

  openDelete = () => this.setState({ deleteOpen: true });
  closeDelete = () => this.setState({ deleteOpen: false });

  confirmDelete = () => {
    this.setState({ deleteOpen: false, errorClosed: false });
    this.props.removeArea();
  };

  renderError() {
    const { createAreaError, deleteAreaError } = this.props;
    if (this.state.errorClosed || (!createAreaError && !deleteAreaError)) {
      return null;
    }
    return (
      <div class={cx(kitStyle.errorBanner, style.panelError)} role="alert" data-cy="zone-error">
        <div class={kitStyle.errorBannerText}>
          <Text id={deleteAreaError ? 'newArea.deleteAreaError' : 'newArea.mobile.saveError'} />
        </div>
        <Localizer>
          <button
            type="button"
            class={kitStyle.errorBannerClose}
            onClick={this.closeError}
            aria-label={<Text id="mobileKit.close" />}
          >
            <i class="fe fe-x" aria-hidden="true" />
          </button>
        </Localizer>
      </div>
    );
  }

  render(props, { detailsOpen, deleteOpen, leaveOpen, housesOpen, locating, radiusDraft, message }) {
    const { intl, creationMode, name, color, radius, loading } = props;
    const dictionary = intl.dictionary;
    const missing = this.getMissing();
    const dirty = this.isDirty();
    const radiusValue = parseRadius(radius);
    const selectedColor = AREA_COLORS.find(areaColor => areaColor.value === color);
    const locatedHouses = this.getLocatedHouses();
    const language = get(props, 'user.language');
    const title = creationMode ? <Text id="newArea.mobile.newTitle" /> : name || <Text id="newArea.cardTitleEdit" />;
    return (
      <FocusPage>
        <div class="page">
          <div class={cx('page-main', 'glass-theme', mapStyle.mapPage, style.zonePage)} data-cy="zone-mobile">
            <SystemBackGuard dirty={dirty} onBack={this.openLeave} />
            <MobileNavBar
              title={title}
              onBack={this.onBack}
              backLabel={<Text id="newArea.mobile.backLabel" />}
              action={
                !creationMode && (
                  <MobileNavBar.IconButton
                    icon="trash-2"
                    label={get(dictionary, 'newArea.deleteButton')}
                    onClick={this.openDelete}
                    disabled={loading}
                    data-cy="zone-delete"
                  />
                )
              }
            />
            {/* while the zone loads, saves or is deleted, the map and the panel take no input: an
                edit made then would be overwritten by the zone that arrives, or lost with the page
                that leaves once the request is through */}
            <div
              class={cx(style.zoneBody, { [style.zoneBodyBusy]: loading })}
              aria-busy={loading ? 'true' : 'false'}
              // "inert" takes the keyboard and the focus away too, which pointer-events does not
              inert={loading}
            >
              <div class={style.mapArea}>
                <MobileAreaMap
                  latitude={props.latitude}
                  longitude={props.longitude}
                  radius={radius}
                  color={color}
                  houses={props.houses}
                  language={language}
                  setLatLong={props.setLatLong}
                  setRadius={props.setRadiusValue}
                  moveLabel={get(dictionary, 'newArea.mobile.moveHandle')}
                  resizeLabel={get(dictionary, 'newArea.mobile.resizeHandle')}
                />
                <div class={style.mapButtons}>
                  <button
                    type="button"
                    class={style.mapButton}
                    onClick={this.locate}
                    disabled={locating}
                    aria-label={get(dictionary, 'newArea.mobile.placeAtMyPosition')}
                    title={get(dictionary, 'newArea.mobile.placeAtMyPosition')}
                    data-cy="zone-locate"
                  >
                    {locating ? (
                      <span class={style.mapButtonSpinner} aria-hidden="true" />
                    ) : (
                      <i class="fe fe-navigation" aria-hidden="true" />
                    )}
                  </button>
                  {locatedHouses.length > 0 && (
                    <button
                      type="button"
                      class={style.mapButton}
                      onClick={this.onHouseButton}
                      aria-label={get(dictionary, 'newArea.mobile.placeAtHouse')}
                      title={get(dictionary, 'newArea.mobile.placeAtHouse')}
                      data-cy="zone-house"
                    >
                      <i class="fe fe-home" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {message && (
                  <div class={style.mapToast} role="status" data-cy="zone-message">
                    <span class={style.mapToastText}>
                      <Text id={message.textId} fields={message.fields} />
                    </span>
                    {message.undo ? (
                      <button
                        type="button"
                        class={style.mapToastButton}
                        onClick={this.undoMessage}
                        data-cy="zone-message-undo"
                      >
                        <Text id="mobileKit.undo" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        class={cx(style.mapToastButton, style.mapToastClose)}
                        onClick={this.closeMessage}
                        aria-label={get(dictionary, 'mobileKit.close')}
                      >
                        <i class="fe fe-x" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div class={style.panel} data-cy="zone-panel">
                <div class={style.panelInner}>
                  {props.getAreaError && (
                    <MobileNotice tone="danger" icon="alert-circle">
                      <Text id="newArea.getAreaError" />
                    </MobileNotice>
                  )}
                  <button type="button" class={style.zoneRow} onClick={this.openDetails} data-cy="zone-details">
                    <span
                      class={style.zoneSwatch}
                      style={{ borderColor: color, backgroundColor: `${color}33` }}
                      aria-hidden="true"
                    />
                    <span class={style.zoneRowText}>
                      <span class={cx(style.zoneRowTitle, { [style.zoneRowTitleMissing]: !name })}>
                        {name || <Text id="newArea.mobile.nameMissing" />}
                      </span>
                      <span class={style.zoneRowSub}>
                        <Text id="newArea.mobile.nameAndColor" />
                      </span>
                    </span>
                    <i class={cx('fe', 'fe-chevron-right', style.zoneRowChevron)} aria-hidden="true" />
                  </button>

                  <div class={style.radiusHeader}>
                    <label class={style.radiusLabelText} for="zoneRadius">
                      <Text id="newArea.mobile.radius" />
                    </label>
                    <div class={style.radiusField}>
                      <input
                        id="zoneRadius"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        autocomplete="off"
                        enterkeyhint="done"
                        class={style.radiusInput}
                        value={radiusDraft !== null ? radiusDraft : radiusValue === null ? '' : Math.round(radiusValue)}
                        onInput={this.onRadiusInput}
                        onBlur={this.onRadiusBlur}
                        onKeyDown={this.onRadiusKeyDown}
                        data-cy="zone-radius"
                      />
                      <span class={style.radiusUnit} aria-hidden="true">
                        <Text id="newArea.mobile.radiusUnit" />
                      </span>
                    </div>
                  </div>
                  <div class={style.radiusControls}>
                    <button
                      type="button"
                      class={style.stepButton}
                      onClick={this.decreaseRadius}
                      disabled={radiusValue !== null && radiusValue <= MIN_RADIUS}
                      aria-label={get(dictionary, 'newArea.mobile.decreaseRadius')}
                      data-cy="zone-radius-minus"
                    >
                      <i class="fe fe-minus" aria-hidden="true" />
                    </button>
                    <input
                      type="range"
                      class={style.slider}
                      min="0"
                      max={SLIDER_STEPS}
                      step="1"
                      value={radiusToSlider(radius)}
                      onInput={this.onSliderInput}
                      aria-label={get(dictionary, 'newArea.mobile.radiusSlider')}
                      aria-valuetext={radiusValue === null ? '' : `${Math.round(radiusValue)} m`}
                      data-cy="zone-radius-slider"
                      data-no-sheet-drag
                    />
                    <button
                      type="button"
                      class={style.stepButton}
                      onClick={this.increaseRadius}
                      disabled={radiusValue !== null && radiusValue >= MAX_RADIUS}
                      aria-label={get(dictionary, 'newArea.mobile.increaseRadius')}
                      data-cy="zone-radius-plus"
                    >
                      <i class="fe fe-plus" aria-hidden="true" />
                    </button>
                  </div>

                  {this.renderError()}
                  {missing ? (
                    <p class={cx(style.panelMessage, style.panelMessageMissing)} role="status" data-cy="zone-missing">
                      <Text id={`newArea.mobile.missing.${missing}`} />
                    </p>
                  ) : (
                    <p class={cx(style.panelMessage, style.panelHint)}>
                      <Text id="newArea.mobile.gesturesHint" />
                    </p>
                  )}
                  <BigButton
                    variant="primary"
                    onClick={this.save}
                    disabled={Boolean(missing) || !dirty}
                    loading={loading}
                    data-cy="zone-save"
                  >
                    <Text id={creationMode ? 'newArea.createButton' : 'newArea.updateButton'} />
                  </BigButton>
                </div>
              </div>
            </div>

            <BottomSheet
              open={detailsOpen}
              title={get(dictionary, 'newArea.mobile.nameAndColor')}
              onClose={this.closeDetails}
              onOk={this.closeDetails}
              dataCy="zone-details-sheet"
            >
              <MobileField label={<Text id="newArea.nameLabel" />} htmlFor="zoneName">
                <Localizer>
                  <input
                    id="zoneName"
                    type="text"
                    class={fieldClass.input}
                    value={name}
                    onInput={props.setName}
                    onKeyDown={this.onNameKeyDown}
                    placeholder={<Text id="newArea.mobile.namePlaceholder" />}
                    autocomplete="off"
                    autocapitalize="sentences"
                    enterkeyhint="done"
                    ref={this.setNameInputRef}
                    data-cy="zone-name"
                  />
                </Localizer>
              </MobileField>
              <div class={kitStyle.field}>
                <div class={kitStyle.fieldLabel} id="zoneColorLabel">
                  <Text id="newArea.colorLabel" />
                </div>
                <div class={style.swatches} role="group" aria-labelledby="zoneColorLabel">
                  {AREA_COLORS.map(areaColor => {
                    const selected = areaColor.value === color;
                    return (
                      <button
                        key={areaColor.value}
                        type="button"
                        class={cx(style.swatch, { [style.swatchSelected]: selected })}
                        style={{ backgroundColor: areaColor.value, color: areaColor.value }}
                        onClick={this.selectColor(areaColor.value)}
                        aria-pressed={selected ? 'true' : 'false'}
                        aria-label={get(dictionary, `color.${areaColor.labelKey}`)}
                        title={get(dictionary, `color.${areaColor.labelKey}`)}
                        data-cy={`zone-color-${areaColor.labelKey}`}
                      >
                        {selected && (
                          <i
                            class={cx('fe', 'fe-check', {
                              [style.swatchCheck]: areaColor.contrast === 'white',
                              [style.swatchCheckDark]: areaColor.contrast !== 'white'
                            })}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedColor && (
                  <div class={kitStyle.fieldHelp}>{get(dictionary, `color.${selectedColor.labelKey}`)}</div>
                )}
              </div>
            </BottomSheet>

            <BottomSheet
              open={housesOpen}
              title={get(dictionary, 'newArea.mobile.placeAtHouse')}
              onClose={this.closeHouses}
              dataCy="zone-houses-sheet"
            >
              <MobileGroup>
                {locatedHouses.map(house => (
                  <MobileRow
                    key={house.id}
                    icon="home"
                    title={house.name}
                    onClick={this.placeAtHouse(house)}
                    chevron={false}
                  />
                ))}
              </MobileGroup>
            </BottomSheet>

            <ConfirmSheet
              open={deleteOpen}
              title={
                name
                  ? get(dictionary, 'newArea.mobile.deleteTitle').replace('{{name}}', name)
                  : get(dictionary, 'newArea.deleteButton')
              }
              text={<Text id="newArea.mobile.deleteText" />}
              confirmLabel={<Text id="newArea.deleteButton" />}
              destructive
              onConfirm={this.confirmDelete}
              onCancel={this.closeDelete}
              dataCy="zone-delete-confirm"
            />

            <BottomSheet
              open={leaveOpen}
              title={get(dictionary, 'mobileKit.leaveTitle')}
              onClose={this.closeLeave}
              dataCy="zone-leave-confirm"
            >
              <p class={kitStyle.sheetText}>
                <Text id="mobileKit.leaveText" />
              </p>
              <div class={kitStyle.buttons}>
                {/* a zone that cannot be saved yet is not offered to be */}
                {!missing && (
                  <BigButton variant="primary" onClick={this.save} disabled={loading} data-cy="zone-leave-save">
                    <Text id="mobileKit.saveAndLeave" />
                  </BigButton>
                )}
                <BigButton variant="dangerSoft" onClick={this.leaveWithoutSaving} data-cy="zone-leave-discard">
                  <Text id="mobileKit.leaveWithoutSaving" />
                </BigButton>
                <BigButton variant="ghost" onClick={this.closeLeave} data-cy="zone-leave-keep-editing">
                  <Text id="mobileKit.keepEditing" />
                </BigButton>
              </div>
            </BottomSheet>
          </div>
        </div>
      </FocusPage>
    );
  }
}

export default withIntlAsProp(MobileNewArea);
