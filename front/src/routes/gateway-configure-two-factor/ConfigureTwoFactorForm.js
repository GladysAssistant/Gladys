import { Text, MarkupText, Localizer } from 'preact-i18n';

const ConfigureTwoFactorForm = ({ children, ...props }) => (
  <div class="page">
    <div class="page-single" style={{ marginTop: '40px' }}>
      <div class="container">
        <div class="row">
          <div class="col col-login mx-auto">
            <div class="text-center mb-6">
              <h2>
                <Text id="gatewayTwoFactorAuth.title" />
              </h2>
            </div>

            {props.step === 1 && (
              <div class="card">
                <div class="card-body p-6">
                  <div class="card-title">
                    <Text id="gatewayTwoFactorAuth.configureTitle" />
                  </div>
                  <p>
                    <Text id="gatewayTwoFactorAuth.securityIsImportant" />
                  </p>
                  <p>
                    <MarkupText id="gatewayTwoFactorAuth.securityApps" />
                  </p>

                  <div class="form-footer">
                    <button onClick={props.nextStep} class="btn btn-primary btn-block">
                      <Text id="gatewayTwoFactorAuth.configureButton" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {props.step === 2 && (
              <div class="card">
                <form onSubmit={props.enableTwoFactor}>
                  <div class="card-body p-6">
                    <div class="card-title">
                      <Text id="gatewayTwoFactorAuth.configureTitle" />
                    </div>

                    {props.errored && (
                      <div class="alert alert-danger" role="alert">
                        <Text id="gatewayTwoFactorAuth.invalidCode" />
                      </div>
                    )}

                    <p>
                      <ul>
                        <li>
                          <Text id="gatewayTwoFactorAuth.app.open" />
                        </li>
                        <li>
                          <Text id="gatewayTwoFactorAuth.app.addAccount" />
                        </li>
                        <li>
                          <Text id="gatewayTwoFactorAuth.app.scanQRCode" />
                        </li>
                      </ul>
                    </p>

                    <div class="form-group">
                      {props.dataUrl && (
                        <img class="mx-auto d-block" src={props.dataUrl} style={{ marginBottom: '20px' }} />
                      )}
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        <Text id="gatewayTwoFactorAuth.secretLabel" />
                      </label>
                      <div class="input-group">
                        <input type="text" class="form-control" disabled value={props.secret} />
                        <div class="input-group-append">
                          <button class="btn btn-outline-secondary" type="button" onClick={props.copySecret}>
                            <Text id="gatewayTwoFactorAuth.copy" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        <Text id="gatewayTwoFactorAuth.confirmCode" />
                      </label>
                      <Localizer>
                        <input
                          type="text"
                          class="form-control"
                          aria-describedby="emailHelp"
                          placeholder={<Text id="gatewayTwoFactorAuth.enterCode" />}
                          value={props.twoFactorCode}
                          onInput={props.updateTwoFactorCode}
                        />
                      </Localizer>
                    </div>

                    <div class="form-footer">
                      <button class="btn btn-primary btn-block">
                        <Text id="gatewayTwoFactorAuth.enable" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ConfigureTwoFactorForm;
