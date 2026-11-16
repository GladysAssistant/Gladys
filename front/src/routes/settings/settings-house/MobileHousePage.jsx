import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import EditHouse from '../../../components/house/EditHouseComponent';
import { isSet } from '../../../components/house/MobileLocationField';
import { isSheetEntryOnTop } from '../../../components/sheet/sheetHistory';
import { RequestStatus } from '../../../utils/consts';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import {
  FocusPage,
  MobileRow,
  MobilePill,
  MobileEmptyState,
  MobileToast,
  BigButton,
  kitStyle
} from '../../../components/mobile';
import style from './style.css';
import dashboardStyle from '../../dashboard/style.css';

// The entry the open editor holds in the history: the system "back" (the Android button, the iOS
// edge swipe) leaves it, which closes the editor instead of leaving the settings. Its value is
// the id of the editor it belongs to: an entry that survived a reload of the page is not taken
// for the one of the editor now open.
const EDITOR_ENTRY_KEY = 'gladysHouseEditor';

// how long a programmatic close waits for the history before closing anyway
const CLOSE_FALLBACK_MS = 400;

const readEditorEntryId = () => (window.history.state && window.history.state[EDITOR_ENTRY_KEY]) || null;

const countRooms = house => (house.rooms || []).filter(room => room.to_delete !== true).length;

// "6 rooms · Located · Alarm code set": what a house holds, on one line
const HouseSummary = ({ house }) => {
  const roomCount = countRooms(house);
  let roomsTextId = 'housesSettings.summary.noRoom';
  if (roomCount === 1) {
    roomsTextId = 'housesSettings.summary.oneRoom';
  } else if (roomCount > 1) {
    roomsTextId = 'housesSettings.summary.rooms';
  }
  const located = isSet(house.latitude) && isSet(house.longitude);
  return (
    <span>
      <Text id={roomsTextId} fields={{ count: roomCount }} />
      {' · '}
      <Text id={located ? 'housesSettings.summary.located' : 'housesSettings.summary.notLocated'} />
      {' · '}
      <Text id={house.alarm_code ? 'housesSettings.summary.alarmSet' : 'housesSettings.summary.alarmNotSet'} />
    </span>
  );
};

/**
 * @description The houses on a phone (docs/specs/mobile-pages/house-and-rooms.md): a list of
 * rows, and the house that was tapped edited in a focus view that takes the place of the list.
 * Fed by the same container as the desktop accordion (index.js): same store actions, same
 * requests.
 */
class MobileHousePage extends Component {
  state = {
    openHouseId: null,
    // every house of the instance with its rooms, when the list is filtered by a search
    everyHouse: null,
    // bumped to ask the open editor for its leave guard (the system "back")
    leaveRequestKey: 0,
    toast: null,
    toastKey: 0
  };

  componentDidMount() {
    window.addEventListener('popstate', this.onPopState);
    // the page was reloaded while an editor was open: its entry is still the current one, with
    // nothing to close. It becomes an ordinary entry of the page (no traversal: going back from
    // a freshly loaded page may load it again).
    if (readEditorEntryId() !== null) {
      const state = { ...window.history.state };
      delete state[EDITOR_ENTRY_KEY];
      window.history.replaceState(state, '');
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { openHouseId } = this.state;
    const houses = this.props.houses || [];

    // the house the "+" just created is opened: an empty row would be a dead end
    if (this.expectNewHouse && houses.length > 0 && !houses[0].created_at) {
      this.expectNewHouse = false;
      this.openHouse(houses[0].id);
      return;
    }

    if (openHouseId !== prevState.openHouseId) {
      if (openHouseId !== null) {
        window.scrollTo(0, 0);
      } else if (this.listScrollY) {
        window.scrollTo(0, this.listScrollY);
      }
    }

    if (openHouseId === null) {
      return;
    }
    // the open house is gone: it was deleted, or the list was loaded again without it
    if (!houses.some(house => house.id === openHouseId)) {
      if (this.deleting) {
        this.deleting = false;
        this.showToast('housesSettings.mobile.houseDeleted');
      }
      this.closeEditor();
      return;
    }
    // the store sets the status of a house to Getting when its save starts: Getting -> Success
    // is "this save went through"
    const previousStatus = get(prevProps.houseUpdateStatus, openHouseId);
    const status = get(this.props.houseUpdateStatus, openHouseId);
    if (previousStatus === RequestStatus.Getting && status === RequestStatus.Success) {
      this.showToast('mobileKit.saved');
    }
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.onPopState);
    clearTimeout(this.closeTimer);
  }

