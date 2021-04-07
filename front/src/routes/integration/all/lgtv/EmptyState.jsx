import cx from 'classnames';
import style from './style.css';
import { NewLink, ScanButton } from './common';

const EmptyState = ({ onScan, onAdd, scanStatus }) => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <ScanButton onClick={onScan} scanStatus={scanStatus} />
      <NewLink />
    </div>
  </div>
);

export default EmptyState;
