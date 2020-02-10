import { h } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import TriggerCard from './TriggerCard';

const TriggerGroup = ({ children, ...props }) => (
  <div class="col">
    <div class="card">
      <div class="card-status bg-green" />
      <div class="card-header">
        <h4 class="text-center card-title ">Triggers</h4>
        <div class="card-options">
          <button class="btn btn-outline-primary" onClick={props.addTrigger}>
            Add new trigger <i class="fe fe-plus" />
          </button>
        </div>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.saving
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.triggers && props.triggers.length === 0 && (
              <div class="text-center">No trigger added yet. It's not mandatory to have a trigger in a scene.</div>
            )}
            <div class="row">
              {props.triggers &&
                props.triggers.map((trigger, index) => (
                  <div class="col-lg-6">
                    <TriggerCard
                      trigger={trigger}
                      deleteTrigger={props.deleteTrigger}
                      index={index}
                      updateTriggerProperty={props.updateTriggerProperty}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TriggerGroup;
