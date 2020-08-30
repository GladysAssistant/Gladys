import { Text, MarkupText, Localizer } from 'preact-i18n';
import GatewayLoginForm from '../../components/gateway/GatewayLoginForm';

const LoginGatewayPage = ({ children, ...props }) => (
  <div class="container">
    <div class="row">
      <div class="col col-login mx-auto">
        <div class="text-center mb-6">
          <h2>
            <Localizer>
              <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt={<Text id="global.logoAlt" />} />
            </Localizer>
            <Text id="login.title" />
          </h2>
        </div>
        <GatewayLoginForm {...props} />
        <div class="text-center text-muted">
          <MarkupText id="login.needHelpText" />
        </div>
      </div>
    </div>
  </div>
);

export default LoginGatewayPage;
