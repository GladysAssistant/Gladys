import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';

import { RequestStatus } from '../../../../../../utils/consts';
import ErrorPage from './ErrorPage';
import ExchangeTokenPage from './ExchangeTokenPage';

class EweLinkSetupLoginPage extends Component {
  exchangeToken = async config => {
    this.setState({
      saveEwelinkConfig: RequestStatus.Getting
    });
    try {
      const { applicationId, applicationSecret, applicationRegion } = config;
      const savedConfig = await this.props.httpClient.post('/api/v1/service/ewelink/token', {
        application_id: applicationId,
        application_secret: applicationSecret,
        application_region: applicationRegion
      });
      const ewelinkConfig = {
        applicationId: savedConfig.application_id,
        applicationSecret: savedConfig.application_secret,
        applicationRegion: savedConfig.application_secret
      };
      this.setState({
        ewelinkConfig,
        saveEwelinkConfig: RequestStatus.Success
      });
    } catch (e) {
      console.error('eWeLink error saving config', e);
      this.setState({
        saveEwelinkConfig: RequestStatus.Error
      });
    }
  };

  constructor(props) {
    super(props);

    const { search: queryString, origin, pathname } = window.location;
    const queryParams = new URLSearchParams(queryString);

    // Map query params to JSON Object
    const params = {};
    for (const [key, value] of queryParams.entries()) {
      params[key] = value;
    }

    this.state = {
      params,
      redirectUrl: `${origin}${pathname}`
    };
  }

  render({ httpClient }, { params, redirectUrl }) {
    const { code, region, state } = params;
    const success = code && region && state;

    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row">
                <div class="col-lg-12">
                  <div class="container mt-4">
                    <div class="d-flex justify-content-center card">
                      <div class="card-body p-6  text-center">
                        <div class="card-title">
                          <h3>
                            <Localizer>
                              <img
                                src="/assets/integrations/cover/ewelink_logo.png"
                                class="header-brand-img"
                                alt={<Text id="integration.eWeLink.title" />}
                              />
                            </Localizer>
                            <Text id="integration.eWeLink.title" />
                          </h3>
                        </div>
                        {success && (
                          <ExchangeTokenPage
                            httpClient={httpClient}
                            code={code}
                            redirectUrl={redirectUrl}
                            region={region}
                            state={state}
                          />
                        )}
                        {!success && (
                          <ErrorPage>
                            <Text id="integration.eWeLink.setup.loginRedirectError" />
                          </ErrorPage>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient')(EweLinkSetupLoginPage);