  showToast = textId => this.setState(prevState => ({ toast: textId, toastKey: prevState.toastKey + 1 }));
  closeToast = () => this.setState({ toast: null });

  isOpenHouseUnsaved = () => {
    const house = (this.props.houses || []).find(candidate => candidate.id === this.state.openHouseId);
    return Boolean(house) && (!house.created_at || Boolean(get(this.props.dirtyHouses, house.id)));
  };

  openHouse = houseId => {
    this.listScrollY = window.scrollY;
    this.closing = false;
    this.pushEditorEntry();
    this.setState({ openHouseId: houseId });
    this.loadEveryHouse();
  };

  // The list may be the result of a search, and the name of a room is unique in the whole
  // instance: while a search filters the list, the rooms of every house are asked for, so the
  // editor knows the names the hidden houses hold.
  loadEveryHouse = async () => {
    if (!this.props.housesSearch) {
      this.setState({ everyHouse: null });
      return;
    }
    try {
      const everyHouse = await this.props.httpClient.get('/api/v1/house', { expand: 'rooms' });
      this.setState({ everyHouse });
    } catch (e) {
      console.error(e);
    }
  };

  pushEditorEntry = () => {
    this.editorEntryId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    window.history.pushState({ [EDITOR_ENTRY_KEY]: this.editorEntryId }, '');
  };

  isEditorEntryOnTop = () => this.editorEntryId !== undefined && readEditorEntryId() === this.editorEntryId;

  // Closing the editor leaves its history entry (and the entry a sheet may have left above it):
  // the editor is hidden when the history lands back on the list. A traversal that does not
  // happen (the browser refused it, the entries are not the expected ones) still closes it.
  closeEditor = () => {
    if (this.state.openHouseId === null || this.closing) {
      return;
    }
    if (this.isEditorEntryOnTop()) {
      this.closing = true;
      window.history.back();
    } else if (isSheetEntryOnTop()) {
      this.closing = true;
      window.history.go(-2);
    }
    if (this.closing) {
      this.closeTimer = setTimeout(this.finishClosing, CLOSE_FALLBACK_MS);
    } else {
      this.finishClosing();
    }
  };

  finishClosing = () => {
    clearTimeout(this.closeTimer);
    this.closing = false;
    this.setState({ openHouseId: null });
  };

  onPopState = () => {
    if (this.state.openHouseId === null) {
      return;
    }
    // the editor asked to be closed: wherever the history landed
    if (this.closing) {
      this.finishClosing();
      return;
    }
    // still on the editor: the history came back from the entry of a sheet
    if (this.isEditorEntryOnTop() || isSheetEntryOnTop()) {
      return;
    }
    if (!this.isOpenHouseUnsaved()) {
      this.finishClosing();
      return;
    }
    // the system "back" with unsaved changes: the editor stays, and asks
    this.pushEditorEntry();
    this.setState(prevState => ({ leaveRequestKey: prevState.leaveRequestKey + 1 }));
  };

  addHouse = () => {
    this.expectNewHouse = true;
    this.props.addHouse();
  };

  // leaving without saving drops the local edits: the houses are loaded again
  discardChanges = () => {
    this.closeEditor();
    this.props.getHouses();
  };

  deleteHouse = async houseIndex => {
    this.deleting = true;
    await this.props.deleteHouse(houseIndex);
    // a deletion that failed leaves the house in place, with its error
    this.deleting = false;
  };

