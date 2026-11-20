import { Text } from 'preact-i18n';

import { FocusPage, MobileNavBar, MobileBottomBar, BigButton, kitStyle } from '../../../../../../components/mobile';
import PairingWindow from './PairingWindow';
import style from './pairing.css';

/**
 * @description The pairing window on a screen of its own (docs/specs/zigbee2mqtt-pairing.md, D.1), opened by "Pair a
 * device" on the dashboard and on the Discover tab, closed back to where it was opened. Joining goes on by itself once
 * closed.
 * @param {object} props - `backLabelId`: the screen it goes back to, on a phone.
 * @returns {object} The screen.
 * @example
 * <PairingScreen httpClient={httpClient} session={session} online onClose={close} backLabelId="…" />
 */
const PairingScreen = ({ isMobile, httpClient, session, online, brokerConnected, onClose, backLabelId }) => {
  const window = (
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
          <MobileNavBar title={title} onBack={onClose} backLabel={<Text id={backLabelId} />} />
          <div class={`${kitStyle.content} ${kitStyle.contentWithBottomBar}`}>{window}</div>
          <MobileBottomBar dataCy="z2m-pairing-bottom-bar">
            <BigButton variant="primary" onClick={onClose} data-cy="z2m-pairing-close">
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
        <button type="button" class="btn btn-secondary" onClick={onClose} data-cy="z2m-pairing-close">
          <Text id="integration.zigbee2mqtt.pairing.close" />
        </button>
      </div>
      {window}
    </section>
  );
};

export default PairingScreen;
