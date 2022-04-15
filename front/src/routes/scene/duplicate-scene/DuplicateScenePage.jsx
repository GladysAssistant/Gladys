import { Text, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../utils/consts';
import cx from 'classnames';
import get from 'get-value';
import style from './style.css';

const DuplicateScenePage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <button onClick={props.goBack} className="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </button>

    <div class="row">
      <div class="col col-login mx-auto">
        <form onSubmit={props.duplicateScene} class="card">
          <div class="card-body p-6">
            <div class="card-title">
              <Text id="duplicateScene.cardTitle" />
            </div>
            {props.duplicateSceneStatus === RequestStatus.ConflictError && (
              <div class="alert alert-danger">
                <Text id="duplicateScene.sceneAlreadyExist" />
              </div>
            )}
            <div class="form-group">
              <label class="form-label">
                <Text id="duplicateScene.nameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class={cx('form-control', {
                    'is-invalid': get(props, 'duplicateSceneErrors.name')
                  })}
                  placeholder={<Text id="duplicateScene.nameLabel" />}
                  value={get(props, 'scene.name')}
                  onInput={props.updateDuplicateSceneName}
                />
              </Localizer>
              <div class="invalid-feedback">
                <Text id="duplicateScene.invalidName" />
              </div>
            </div>

            <div class="form-footer">
              <button
                onClick={props.duplicateScene}
                class="btn btn-primary btn-block"
                disabled={props.duplicateSceneStatus === RequestStatus.Getting}
              >
                <Text id="duplicateScene.duplicateSceneButton" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default DuplicateScenePage;
