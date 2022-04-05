import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { RequestStatus } from '../../../utils/consts';
import cx from 'classnames';
import get from 'get-value';
import iconList from '../../../../../server/config/icons.json';
import iconListGroups from '../../../../../server/config/icons-groups';
import style from './style.css';

const NewScenePage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <Link href="/dashboard/scene" class="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </Link>
    <div class="row">
      <div class="col col-10 mx-auto">
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
            <div class={cx('form-group')}>
              <div class="col-auto d-flex justify-content-between align-items-center">
                <div>
                  <label class="form-label">
                    <Text id="newScene.iconLabel" />
                  </label>
                </div>

                <div>
                <span class="btn-group">
                  <button class="btn btn-secondary" name="listView" onClick={props.handleClick}>
                    {`Vue liste`}
                  </button>
                  <button class="btn btn-secondary" name="groupView" onClick={props.handleClick2}>
                    {`Vue groupe`}
                  </button>
                </span>
                </div>
                
              </div>
              {get(props, 'newSceneErrors.icon') && (
                <div class="alert alert-danger">
                  <Text id="newScene.invalidIcon" />
                </div>
              )}
              {/*console.log(props)*/}
            </div>
            {/*<div class={cx('row', style.iconContainer)}>*/}
            <div class={cx('form-group', style.iconGlobalContainer)}>
              {props.selectIconView === "iconGroup" && (
                Object.keys(iconListGroups).map(iconGroup => (
                  <div class={cx('form-group', style.iconContainerRow)}>
                    <label class="form-label">{iconGroup}</label>
                    <div class={cx('row', style.iconContainer)}>
                      {iconListGroups[iconGroup].map(icon => (
                        <div class="col-auto">
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
                ))
              )}
              {props.selectIconView === "iconList" && (
                iconList.map(icon => (
                  <div class={cx('form-group', style.iconContainerRow)}>
                    <div class={cx('row', style.iconContainer)}>
                  <div class="col">
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
                  </div>
                  </div>
                ))
              )}
            </div>
            <div class="form-footer">
              <button
                onClick={props.createScene}
                class="btn btn-primary btn-block"
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
