import { Text, Localizer } from 'preact-i18n';

const GatewayPage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="signup.restoreBackupSetBackupKey.title" />
      </h2>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <p>
              <Text id="signup.restoreBackupSetBackupKey.description" />
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="signup.restoreBackupSetBackupKey.backupKeyLabel" />
            </label>
            <Localizer>
              <input
                class="form-control"
                value={props.backupKey}
                onChange={props.updateBackupKey}
                placeholder={<Text id="signup.restoreBackupSetBackupKey.backupKeyPlaceholder" />}
              />
            </Localizer>
          </div>
        </div>
      </div>
    </div>
    <div class="card-footer text-right">
      <div class="d-flex">
        <button type="submit" class="btn btn-primary ml-auto" onClick={props.saveBackupKey}>
          <Text id="signup.restoreBackupSetBackupKey.saveButton" />
        </button>
      </div>
    </div>
  </div>
);

export default GatewayPage;