  renderEditor(props, { openHouseId, leaveRequestKey, everyHouse }) {
    const houseIndex = props.houses.findIndex(house => house.id === openHouseId);
    const house = props.houses[houseIndex];
    // the rooms of the other houses: the name of a room is unique in the whole instance
    const otherRoomNames = (props.housesSearch && everyHouse ? everyHouse : props.houses)
      .filter(otherHouse => otherHouse.id !== house.id)
      .reduce((names, otherHouse) => names.concat((otherHouse.rooms || []).map(room => room.name)), []);
    return (
      <div class="page">
        <div class={cx('page-main', 'glass-theme', dashboardStyle.dashboardBackground, dashboardStyle.glassScene)}>
          <FocusPage>
            <EditHouse
              {...props}
              mobile
              key={house.id}
              house={house}
              houseIndex={houseIndex}
              otherRoomNames={otherRoomNames}
              dirty={Boolean(get(props.dirtyHouses, house.id))}
              houseUpdateStatus={get(props.houseUpdateStatus, house.id)}
              deleteHouse={this.deleteHouse}
              leaveRequestKey={leaveRequestKey}
              onClose={this.closeEditor}
              onDiscard={this.discardChanges}
            />
          </FocusPage>
        </div>
      </div>
    );
  }

  renderList(props) {
    const houses = props.houses || [];
    const loading = props.housesGetStatus === RequestStatus.Getting;
    const isSearch = Boolean(props.housesSearch && props.housesSearch.length);
    return (
      <SettingsLayout>
        <div data-cy="houses-mobile">
          <h1 class="page-title">
            <Text id="housesSettings.title" />
          </h1>
          <p class={cx(style.pageSubtitle, style.mobileSubtitle)}>
            <Text id="housesSettings.mobile.subtitle" />
          </p>
          <label class={kitStyle.search}>
            <i class="fe fe-search" aria-hidden="true" />
            <Localizer>
              <input
                type="search"
                class={kitStyle.searchInput}
                value={props.housesSearch || ''}
                onInput={props.debouncedSearch}
                placeholder={<Text id="housesSettings.searchPlaceholder" />}
                aria-label={<Text id="housesSettings.searchPlaceholder" />}
                enterkeyhint="search"
                data-cy="houses-search"
              />
            </Localizer>
          </label>
          <div class={cx('dimmer', style.houseList, { active: loading })}>
            <div class="loader" />
            <div class={cx('dimmer-content', kitStyle.stack, style.mobileList)}>
              {houses.map(house => {
                const neverSaved = !house.created_at;
                const dirty = Boolean(get(props.dirtyHouses, house.id));
                return (
                  <MobileRow
                    key={house.id}
                    card
                    icon="home"
                    title={house.name || <Text id="housesSettings.defaultNewHouseName" />}
                    subtitle={<HouseSummary house={house} />}
                    onClick={() => this.openHouse(house.id)}
                    dataCy="house-row"
                  >
                    {(neverSaved || dirty) && (
                      <span class={style.mobileRowBadge}>
                        <MobilePill tone={neverSaved ? 'accent' : 'warning'}>
                          <Text
                            id={
                              neverSaved ? 'housesSettings.summary.neverSaved' : 'housesSettings.summary.unsavedChanges'
                            }
                          />
                        </MobilePill>
                      </span>
                    )}
                  </MobileRow>
                );
              })}
              {houses.length === 0 && !loading && (
                <MobileEmptyState
                  icon={isSearch ? 'search' : 'home'}
                  title={<Text id={isSearch ? 'housesSettings.noHouseFound' : 'housesSettings.empty.title'} />}
                  text={!isSearch && <Text id="housesSettings.empty.description" />}
                >
                  {!isSearch && (
                    <BigButton variant="primary" icon="plus" onClick={this.addHouse} data-cy="houses-empty-add">
                      <Text id="housesSettings.empty.button" />
                    </BigButton>
                  )}
                </MobileEmptyState>
              )}
            </div>
          </div>
        </div>
        <Localizer>
          <button
            type="button"
            class={kitStyle.fab}
            onClick={this.addHouse}
            aria-label={<Text id="housesSettings.newButtonLabel" />}
            data-cy="houses-add"
          >
            <i class="fe fe-plus" aria-hidden="true" />
          </button>
        </Localizer>
      </SettingsLayout>
    );
  }

  render(props, state) {
    const { openHouseId, toast, toastKey } = state;
    const editing = openHouseId !== null && (props.houses || []).some(house => house.id === openHouseId);
    return (
      <div>
        {editing ? this.renderEditor(props, state) : this.renderList(props)}
        <MobileToast
          message={toast ? get(props.intl.dictionary, toast) : null}
          toastKey={toastKey}
          onClose={this.closeToast}
          aboveBar
          dataCy="houses-toast"
        />
      </div>
    );
  }
}

export default withIntlAsProp(MobileHousePage);
