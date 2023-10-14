import { Component } from 'preact';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import { Text } from 'preact-i18n';
import ErrorPage from './ErrorPage';

class ExchangeTokenPage extends Component {
  exchangeToken = async () => {
    this.setState({
      exchangeTokenStatus: RequestStatus.Getting,
      exchangeTokenError: null
    });

    try {
      const { code, region, redirectUrl, state } = this.props;

      await this.props.httpClient.post('/api/v1/service/ewelink/token', {
        code,
        region,
        redirect_url: redirectUrl,
        state
      });
      this.setState({
        exchangeTokenStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      console.error(e.response);
      this.setState({
        exchangeTokenStatus: RequestStatus.Error,
        exchangeTokenError: e
      });
    }
  };

  componentDidMount() {
    this.exchangeToken();
  }

  render({}, { exchangeTokenStatus = RequestStatus.Getting, exchangeTokenError }) {
    const { response = {} } = exchangeTokenError || {};
    const { data = {} } = response;
    const { message } = data;

    return (
      <div
        class={cx('dimmer', {
          active: exchangeTokenStatus === RequestStatus.Getting,
          'py-3': exchangeTokenStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {exchangeTokenStatus === RequestStatus.Error && (
            <ErrorPage>
              <div>
                <Text id="integration.eWeLink.setup.exchangeTokenError" />
                <br />
                <i>{message ? message : exchangeTokenError}</i>
              </div>
            </ErrorPage>
          )}
          {exchangeTokenStatus === RequestStatus.Success && (
            <div>
              <Text id="integration.eWeLink.setup.exchangeTokenSuccess" />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ExchangeTokenPage;
