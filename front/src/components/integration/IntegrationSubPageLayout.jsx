import { Text } from 'preact-i18n';

import ChipsScroll from '../chips-scroll';
import BackToIntegrationsLink from './BackToIntegrationsLink';

// The Horizon shell every integration sub-page shares: the back-to-catalog
// link, the page title, and the section menu as a horizontal row of frosted
// pills under the title (the settings menu's grammar) instead of the old
// left column — with the app nav in the left rail, a second vertical menu
// cost a quarter of the content width. When the row overflows it scrolls
// sideways with an arrow on each side while tabs remain past that edge
// (shared ChipsScroll bookkeeping), which is also the mobile behavior.
// The tabs come in as JSX (preact-router Links with activeClassName="active",
// DeviceConfigurationLink…) so each integration keeps its own conditional
// entries; the hz-tab-link pill grammar lives in
// components/layout/horizonIntegrations.css with the rest of the
// integration furniture, scoped to the .glass-theme .page shell this
// component renders.
const IntegrationSubPageLayout = ({ title, tabs, children }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <BackToIntegrationsLink />
          <h3 class="page-title mb-3">{title}</h3>
          {tabs && (
            <ChipsScroll
              wrapperClass="hz-tabs-wrapper"
              scrollerClass="hz-tabs"
              leftButtonClass="hz-tabs-scroll-btn hz-tabs-scroll-btn-left"
              rightButtonClass="hz-tabs-scroll-btn hz-tabs-scroll-btn-right"
              scrollLeftLabel={<Text id="integration.menuScrollLeft" />}
              scrollRightLabel={<Text id="integration.menuScrollRight" />}
              activeSelector=".hz-tab-link.active"
            >
              {tabs}
            </ChipsScroll>
          )}
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default IntegrationSubPageLayout;
