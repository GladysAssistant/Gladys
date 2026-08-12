import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import Layout from './Layout';
import style from './style.css';

class GoogleHomeGateway extends Component {
  cancel = async e => {
    e.preventDefault();
    await this.setState({ loading: true });
    if (this.props.redirect_uri && this.props.state) {
      const redirectUrl = `${this.props.redirect_uri}?state=${this.props.state}&error=cancelled`;
      window.location.replace(redirectUrl);
    } else {
      this.setState({ loading: false, error: true });
    }
  };
  link = async e => {
    e.preventDefault();
    try {
      await this.setState({ loading: true, error: false });
      const responseAuthorize = await this.props.session.gatewayClient.googleHomeAuthorize({
        client_id: this.props.client_id,
        redirect_uri: this.props.redirect_uri,
        state: this.props.state
      });
      window.location.replace(responseAuthorize.redirectUrl);
    } catch (e) {
      await this.setState({ loading: false, error: true });
      console.error(e);
      if (this.props.redirect_uri && this.props.state) {
        const redirectUrl = `${this.props.redirect_uri}?state=${this.props.state}&error=errored`;
        window.location.replace(redirectUrl);
      }
    }
  };

  render(props, { loading, error }) {
    return (
      <Layout>
        <div class="container mt-4">
          <div class="row">
            <div class={cx('col mx-auto', style.colWidth)}>
              <div class="text-center mb-6">
                <h2>
                  <Localizer>
                    <img
                      src="/assets/icons/favicon-96x96.png"
                      class="header-brand-img"
                      alt={<Text id="global.logoAlt" />}
                    />
                  </Localizer>
                  <Text id="integration.googleHome.pageTitle" />
                </h2>
              </div>
              <form class="card">
                <div class="card-body p-6">
                  <div class="card-title">
                    <h3>
                      <Text id="integration.googleHome.cardTitle" />
                    </h3>
                  </div>

                  <div
                    class={cx('dimmer', {
                      active: loading
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      {error && (
                        <p class="alert alert-danger">
                          <Text id="integration.googleHome.error" />
                        </p>
                      )}
                      <p>
                        <Text id="integration.googleHome.pageDescription" />
                      </p>

                      <p>
                        <Text id="integration.googleHome.connectedAs" /> <b>{props.user && props.user.email}</b>
                      </p>

                      <div class="form-group">
                        <h4>
                          <Text id="integration.googleHome.googleWillBeAble" />
                        </h4>
                        <ul class="list-unstyled leading-loose">
                          <li>
                            <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                            <Text id="integration.googleHome.seeDevices" />
                          </li>
                          <li>
                            <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                            <Text id="integration.googleHome.controlDevices" />
                          </li>
                          <li>
                            <i class="fe fe-check text-success mr-2" aria-hidden="true" />{' '}
                            <Text id="integration.googleHome.getNewDeviceValues" />
                          </li>
                        </ul>
                      </div>

                      <p>
                        <MarkupText id="integration.googleHome.privacyPolicy" />
                      </p>

                      <div class="form-footer">
                        <div class="row">
                          <div class="col-6">
                            <button class="btn btn-secondary btn-block" onClick={this.cancel}>
                              <Text id="integration.googleHome.cancelButton" />
                            </button>
                          </div>
                          <div class="col-6">
                            <button class="btn btn-primary btn-block" onClick={this.link}>
                              <Text id="integration.googleHome.connectButton" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default connect('user,session', {})(GoogleHomeGateway);
