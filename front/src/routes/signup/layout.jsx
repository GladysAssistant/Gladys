import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';

const SignupLayout = ({ children, ...props }) => (
  <div class="page">
    <div
      class="page-single"
      style={{
        marginTop: '10px'
      }}
    >
      <div class="container">
        <div class="row">
          <div
            class="col mx-auto"
            style={{
              maxWidth: '60rem'
            }}
          >
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
                  <li class="nav-item">
                    <Link
                      class={props.currentUrl && props.currentUrl === '/signup' ? 'active nav-link' : 'nav-link'}
                      href="#"
                    >
                      <Text id="login.welcome" />
                    </Link>
                  </li>
                  <li class="nav-item">
                    <Link
                      class={
                        props.currentUrl && props.currentUrl.startsWith('/signup/create-account')
                          ? 'active nav-link'
                          : 'nav-link'
                      }
                      href="#"
                    >
                      <Text id="login.createAccountStep" />
                    </Link>
                  </li>
                  <li class="nav-item">
                    <Link
                      class={
                        props.currentUrl && props.currentUrl.startsWith('/signup/preference')
                          ? 'active nav-link'
                          : 'nav-link'
                      }
                      href="#"
                    >
                      <Text id="login.preferencesStep" />
                    </Link>
                  </li>
                  <li class="nav-item">
                    <Link
                      class={
                        props.currentUrl && props.currentUrl.startsWith('/signup/configure-house')
                          ? 'active nav-link'
                          : 'nav-link'
                      }
                      href="#"
                    >
                      <Text id="login.houseStep" />
                    </Link>
                  </li>
                  <li class="nav-item">
                    <Link
                      class={
                        props.currentUrl && props.currentUrl.startsWith('/signup/success')
                          ? 'active nav-link'
                          : 'nav-link'
                      }
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
