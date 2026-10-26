import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';

import RunningStopButton from '../RunningStopButton';
import style from './style.css';

const EditActions = props => (
  <div class={cx('fixed-bottom footer', style.editFooter)}>
    <div class="container">
      {props.askDeleteScene ? (
        <div class="row align-items-center">
          <div class="col-auto d-none d-sm-block text-muted">
            <Text id="editScene.deleteText" />
          </div>
          <div class="col-auto">
            <button onClick={props.deleteScene} className="btn btn-outline-danger">
              <Text id="editScene.deleteButton" /> <i class="fe fe-trash" />
            </button>
            <button onClick={props.cancelDeleteCurrentScene} className="btn btn-outline-secondary ml-2">
              <Text id="editScene.cancelButton" /> <i class="fe fe-slash" />
            </button>
          </div>
        </div>
      ) : (
        <div class={cx('row align-items-center', style.editFooterRow)}>
          <div class="col-auto">
            <Localizer>
              <button
                onClick={props.duplicateScene}
                aria-label={<Text id="editScene.duplicateButton" />}
                className={cx('btn btn-outline-primary', style.editFooterIconButton)}
              >
                <span class="d-none d-lg-inline-block" aria-hidden="true">
                  <Text id="editScene.duplicateButton" />
                </span>{' '}
                <i class="fe fe-copy" />
              </button>
            </Localizer>
            <Localizer>
              <button
                onClick={props.askDeleteCurrentScene}
                aria-label={<Text id="editScene.deleteButton" />}
                className={cx('btn btn-outline-danger ml-2', style.editFooterIconButton)}
              >
                <span class="d-none d-lg-inline-block" aria-hidden="true">
                  <Text id="editScene.deleteButton" />
                </span>{' '}
                <i class="fe fe-trash" />
              </button>
            </Localizer>
          </div>
          <div class="col d-none d-sm-block">
            <span class={cx('text-muted', style.saveIndicator)}>
              {props.hasUnsavedChanges ? (
                <span>
                  <i class={cx('fe fe-alert-circle', style.saveIndicatorUnsaved)} />{' '}
                  <Text id="editScene.unsavedChanges" />
                </span>
              ) : (
                <span>
                  <i class={cx('fe fe-check-circle', style.saveIndicatorSaved)} /> <Text id="editScene.savedLabel" />
                </span>
              )}
            </span>
          </div>
          <div class="col-auto ml-auto">
            {props.runningInfo ? (
              <RunningStopButton runningInfo={props.runningInfo} onStop={props.stopScene} />
            ) : (
              <Localizer>
                <button
                  onClick={props.startScene}
                  aria-label={<Text id="editScene.startButton" />}
                  className="btn btn-primary"
                >
                  <span class={style.editFooterStartLabel} aria-hidden="true">
                    <Text id="editScene.startButton" />
                  </span>{' '}
                  <i class="fe fe-play" />
                </button>
              </Localizer>
            )}
            <button onClick={props.saveScene} disabled={props.saving} className="btn btn-success ml-2">
              <Text id="editScene.saveButton" /> <i class="fe fe-save" />
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default EditActions;
