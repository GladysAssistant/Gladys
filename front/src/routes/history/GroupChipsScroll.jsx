import cx from 'classnames';
import { Text } from 'preact-i18n';

import ChipsScroll from '../../components/chips-scroll';
import style from './style.css';

// The filter capsule dressed on the shared Horizon chips scroller: the
// sticky stadium wrapper, the frosted track and the overflow arrows are
// this page's grammar (style.css), the scroll bookkeeping is shared.
const GroupChipsScroll = ({ children }) => (
  <ChipsScroll
    wrapperClass={style.groupChipsWrapper}
    scrollerClass={style.groupChips}
    leftButtonClass={cx(style.groupChipsScrollBtn, style.groupChipsScrollBtnLeft)}
    rightButtonClass={cx(style.groupChipsScrollBtn, style.groupChipsScrollBtnRight)}
    scrollLeftLabel={<Text id="history.scrollLeft" />}
    scrollRightLabel={<Text id="history.scrollRight" />}
  >
    {children}
  </ChipsScroll>
);

export default GroupChipsScroll;
