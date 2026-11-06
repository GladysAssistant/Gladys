import cx from 'classnames';

import style from './MusicBox.css';

// Three bars, moving while something plays: the "now playing" cue of player apps
const Equalizer = ({ animated, className }) => (
  <span class={cx(style.equalizer, { [style.equalizerAnimated]: animated }, className)} aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

export default Equalizer;
