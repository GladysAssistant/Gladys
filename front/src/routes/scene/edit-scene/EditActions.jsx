import { Text } from 'preact-i18n';
import cx from 'classnames';

import RunningStopButton from '../RunningStopButton';
import style from './style.css';

const EditActions = props => (
  <div class="fixed-bottom footer">
    <div class="container">
      <div class="row align-items-center">
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
    </div>
  </div>
);

export default EditActions;
