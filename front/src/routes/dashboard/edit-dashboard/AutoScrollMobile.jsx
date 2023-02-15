import { useRef, useEffect } from 'preact/hooks';
import { useDrop } from 'react-dnd';
import style from './style.css';

const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';

const ScrollBottomMobile = ({ children, ...props }) => {
  const scrollDown = () => {
    window.scrollBy(0, 10);
  };

  const scrollUp = () => {
    window.scrollBy(0, -10);
  };

  const autoScrollDropRef = useRef(null);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DASHBOARD_EDIT_BOX_TYPE,
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
      style={{ display: canDrop ? 'block' : 'none' }}
      ref={autoScrollDropRef}
      class={props.position === 'top' ? style.scrollTopGuide : style.scrollBottomGuide}
    />
  );
};

export default ScrollBottomMobile;
