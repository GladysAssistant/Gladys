import { h } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';
import TriggerCard from './TriggerCard';
import style from './style.css';

const TriggerGroup = ({ children, ...props }) => (
  <div class="col">
    <div class="card">
      <div class="card-status bg-green" />
      <div class="card-header">
        <h4 class="text-center card-title ">
          <Text id="editScene.triggersTitle" />
        </h4>
        <div class="card-options">
          <Localizer>
            <button
              class="btn btn-outline-primary"
              onClick={props.addTrigger}
              aria-label={<Text id="editScene.addNewTriggerButton" />}
            >
              <span class="d-none d-sm-inline-block" aria-hidden="true">
                <Text id="editScene.addNewTriggerButton" />
              </span>{' '}
              <i class="fe fe-plus" />
            </button>
          </Localizer>
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
              <div class="text-center">
                <Text id="editScene.noTriggersYet" />
              </div>
            )}
            {props.triggers &&
              props.triggers.map((trigger, index) => (
                <div>
                  {index > 0 && (
                    <div class={style.orSeparator}>
                      <span class={style.orSeparatorLabel}>
                        <Text id="editScene.orSeparator" />
                      </span>
                    </div>
                  )}
                  <TriggerCard
                    trigger={trigger}
                    deleteTrigger={props.deleteTrigger}
                    index={index}
                    updateTriggerProperty={props.updateTriggerProperty}
                    variables={props.variables}
                    setVariablesTrigger={props.setVariablesTrigger}
                  />
                </div>
              ))}
            {props.triggers && props.triggers.length > 1 && (
              <div class={style.triggersHint}>
                <i class="fe fe-info" /> <Text id="editScene.triggersIndependentHint" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TriggerGroup;
