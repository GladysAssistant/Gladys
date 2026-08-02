import { Text, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../utils/consts';
import cx from 'classnames';
import get from 'get-value';
import style from './style.css';
import IconSelector from '../../../components/scene/IconSelector';

const DuplicateScenePage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <button onClick={props.goBack} className="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </button>

    <div class="row">
      <div class={cx('col mx-auto', style.sceneFormCol)}>
        <form onSubmit={props.duplicateScene} class="card">
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="card-body p-6">
              <div class="dimmer-content">
                <div class="card-title">
                  <Text id="duplicateScene.cardTitle" fields={{ name: props.sourceScene.name }} />
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
                      disabled={props.loading}
                      placeholder={<Text id="duplicateScene.namePlaceholder" />}
                      value={get(props, 'scene.name')}
                      onInput={props.updateDuplicateSceneName}
                    />
                  </Localizer>
                  <div class="invalid-feedback">
                    <Text id="duplicateScene.invalidName" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Text id="duplicateScene.iconLabel" />
                  </label>
                  {get(props, 'duplicateSceneErrors.icon') && (
                    <div className="alert alert-danger">
                      <Text id="duplicateScene.invalidIcon" />
                    </div>
                  )}
                  <IconSelector value={get(props, 'scene.icon')} onChange={props.updateDuplicateSceneIcon} />
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
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default DuplicateScenePage;
