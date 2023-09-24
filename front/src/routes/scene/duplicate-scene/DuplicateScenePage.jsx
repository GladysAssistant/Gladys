import { Text, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../utils/consts';
import cx from 'classnames';
import get from 'get-value';
import style from './style.css';
import iconList from '../../../../../server/config/icons.json';

const DuplicateScenePage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <button onClick={props.goBack} className="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </button>

    <div class="row">
      <div class="col col-login mx-auto">
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
                  <div className={cx('row', style.iconContainer)}>
                    {iconList.map(icon => (
                      <div className="col-2">
                        <div
                          className={cx('text-center', style.iconDiv, {
                            [style.iconDivChecked]: get(props, 'scene.icon') === icon
                          })}
                        >
                          <label className={style.iconLabel}>
                            <input
                              name="icon"
                              type="radio"
                              onChange={props.updateDuplicateSceneIcon}
                              checked={get(props, 'scene.icon') === icon}
                              value={icon}
                              className={style.iconInput}
                            />
                            <i className={`fe fe-${icon}`} />
                          </label>
                        </div>
                      </div>
                    ))}
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
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default DuplicateScenePage;
