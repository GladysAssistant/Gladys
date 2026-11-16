import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import BottomSheet from '../sheet/BottomSheet';
import withIntlAsProp from '../../utils/withIntlAsProp';
import { kitStyle } from '../mobile';
import AddressSearch from './AddressSearch';
import LocateMeButton from './LocateMeButton';
import Map from './Map';
import style from './mobileHouse.css';

// latitude 0 is a valid coordinate: "is it set?" is a null check
const isSet = value => value !== null && value !== undefined && value !== '';

/**
 * @description Where a house is, on a phone (docs/specs/mobile-pages/house-and-rooms.md, C.2):
 * the position of the phone, an address search, or a tap on the map. The map of the page is a
 * preview that takes no gesture from the page; the pin is moved on a full-height map in a sheet.
 * Shared by the house settings and the onboarding.
 *
 * latitude / longitude: the current position (null when not set). onChange(latitude, longitude).
 */
class MobileLocationField extends Component {
  state = {
    mapOpen: false
  };

  openMap = () => this.setState({ mapOpen: true });
  closeMap = () => this.setState({ mapOpen: false });

  // the Map component reports (latitude, longitude, houseIndex)
  updateFromMap = (latitude, longitude) => this.props.onChange(latitude, longitude);

  render({ latitude, longitude, onChange, intl }, { mapOpen }) {
    const located = isSet(latitude) && isSet(longitude);
    const house = { latitude, longitude };
    const mapLabelId = located ? 'housesSettings.mobile.adjustOnMap' : 'housesSettings.mobile.placeOnMap';
    return (
      <div data-cy="house-location">
        <LocateMeButton onLocate={onChange} />
        <AddressSearch mobile onSelectLocation={onChange} />
        <div class={style.mapPreview}>
          <Map house={house} interactive={false} zoom={15} class={style.mapPreviewMap} />
          <Localizer>
            <button
              type="button"
              class={style.mapPreviewTarget}
              onClick={this.openMap}
              aria-label={<Text id={mapLabelId} />}
              data-cy="house-map-open"
            >
              <span class={style.mapPreviewPill}>
                <i class="fe fe-map-pin" aria-hidden="true" />
                <Text id={mapLabelId} />
              </span>
            </button>
          </Localizer>
        </div>
        <div class={kitStyle.fieldHelp} data-cy="house-location-status">
          <Text id={located ? 'housesSettings.mobile.positionSet' : 'housesSettings.mobile.positionNotSet'} />
        </div>
        <BottomSheet
          open={mapOpen}
          title={get(intl.dictionary, 'housesSettings.mobile.mapSheetTitle')}
          onClose={this.closeMap}
          onOk={this.closeMap}
          size="full"
          dataCy="house-map-sheet"
        >
          <p class={kitStyle.sheetText}>
            <Text id="housesSettings.mobile.mapSheetHint" />
          </p>
          {/* the map takes its own gestures: a finger panning it must not drag the sheet down */}
          <div class={style.mapSheetMap} data-no-sheet-drag>
            <Map house={house} updateHouseLocation={this.updateFromMap} zoom={16} class={style.mapSheetMapInner} />
          </div>
        </BottomSheet>
      </div>
    );
  }
}

export { isSet };
export default withIntlAsProp(MobileLocationField);
