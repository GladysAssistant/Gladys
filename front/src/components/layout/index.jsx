import { h } from 'preact';
import cx from 'classnames';

// The integration catalog and every integration sub-page live on the Horizon
// glass scene, like the dashboard (routes/dashboard/style.css). Applied here,
// on the one wrapper every route shares, so the ~40 integration layouts don't
// each have to carry the theme classes — and a new integration gets the theme
// for free.
import dashboardStyle from '../../routes/dashboard/style.css';
// Glass variants of the Tabler furniture the integration pages are made of —
// loaded here (main bundle) because the code-split catalog CSS is not
import './horizonIntegrations.css';

const NOT_MAIN_PAGES = ['/login'];
const INTEGRATION_URL_PREFIX = '/dashboard/integration';

const notMainPages = currentUrl => {
  const found = NOT_MAIN_PAGES.find(page => {
    return currentUrl.startsWith(page);
  });
  if (found) {
    return true;
  }
  return false;
};

const Layout = ({ children, ...props }) => {
  const currentUrl = props.currentUrl || '';
  const integrationPage = currentUrl.startsWith(INTEGRATION_URL_PREFIX);
  return (
    <div class="page">
      <div
        class={cx(notMainPages(currentUrl) ? 'page-single' : 'page-main', {
          [`glass-theme ${dashboardStyle.dashboardBackground} ${dashboardStyle.glassScene}`]: integrationPage
        })}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
