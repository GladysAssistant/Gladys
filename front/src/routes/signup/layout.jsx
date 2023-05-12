import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

const SignupLayout = ({ children, ...props }) => (
  <div class="page">
    <div class="page-single mt-4">
      <div class="container">
        <div class="row">
          <div class="col mx-auto">
            <div class="text-center mb-6">
              <h2>
                <Localizer>
                  <img
                    src="/assets/icons/favicon-96x96.png"
                    class="header-brand-img"
                    alt={<Text id="global.logoAlt" />}
                  />
                </Localizer>
                <Text id="login.title" />
              </h2>
            </div>
            <div class="card">
              <div class="card-body">
                <ul class="nav nav-pills nav-fill">
                  <li
                    class={cx('nav-item', {
                      'd-none d-lg-block': props.currentUrl !== '/signup'
                    })}
                  >
                    <Link
                      class={cx('nav-link', style.navLinkWithoutCursor, {
                        active: props.currentUrl === '/signup'
                      })}
                      href="#"
                    >
                      <Text id="login.welcome" />
                    </Link>
                  </li>
                  <li
                    class={cx('nav-item', {
                      'd-none d-lg-block': props.currentUrl !== '/signup/create-account-local'
                    })}
                  >
                    <Link
                      class={cx('nav-link', style.navLinkWithoutCursor, {
                        active: props.currentUrl === '/signup/create-account-local'
                      })}
                      href="#"
                    >
                      <Text id="login.createAccountStep" />
                    </Link>
                  </li>
                  <li
                    class={cx('nav-item', {
                      'd-none d-lg-block': props.currentUrl !== '/signup/preference'
                    })}
                  >
                    <Link
                      class={cx('nav-link', style.navLinkWithoutCursor, {
                        active: props.currentUrl && props.currentUrl === '/signup/preference'
                      })}
                      href="#"
                    >
                      <Text id="login.preferencesStep" />
                    </Link>
                  </li>
                  <li
                    class={cx('nav-item', {
                      'd-none d-lg-block': props.currentUrl !== '/signup/configure-house'
                    })}
                  >
                    <Link
                      class={cx('nav-link', style.navLinkWithoutCursor, {
                        active: props.currentUrl && props.currentUrl === '/signup/configure-house'
                      })}
                      href="#"
                    >
                      <Text id="login.houseStep" />
                    </Link>
                  </li>
                  <li
                    class={cx('nav-item', {
                      'd-none d-lg-block': props.currentUrl !== '/signup/success'
                    })}
                  >
                    <Link
                      class={cx('nav-link', style.navLinkWithoutCursor, {
                        active: props.currentUrl && props.currentUrl === '/signup/success'
                      })}
                      href="#"
                    >
                      <Text id="login.success" />
                    </Link>
                  </li>
                </ul>
              </div>
              <div class="card-body p-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SignupLayout;
