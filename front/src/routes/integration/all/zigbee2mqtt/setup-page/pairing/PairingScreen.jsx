import { Component } from 'preact';
import { Text } from 'preact-i18n';

import { FocusPage, MobileNavBar, MobileBottomBar, BigButton, kitStyle } from '../../../../../../components/mobile';
import { isSheetEntryOnTop } from '../../../../../../components/sheet/sheetHistory';
import PairingWindow from './PairingWindow';
import style from './pairing.css';

// The entry the screen holds in the history: the system "back" (the browser button, the Android button, the iOS edge
// swipe) leaves it, which closes the screen instead of leaving the Zigbee2mqtt page. Its value is the id of the screen
// it belongs to.
const ENTRY_KEY = 'gladysZ2mPairing';

// How long a close waits for the history before closing anyway
const CLOSE_FALLBACK_MS = 400;

const readEntryId = () => (window.history.state && window.history.state[ENTRY_KEY]) || null;

/**
 * @description The pairing window on a screen of its own (docs/specs/zigbee2mqtt-pairing.md, D.1), opened by "Pair a
 * device" on the dashboard and on the Discover tab, closed back to where it was opened (its button, or "back"). Joining
 * goes on by itself once closed.
 * @param {object} props - `backLabelId`: the screen it goes back to, on a phone.
 * @returns {object} The screen.
 * @example
 * <PairingScreen httpClient={httpClient} session={session} online onClose={close} backLabelId="…" />
 */
class PairingScreen extends Component {
  componentDidMount() {
    this.entryId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    window.history.pushState({ [ENTRY_KEY]: this.entryId }, '');
    window.addEventListener('popstate', this.onPopState);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.onPopState);
    clearTimeout(this.closeTimer);
  }

  isEntryOnTop = () => readEntryId() === this.entryId;

  // Closing leaves the entry of the screen (and the one a sheet may have left above it): the screen closes when the
  // history lands back under it. A traversal that does not happen still closes it.
  close = () => {
    if (this.closing) {
      return;
    }
    if (this.isEntryOnTop()) {
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
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.props.onClose();
  };

  onPopState = () => {
    // Still on the screen: back from the entry of a sheet (the card of a device on a phone)
    if (!this.closing && (this.isEntryOnTop() || isSheetEntryOnTop())) {
      return;
    }
    this.finishClosing();
  };

  render({ isMobile, httpClient, session, online, brokerConnected, backLabelId }) {
    const pairingWindow = (
      <PairingWindow
        httpClient={httpClient}
        session={session}
        online={online}
        brokerConnected={brokerConnected}
        isMobile={isMobile}
      />
    );
    const title = <Text id="integration.zigbee2mqtt.setup.dashboard.actions.pair" />;
    if (isMobile) {
      return (
        <FocusPage>
          <div class={kitStyle.page} data-cy="z2m-pairing-screen">
            <MobileNavBar title={title} onBack={this.close} backLabel={<Text id={backLabelId} />} />
            <div class={`${kitStyle.content} ${kitStyle.contentWithBottomBar}`}>{pairingWindow}</div>
            <MobileBottomBar dataCy="z2m-pairing-bottom-bar">
              <BigButton variant="primary" onClick={this.close} data-cy="z2m-pairing-close">
                <Text id="integration.zigbee2mqtt.pairing.close" />
              </BigButton>
            </MobileBottomBar>
          </div>
        </FocusPage>
      );
    }
    return (
      <section class={style.screen} data-cy="z2m-pairing-screen">
        <div class={style.screenHead}>
          <h3 class="mb-0">{title}</h3>
          <button type="button" class="btn btn-secondary" onClick={this.close} data-cy="z2m-pairing-close">
            <Text id="integration.zigbee2mqtt.pairing.close" />
          </button>
        </div>
        {pairingWindow}
      </section>
    );
  }
}

export default PairingScreen;
