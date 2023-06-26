import { useRef, useEffect } from 'preact/hooks';
import { useDrop } from 'react-dnd';
import cx from 'classnames';

import style from './style.css';

// We use Preact Hooks here because the library react-dnd needs that
// We do not recommend using them in other places in Gladys front
const ScrollBottomMobile = ({ children, ...props }) => {
  const scrollDown = () => {
    window.scrollBy(0, 10);
  };

  const scrollUp = () => {
    window.scrollBy(0, -10);
  };

  const autoScrollDropRef = useRef(null);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: props.box_type,
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  drop(autoScrollDropRef);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isOver) {
        if (props.position === 'top') scrollUp();
        else scrollDown();
      } else {
        clearInterval(intervalId);
      }
    }, 10);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOver]);

  return (
    <div
      ref={autoScrollDropRef}
      class={cx({
        'd-none': !canDrop,
        [style.scrollTopGuide]: props.position === 'top',
        [style.scrollBottomGuide]: props.position !== 'top'
      })}
    />
  );
};

export default ScrollBottomMobile;
