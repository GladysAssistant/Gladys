import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../utils/consts';
import style from './style.css';

const DuplicateDashboardPage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <button onClick={props.goBack} class="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </button>

    <div class="row">
      <div class="col col-login mx-auto">
        <form onSubmit={props.duplicateDashboard} class="card">
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body p-6">
                <div class="card-title">
                  <Text id="duplicateDashboard.cardTitle" fields={{ name: props.sourceDashboard.name }} />
                </div>
                <div class="alert alert-info">
                  <Text id="duplicateDashboard.savedVersionInfo" />
                </div>
                {props.duplicateDashboardStatus === RequestStatus.ConflictError && (
                  <div class="alert alert-danger">
                    <Text id="duplicateDashboard.dashboardAlreadyExist" />
                  </div>
                )}
                {props.duplicateDashboardStatus === RequestStatus.Error && (
                  <div class="alert alert-danger">
                    <Text id="duplicateDashboard.unknownError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label">
                    <Text id="duplicateDashboard.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      class={cx('form-control', {
                        'is-invalid': get(props, 'duplicateDashboardErrors.name')
                      })}
                      disabled={props.loading}
                      placeholder={<Text id="duplicateDashboard.namePlaceholder" />}
                      value={get(props, 'dashboard.name')}
                      onInput={props.updateDuplicateDashboardName}
                    />
                  </Localizer>
                  <div class="invalid-feedback">
                    <Text id="duplicateDashboard.invalidName" />
                  </div>
                </div>
                <div class="form-footer">
                  <button
                    onClick={props.duplicateDashboard}
                    class="btn btn-primary btn-block"
                    disabled={props.duplicateDashboardStatus === RequestStatus.Getting}
                  >
                    <Text id="duplicateDashboard.duplicateDashboardButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default DuplicateDashboardPage;
