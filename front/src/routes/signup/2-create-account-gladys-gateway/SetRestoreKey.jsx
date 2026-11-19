import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { MobileAuthCard } from '../../../components/auth/mobile';
import {
  MobileField,
  MobileNotice,
  fieldClass,
  MobileBottomBar,
  BigButton,
  kitStyle
} from '../../../components/mobile';

// The backup key on a phone: a key is pasted or typed as it is, so the keyboard does not
// capitalize nor correct it
const MobileSetRestoreKey = props => (
  <form
    onSubmit={e => {
      e.preventDefault();
      props.saveBackupKey();
    }}
    data-cy="signup-restore-key-mobile"
  >
    <h1 class={kitStyle.largeTitle}>
      <Text id="signup.restoreBackupSetBackupKey.title" />
    </h1>
    <p class={kitStyle.lead}>
      <Text id="signup.restoreBackupSetBackupKey.description" />
    </p>
    {props.error && (
      <MobileNotice tone="danger" icon="alert-circle" role="alert">
        <Text id="signup.restoreBackupSetBackupKey.error" />
      </MobileNotice>
    )}
    <MobileAuthCard>
      <MobileField
        label={<Text id="signup.restoreBackupSetBackupKey.backupKeyLabel" />}
        htmlFor="backupKey"
        help={<Text id="signup.mobile.backupKeyHelp" />}
      >
        <Localizer>
          <input
            id="backupKey"
            type="text"
            class={fieldClass.input}
            value={props.backupKey}
            onInput={props.updateBackupKey}
            placeholder={<Text id="signup.restoreBackupSetBackupKey.backupKeyPlaceholder" />}
            autocomplete="off"
            autocapitalize="off"
            autocorrect={false}
            spellcheck={false}
            enterkeyhint="go"
            data-cy="signup-restore-key"
          />
        </Localizer>
      </MobileField>
    </MobileAuthCard>
    <MobileBottomBar>
      <BigButton variant="primary" type="submit" loading={props.loading} data-cy="signup-restore-key-save">
        <Text id="signup.restoreBackupSetBackupKey.saveButton" />
      </BigButton>
    </MobileBottomBar>
  </form>
);

const DesktopSetRestoreKey = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="signup.restoreBackupSetBackupKey.title" />
      </h2>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-12">
          {props.error && (
            <div class="alert alert-danger">
              <Text id="signup.restoreBackupSetBackupKey.error" />
            </div>
          )}
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
        <button
          type="submit"
          class={cx('btn btn-primary ml-auto', { 'btn-loading': props.loading })}
          disabled={props.loading}
          onClick={props.saveBackupKey}
        >
          <Text id="signup.restoreBackupSetBackupKey.saveButton" />
        </button>
      </div>
    </div>
  </div>
);

const GatewayPage = props => (props.mobile ? <MobileSetRestoreKey {...props} /> : <DesktopSetRestoreKey {...props} />);

export default GatewayPage;
