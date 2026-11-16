import cx from 'classnames';

import style from './kit.css';

/**
 * @description A segmented control: a choice between two to four options that are all visible.
 * options: [{ value, label }]. `label` (a string) names the group.
 */
const MobileSegmented = ({ options, value, onChange, label, dataCy }) => (
  <div class={style.segmented} role="group" aria-label={label} data-cy={dataCy}>
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        class={cx(style.segment, { [style.segmentSelected]: option.value === value })}
        aria-pressed={option.value === value ? 'true' : 'false'}
        onClick={() => onChange(option.value)}
        data-cy={option.dataCy}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default MobileSegmented;
