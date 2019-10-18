const ConfigureTwoFactorForm = ({ children, ...props }) => (
  <div class="page">
    <div class="page-single" style={{ marginTop: '40px' }}>
      <div class="container">
        <div class="row">
          <div class="col col-login mx-auto">
            <div class="text-center mb-6">
              <h2>Gladys Gateway</h2>
            </div>

            {props.step === 1 && (
              <div class="card">
                <div class="card-body p-6">
                  <div class="card-title">Configure Two-Factor Authentication</div>
                  <p>The security of your Gladys Gateway account is really important to us.</p>
                  <p>
                    To ensure that your account remains secure, please enable two-factor authentication using a
                    two-factor app like Authy on{' '}
                    <a href="https://itunes.apple.com/us/app/authy/id494168017?mt=8">iOS</a> or{' '}
                    <a href="https://play.google.com/store/apps/details?id=com.authy.authy">Android</a>.
                  </p>

                  <div class="form-footer">
                    <button onClick={props.nextStep} class="btn btn-primary btn-block">
                      Configure Two-Factor Authentication
                    </button>
                  </div>
                </div>
              </div>
            )}

            {props.step === 2 && (
              <div class="card">
                <form onSubmit={props.enableTwoFactor}>
                  <div class="card-body p-6">
                    <div class="card-title">Configure Two-Factor Authentication</div>

                    {props.errored && (
                      <div class="alert alert-danger" role="alert">
                        The 2FA code you provided is not valid.
                      </div>
                    )}

                    <p>
                      <ul>
                        <li>Open your 2FA app</li>
                        <li>Click on "Add Account"</li>
                        <li>Scan the QR Code below</li>
                      </ul>
                    </p>

                    <div class="form-group">
                      {props.dataUrl && (
                        <img class="mx-auto d-block" src={props.dataUrl} style={{ marginBottom: '20px' }} />
                      )}
                    </div>

                    <div class="form-group">
                      <label class="form-label">Confirm Two Factor</label>
                      <input
                        type="text"
                        class="form-control"
                        aria-describedby="emailHelp"
                        placeholder="Enter 6 digits code"
                        value={props.twoFactorCode}
                        onInput={props.updateTwoFactorCode}
                      />
                    </div>

                    <div class="form-footer">
                      <button class="btn btn-primary btn-block">Enable Two-Factor Authentication</button>
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
