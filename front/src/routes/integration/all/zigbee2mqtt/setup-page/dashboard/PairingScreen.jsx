import { Text } from 'preact-i18n';

import { FocusPage, MobileNavBar, MobileBottomBar, BigButton, kitStyle } from '../../../../../../components/mobile';
import PairingWindow from '../pairing/PairingWindow';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';

/**
 * @description "Pair" of the dashboard: the pairing window on a screen of its own (docs/specs/zigbee2mqtt-pairing.md,
 * D.1), closed back to the dashboard. Joining goes on by itself once closed.
 */
const PairingScreen = ({ isMobile, httpClient, session, online, onClose }) => {
  const window = <PairingWindow httpClient={httpClient} session={session} online={online} isMobile={isMobile} />;
  if (isMobile) {
    return (
      <FocusPage>
        <div class={kitStyle.page} data-cy="z2m-dashboard-pairing">
          <MobileNavBar
            title={<Text id={`${T}.actions.pair`} />}
            onBack={onClose}
            backLabel={<Text id="integration.zigbee2mqtt.setupTab" />}
          />
          <div class={`${kitStyle.content} ${kitStyle.contentWithBottomBar}`}>{window}</div>
          <MobileBottomBar dataCy="z2m-dashboard-pairing-bottom-bar">
            <BigButton variant="primary" onClick={onClose} data-cy="z2m-pairing-close">
              <Text id="integration.zigbee2mqtt.pairing.close" />
            </BigButton>
          </MobileBottomBar>
        </div>
      </FocusPage>
    );
  }
  return (
    <section class={style.card} data-cy="z2m-dashboard-pairing">
      <div class={style.pairingHead}>
        <h3 class="mb-0">
          <Text id={`${T}.actions.pair`} />
        </h3>
        <button type="button" class="btn btn-secondary" onClick={onClose} data-cy="z2m-pairing-close">
          <Text id="integration.zigbee2mqtt.pairing.close" />
        </button>
      </div>
      {window}
    </section>
  );
};

export default PairingScreen;
