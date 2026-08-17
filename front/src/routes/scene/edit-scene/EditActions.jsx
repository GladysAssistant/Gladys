import { Text } from 'preact-i18n';
import cx from 'classnames';

import RunningStopButton from '../RunningStopButton';
import style from './style.css';

const EditActions = props => (
  <div class="fixed-bottom footer">
    <div class="container">
      {props.askDeleteScene ? (
        <div class="row align-items-center justify-content-end">
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
        <div class="row align-items-center">
          <div class="col-auto">
            <button onClick={props.duplicateScene} className="btn btn-outline-primary">
              <span class="d-none d-lg-inline-block">
                <Text id="editScene.duplicateButton" />
              </span>{' '}
              <i class="fe fe-copy" />
            </button>
            <button onClick={props.askDeleteCurrentScene} className="btn btn-outline-danger ml-2">
              <span class="d-none d-lg-inline-block">
                <Text id="editScene.deleteButton" />
              </span>{' '}
              <i class="fe fe-trash" />
            </button>
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
              <button onClick={props.startScene} className="btn btn-primary">
                <Text id="editScene.startButton" /> <i class="fe fe-play" />
              </button>
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
