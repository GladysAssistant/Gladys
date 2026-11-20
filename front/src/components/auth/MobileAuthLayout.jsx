import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { MobileNavBar, kitStyle } from '../mobile';
import dashboardStyle from '../../routes/dashboard/style.css';
import style from './style.css';

// The router keeps the scroll position from one page to the next: a screen reached from the
// button at the bottom of the previous one would open on its end
class StartAtTop extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
  }

  render({ children }) {
    return children;
  }
}

/**
 * @description The shell of a logged-out page on a phone (docs/specs/mobile-pages/auth.md, B):
 * the Horizon wallpaper of AuthLayout, the navigation bar of the kit with the brand as its
 * title — and the way back when the page has one —, then the content of the page. The page
 * brings its own bottom bar (MobileAuthBar).
 *
 * title: replaces the brand. titleId: the name next to the logo ("Gladys Assistant" when
 * omitted). backHref / onBack / backLabel: the back control of the navigation bar.
 * bottomBar: false when the page has no bottom bar (the content then ends with the page).
 * screen: which screen of the page is shown, for a page that has several (the steps of a flow,
 * a form then its answer) — a new screen starts at the top, like a new page.
 */
const MobileAuthLayout = ({
  children,
  title,
  titleId,
  backHref,
  onBack,
  backLabel,
  bottomBar = true,
  screen,
  dataCy
}) => (
  <div
    class={cx(
      'glass-theme',
      'settings-page',
      'auth-page',
      dashboardStyle.dashboardBackground,
      dashboardStyle.glassScene,
      // the surfaces of the kit are the frosted glass of the theme (kit.css, "Glass variant")
      'gladys-mobile-glass'
    )}
    data-cy={dataCy}
  >
    <StartAtTop key={screen} />
    <div class={kitStyle.page}>
      <MobileNavBar
        title={
          title || (
            <span class={style.mobileBrand}>
              <Localizer>
                <img src="/assets/icons/favicon-96x96.png" alt={<Text id="global.logoAlt" />} />
              </Localizer>
              <Text id={titleId || 'login.title'} />
            </span>
          )
        }
        backHref={backHref}
        onBack={onBack}
        backLabel={backLabel}
      />
      <div class={cx(kitStyle.content, style.mobileContent, { [kitStyle.contentWithBottomBar]: bottomBar })}>
        {children}
      </div>
    </div>
  </div>
);

export default MobileAuthLayout;
