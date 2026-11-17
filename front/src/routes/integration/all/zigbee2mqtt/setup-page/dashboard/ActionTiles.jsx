import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';

const ICONS = { restart: 'refresh-cw', stop: 'square', interface: 'external-link' };

// Restart, stop (once confirmed: Zigbee2mqtt stays stopped until it is started again), the interface of Zigbee2mqtt
const ActionTiles = ({ view, actions }) => {
  const { tiles, z2mUrl, actionStatus, confirmStop } = view;
  const busy = actionStatus === RequestStatus.Getting;
  if (tiles.length === 0) {
    return null;
  }
  return (
    <section class={style.tilesCard} data-cy="z2m-dashboard-tiles">
      <div class={style.tiles}>
        {tiles.map(tile =>
          tile === 'interface' ? (
            <a
              key={tile}
              href={z2mUrl}
              target="_blank"
              rel="noopener noreferrer"
              class={style.tile}
              data-cy="z2m-dashboard-interface"
            >
              <i class={`fe fe-${ICONS[tile]}`} aria-hidden="true" />
              <Text id={`${T}.actions.interface`} />
            </a>
          ) : (
            <button
              key={tile}
              type="button"
              class={cx(style.tile, { [style.tileActive]: tile === 'stop' && confirmStop })}
              disabled={busy}
              onClick={tile === 'stop' ? actions.askStop : actions.restart}
              data-cy={`z2m-dashboard-${tile}`}
            >
              <i class={`fe fe-${ICONS[tile]}`} aria-hidden="true" />
              <Text id={`${T}.actions.${tile}`} />
            </button>
          )
        )}
      </div>
      {confirmStop && (
        <div class={style.confirm} role="alertdialog" data-cy="z2m-dashboard-confirm-stop">
          <span>
            <Text id={`${T}.confirmStop.text`} />
          </span>
          <div class={style.buttons}>
            <button
              type="button"
              class={cx('btn btn-danger', { 'btn-loading': busy })}
              disabled={busy}
              onClick={actions.stop}
              data-cy="z2m-dashboard-confirm-stop-button"
            >
              <Text id={`${T}.confirmStop.confirm`} />
            </button>
            <button type="button" class="btn btn-link" onClick={actions.cancelStop} data-cy="z2m-dashboard-cancel-stop">
              <Text id={`${T}.confirmStop.cancel`} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ActionTiles;
