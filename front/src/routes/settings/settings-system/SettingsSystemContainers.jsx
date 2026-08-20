import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';

// Pill rows instead of a table: in a settings column the 3-column nowrap
// table overflowed horizontally (truncated dates, double scrollbars). Name +
// creation date stack on the left, the state badge sits on the right — no
// horizontal overflow at any width.
const SettingsSystemContainers = ({ systemContainers }) => (
  <div class="card">
    <h4 class="card-header">
      <Text id="systemSettings.containers" />
    </h4>
    <div class="card-body">
      <div class={style.containerList}>
        {systemContainers &&
          systemContainers.map(container => (
            <div key={container.id} class={style.containerRow}>
              <span class={style.containerIcon}>
                <i class="fe fe-box" />
              </span>
              <div class={style.containerInfo}>
                <div class={style.containerName}>{container.name}</div>
                <div class={style.containerCreated}>{container.created_at_formatted}</div>
              </div>
              <span
                class={cx('badge', {
                  'badge-success': container.state === 'running',
                  'badge-warning': container.state !== 'running'
                })}
              >
                <Text id={`systemSettings.containerState.${container.state}`} />
              </span>
            </div>
          ))}
      </div>
    </div>
  </div>
);

export default connect('systemContainers', null)(SettingsSystemContainers);
