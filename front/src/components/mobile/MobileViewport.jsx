import { Component } from 'preact';

import { isMobileViewport, watchMobileViewport } from '../../utils/mobileViewport';

/**
 * @description Gives a component the `isMobile` prop (docs/specs/mobile-pages/README.md, B): true
 * on a viewport narrower than 768px or a phone held in landscape, re-evaluated when the viewport
 * crosses the breakpoint (rotation, window resize). A page picks its phone layout with it, the
 * way the scene pages do.
 * @param {Function} WrappedComponent - The component to wrap.
 * @returns {Function} The wrapped component.
 * @example
 * export default withMobileViewport(MyPage);
 */
const withMobileViewport = WrappedComponent =>
  class MobileViewport extends Component {
    state = {
      isMobile: isMobileViewport()
    };

    // the viewport may have changed between the first render and the subscription
    syncViewport = () => {
      if (isMobileViewport() !== this.state.isMobile) {
        this.setState({ isMobile: isMobileViewport() });
      }
    };

    componentDidMount() {
      this.unwatch = watchMobileViewport(isMobile => this.setState({ isMobile }));
      this.syncViewport();
    }

    componentWillUnmount() {
      if (this.unwatch) {
        this.unwatch();
      }
    }

    render(props, { isMobile }) {
      return <WrappedComponent {...props} isMobile={isMobile} />;
    }
  };

export default withMobileViewport;
