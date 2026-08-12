import { Link } from 'preact-router/match';

// By default, Preact-router is not scrolling to the top when clicking on a link.
// This component is used to scroll to the top when clicking on a link.
// See : https://github.com/preactjs/preact-router/issues/319
const ScrollToTopLink = ({ children, ...props }) => {
  const handleClick = e => {
    // Call the original onClick if it exists
    if (props.onClick) {
      props.onClick(e);
    }
    // Scroll to top
    window.scrollTo(0, 0);
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default ScrollToTopLink;
