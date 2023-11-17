import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { RequestStatus } from '../../../utils/consts';
import cx from 'classnames';
import get from 'get-value';
import iconList from '../../../../../server/config/icons.json';
import style from './style.css';

const NewScenePage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <Link href="/dashboard/scene" class="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </Link>
    <div class="row">
      <div class="col col-login mx-auto">
        <form onSubmit={props.createScene} class="card">
          <div class="card-body p-6">
            <div class="card-title">
              <Text id="newScene.cardTitle" />
            </div>
            {props.createSceneStatus === RequestStatus.ConflictError && (
              <div class="alert alert-danger">
                <Text id="newScene.sceneAlreadyExist" />
              </div>
            )}
            <div class="form-group">
              <label class="form-label">
                <Text id="newScene.nameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class={cx('form-control', {
                    'is-invalid': get(props, 'newSceneErrors.name')
                  })}
                  placeholder={<Text id="newScene.nameLabel" />}
                  value={get(props, 'newScene.name')}
                  onInput={props.updateNewSceneName}
                />
              </Localizer>
              <div class="invalid-feedback">
                <Text id="newScene.invalidName" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <Text id="newScene.iconLabel" />
              </label>
              {get(props, 'newSceneErrors.icon') && (
                <div class="alert alert-danger">
                  <Text id="newScene.invalidIcon" />
                </div>
              )}
              <div class={cx('row', style.iconContainer)}>
                {iconList.map(icon => (
                  <div class="col-2">
                    <div
                      class={cx('text-center', style.iconDiv, {
                        [style.iconDivChecked]: get(props, 'newScene.icon') === icon
                      })}
                    >
                      <label class={style.iconLabel}>
                        <input
                          name="icon"
                          type="radio"
                          onChange={props.updateNewSceneIcon}
                          checked={get(props, 'newScene.icon') === icon}
                          value={icon}
                          class={style.iconInput}
                        />
                        <i class={`fe fe-${icon}`} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div class="form-footer">
              <button
                onClick={props.createScene}
                className="btn btn-primary btn-block"
                disabled={props.createSceneStatus === RequestStatus.Getting}
              >
                <Text id="newScene.createSceneButton" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default NewScenePage;
