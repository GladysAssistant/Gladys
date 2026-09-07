import cx from 'classnames';
import style from './style.css';

// Purely visual placeholder for an empty column: it gives the column a
// permanent droppable surface (always rendered, so a drag never shifts the
// layout). Drops resolve on the column container (widgetDropPlacement).
const EmptyColumnDropZone = () => <div class={cx('text-center', style.dropZone)} />;

export default EmptyColumnDropZone;
