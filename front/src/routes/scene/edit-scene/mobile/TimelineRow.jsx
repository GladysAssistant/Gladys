import cx from 'classnames';

import SwipeRow from '../../SwipeRow';
import style from '../../mobile.css';

// One step, condition or trigger of the mobile editor: the whole row opens its sheet, and a swipe
// to the left reveals "Delete" (docs/specs/scene-editor-mobile.md, E.3 / E.6)
const TimelineRow = ({ info, variant, running, onOpen, onDelete, dataCy }) => (
  <SwipeRow
    actions={[
      {
        key: 'delete',
        labelId: 'editScene.mobile.delete',
        icon: 'trash-2',
        tone: 'danger',
        onClick: onDelete,
        dataCy: dataCy ? `${dataCy}-delete` : undefined
      }
    ]}
    class={cx({ [style.swipeRowFlush]: variant === 'flush', [style.swipeRowNested]: variant === 'nested' })}
  >
    <button
      type="button"
      class={cx(style.row, {
        [style.rowFlush]: variant === 'flush',
        [style.rowNested]: variant === 'nested',
        [style.rowRunning]: running
      })}
      onClick={onOpen}
      data-cy={dataCy}
    >
      <span class={cx(style.rowTile, info.colorClass)} aria-hidden="true">
        <i class={cx(info.icon, 'dark-mode-fe-none-filter')} />
      </span>
      <span class={style.rowText}>
        <span class={style.rowTitle}>
          {running && <span class={style.runningDot} aria-hidden="true" />}
          {info.title}
        </span>
        {info.summary && <span class={style.rowSub}>{info.summary}</span>}
      </span>
      <i class={cx('fe fe-chevron-right', style.rowChevron)} aria-hidden="true" />
    </button>
  </SwipeRow>
);

export default TimelineRow;
