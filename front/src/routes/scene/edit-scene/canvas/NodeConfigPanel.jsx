import { useCallback } from 'preact/hooks';
import { ACTIONS, EVENTS } from '../../../../../../server/utils/constants';
import { NODE_TYPES, getActionLabel, getActionIcon, getTriggerLabel, getTriggerIcon, isConditionAction } from './sceneToGraph';
import style from './canvasStyle.css';

// ── Action parameter components ──────────────────────────────────────
import ChooseActionTypeParams from '../actions/ChooseActionTypeCard';
import DelayActionParams from '../actions/DelayActionParams';
import DeviceGetValueParams from '../actions/DeviceGetValueParams';
import DeviceSetValue from '../actions/DeviceSetValue';
import SendMessageParams from '../actions/SendMessageParams';
import OnlyContinueIfParams from '../actions/only-continue-if/OnlyContinueIfParams';
import TurnOnOffLightParams from '../actions/TurnOnOffLightParams';
import BlinkLightParams from '../actions/BlinkLightParams';
import TurnOnOffSwitchParams from '../actions/TurnOnOffSwitchParams';
import StartSceneParams from '../actions/StartSceneParams';
import UserPresence from '../actions/UserPresence';
import HttpRequest from '../actions/HttpRequest';
import CheckUserPresence from '../actions/CheckUserPresence';
import CheckTime from '../actions/CheckTime';
import HouseEmptyOrNotCondition from '../actions/HouseEmptyOrNotCondition';
import CalendarIsEventRunning from '../actions/CalendarIsEventRunning';
import EcowattCondition from '../actions/EcowattCondition';
import SendMessageCameraParams from '../actions/SendMessageCameraParams';
import CheckAlarmMode from '../actions/CheckAlarmMode';
import SetAlarmMode from '../actions/SetAlarmMode';
import SendMqttMessage from '../actions/SendMqttMessage';
import SendZigbee2MqttMessage from '../actions/SendZigbee2MqttMessage';
import PlayNotification from '../actions/PlayNotification';
import EdfTempoCondition from '../actions/EdfTempoCondition';
import AskAI from '../actions/AskAI';
import SendSms from '../actions/SendSms';
import CanvasConditionIfThenElse from './CanvasConditionIfThenElse';

// ── Trigger parameter components ─────────────────────────────────────
import DeviceFeatureState from '../triggers/DeviceFeatureState';
import ScheduledTrigger from '../triggers/ScheduledTrigger';
import ChooseTriggerType from '../triggers/ChooseTriggerTypeCard';
import SunriseSunsetTrigger from '../triggers/SunriseSunsetTrigger';
import UserPresenceTrigger from '../triggers/UserPresenceTrigger';
import HouseEmptyOrNot from '../triggers/HouseEmptyOrNot';
import UserEnteredOrLeftArea from '../triggers/UserEnteredOrLeftArea';
import CalendarEventIsComing from '../triggers/CalendarEventIsComing';
import AlarmModeTrigger from '../triggers/AlarmModeTrigger';
import MQTTReceivedTrigger from '../triggers/MQTTReceivedTrigger';
import GladysStartTrigger from '../triggers/GladysStartTrigger';

const ACTION_COMPONENTS = {
  [null]: ChooseActionTypeParams,
  [ACTIONS.TIME.DELAY]: DelayActionParams,
  [ACTIONS.LIGHT.TURN_ON]: TurnOnOffLightParams,
  [ACTIONS.LIGHT.TURN_OFF]: TurnOnOffLightParams,
  [ACTIONS.LIGHT.TOGGLE]: TurnOnOffLightParams,
  [ACTIONS.LIGHT.BLINK]: BlinkLightParams,
  [ACTIONS.SWITCH.TURN_ON]: TurnOnOffSwitchParams,
  [ACTIONS.SWITCH.TURN_OFF]: TurnOnOffSwitchParams,
  [ACTIONS.SWITCH.TOGGLE]: TurnOnOffSwitchParams,
  [ACTIONS.MESSAGE.SEND]: SendMessageParams,
  [ACTIONS.MESSAGE.SEND_CAMERA]: SendMessageCameraParams,
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: OnlyContinueIfParams,
  [ACTIONS.DEVICE.GET_VALUE]: DeviceGetValueParams,
  [ACTIONS.USER.SET_SEEN_AT_HOME]: UserPresence,
  [ACTIONS.USER.CHECK_PRESENCE]: CheckUserPresence,
  [ACTIONS.USER.SET_OUT_OF_HOME]: UserPresence,
  [ACTIONS.HTTP.REQUEST]: HttpRequest,
  [ACTIONS.CONDITION.CHECK_TIME]: CheckTime,
  [ACTIONS.SCENE.START]: StartSceneParams,
  [ACTIONS.HOUSE.IS_EMPTY]: HouseEmptyOrNotCondition,
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: HouseEmptyOrNotCondition,
  [ACTIONS.DEVICE.SET_VALUE]: DeviceSetValue,
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: CalendarIsEventRunning,
  [ACTIONS.ECOWATT.CONDITION]: EcowattCondition,
  [ACTIONS.EDF_TEMPO.CONDITION]: EdfTempoCondition,
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: CheckAlarmMode,
  [ACTIONS.ALARM.SET_ALARM_MODE]: SetAlarmMode,
  [ACTIONS.MQTT.SEND]: SendMqttMessage,
  [ACTIONS.ZIGBEE2MQTT.SEND]: SendZigbee2MqttMessage,
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: PlayNotification,
  [ACTIONS.AI.ASK]: AskAI,
  [ACTIONS.SMS.SEND]: SendSms,
  [ACTIONS.CONDITION.IF_THEN_ELSE]: CanvasConditionIfThenElse,
};

const ALARM_TRIGGERS = [
  EVENTS.ALARM.ARM,
  EVENTS.ALARM.ARMING,
  EVENTS.ALARM.DISARM,
  EVENTS.ALARM.PARTIAL_ARM,
  EVENTS.ALARM.PANIC,
  EVENTS.ALARM.TOO_MANY_CODES_TESTS,
];

const PANEL_HEADER_COLOR = {
  [NODE_TYPES.TRIGGER]: '#10b981',
  [NODE_TYPES.ACTION]: '#3b82f6',
  [NODE_TYPES.CONDITION]: '#f59e0b',
};

/**
 * Descend récursivement dans un objet action imbriqué pour appliquer (property, value)
 * au niveau désigné par pathParts.
 *
 * Exemples d'appel :
 *  setNestedValue(action, ['if', '0'], 'house', 'my-house-selector')
 *    → action.if[0].house = 'my-house-selector'
 *  setNestedValue(action, [], 'text', 'hello')
 *    → action.text = 'hello'  (mise à jour directe, pas de descente)
 *
 * Retourne toujours un nouvel objet (immutabilité React).
 */
const setNestedValue = (obj, pathParts, property, value) => {
  if (pathParts.length === 0) {
    return { ...obj, [property]: value };
  }
  const [head, ...rest] = pathParts;
  const idx = parseInt(head, 10);
  if (!isNaN(idx)) {
    // Should not appear at the very first segment, but handle gracefully
    const arr = [...(obj || [])];
    arr[idx] = setNestedValue(arr[idx] || {}, rest, property, value);
    return arr;
  }
  if (rest.length === 0) {
    return { ...obj, [head]: { ...(obj[head] || {}), [property]: value } };
  }
  const nextIdx = parseInt(rest[0], 10);
  if (!isNaN(nextIdx)) {
    const arr = [...(obj[head] || [])];
    arr[nextIdx] = setNestedValue(arr[nextIdx] || {}, rest.slice(1), property, value);
    return { ...obj, [head]: arr };
  }
  return { ...obj, [head]: setNestedValue(obj[head] || {}, rest, property, value) };
};

const NodeConfigPanel = ({
  selectedNode,
  setNodes,
  scene,
  variables,
  triggersVariables,
  setVariables,
  setVariablesTrigger,
  onDelete,
  onClose,
}) => {
  const isTrigger = selectedNode.type === NODE_TYPES.TRIGGER;
  const headerColor = PANEL_HEADER_COLOR[selectedNode.type] || '#64748b';
  // Chemin de l'action dans la structure JSON de la scène (ex : "1.2" = groupe 1, action 2).
  // Renseigné par sceneToGraph dans node.data.path ; fallback "0.0" pour les nœuds créés
  // manuellement (drag-and-drop) avant leur première reconversion via graphToScene.
  const nodePath = selectedNode.data.path || '0.0';

  // Met à jour une propriété de l'action du nœud sélectionné, en gérant les chemins
  // imbriqués (ex : "1.2.if.0" pour une condition à l'intérieur d'un IF_THEN_ELSE).
  //
  // callPath commence par nodePath (ex "1.2") ; si callPath est plus long, la partie
  // restante après le préfixe est le chemin de descente dans l'objet action.
  // Exemple : callPath="1.2.if.0", nodePath="1.2" → subPath="if.0"
  //           → setNestedValue(action, ['if','0'], property, value)
  //
  // Utilise le form fonctionnel de setNodes pour que chaque appel consécutif dans
  // le même événement voit l'état résultant du précédent (pas de stale closure).
  const updateActionProperty = useCallback(
    (callPath, property, value) => {
      setNodes(nds =>
        nds.map(n => {
          if (n.id !== selectedNode.id) return n;
          let newAction;
          const prefix = nodePath + '.';
          if (callPath.startsWith(prefix)) {
            // Mise à jour imbriquée : on descend dans l'objet action
            const subPath = callPath.slice(prefix.length);
            newAction = setNestedValue(n.data.action, subPath.split('.'), property, value);
          } else {
            // Mise à jour directe au niveau racine de l'action
            newAction = { ...n.data.action, [property]: value };
          }
          // Recalcule le type du nœud au cas où l'action change de catégorie
          const newNodeType = isConditionAction(newAction) ? NODE_TYPES.CONDITION : NODE_TYPES.ACTION;
          return {
            ...n,
            type: newNodeType,
            data: {
              ...n.data,
              action: newAction,
              label: getActionLabel(newAction),
              icon: getActionIcon(newAction),
            },
          };
        })
      );
    },
    [selectedNode.id, nodePath, setNodes]
  );

  // Met à jour une propriété du déclencheur du nœud sélectionné et recalcule
  // son libellé et son icône. index est l'indice du déclencheur dans scene.triggers.
  const updateTriggerProperty = useCallback(
    (index, property, value) => {
      setNodes(nds =>
        nds.map(n => {
          if (n.id !== selectedNode.id) return n;
          const newTrigger = { ...n.data.trigger, [property]: value };
          return {
            ...n,
            data: {
              ...n.data,
              trigger: newTrigger,
              label: getTriggerLabel(newTrigger),
              icon: getTriggerIcon(newTrigger),
            },
          };
        })
      );
    },
    [selectedNode.id, setNodes]
  );

  // Wrappers défensifs : certains composants appelants testent toujours setVariables
  // avant de l'utiliser, mais d'autres (CalendarIsEventRunning) l'appellent sans garde.
  // On les rend optionnels ici plutôt que de modifier tous les composants existants.
  const handleSetVariables = useCallback(
    (path, vars) => { if (setVariables) setVariables(path, vars); },
    [setVariables]
  );

  // Même protection pour setVariablesTrigger (déclencheurs).
  const handleSetVariablesTrigger = useCallback(
    (idx, vars) => { if (setVariablesTrigger) setVariablesTrigger(idx, vars); },
    [setVariablesTrigger]
  );

  // Monte le composant de configuration correspondant au type d'action.
  // Les props no-op (deleteAction, moveCard…) satisfont les propTypes des composants
  // existants sans déclencher de comportement — dans le canvas, la gestion des actions
  // passe exclusivement par les nœuds React Flow.
  const renderActionConfig = () => {
    const { action } = selectedNode.data;
    const ActionComponent = ACTION_COMPONENTS[action.type];
    if (!ActionComponent) return null;

    return (
      <ActionComponent
        key={selectedNode.id}
        action={action}
        allActions={scene ? scene.actions : []}
        path={nodePath}
        updateActionProperty={updateActionProperty}
        variables={variables || {}}
        setVariables={handleSetVariables}
        actionsGroupsBefore={[]}
        triggersVariables={triggersVariables || []}
        deleteAction={() => {}}
        deleteActionGroup={() => {}}
        addAction={() => {}}
        moveCard={() => {}}
        moveCardGroup={() => {}}
        scene={scene}
        sceneParamsData={[]}
      />
    );
  };

  // Monte le composant de configuration correspondant au type de déclencheur.
  // Utilise commonProps pour ne pas répéter les props partagés entre tous les composants.
  const renderTriggerConfig = () => {
    const { trigger } = selectedNode.data;
    const idx = selectedNode.data.triggerIndex || 0;
    const commonProps = {
      key: selectedNode.id,
      trigger,
      index: idx,
      updateTriggerProperty,
      variables: variables || {},
      setVariablesTrigger: handleSetVariablesTrigger,
    };

    if (!trigger.type) {
      return <ChooseTriggerType key={selectedNode.id} updateTriggerProperty={updateTriggerProperty} index={idx} />;
    }
    if (trigger.type === EVENTS.DEVICE.NEW_STATE) return <DeviceFeatureState {...commonProps} />;
    if (trigger.type === EVENTS.TIME.CHANGED) return <ScheduledTrigger {...commonProps} />;
    if (trigger.type === EVENTS.TIME.SUNRISE || trigger.type === EVENTS.TIME.SUNSET) {
      return <SunriseSunsetTrigger {...commonProps} />;
    }
    if (trigger.type === EVENTS.HOUSE.EMPTY || trigger.type === EVENTS.HOUSE.NO_LONGER_EMPTY) {
      return <HouseEmptyOrNot {...commonProps} />;
    }
    if (trigger.type === EVENTS.USER_PRESENCE.BACK_HOME || trigger.type === EVENTS.USER_PRESENCE.LEFT_HOME) {
      return <UserPresenceTrigger {...commonProps} />;
    }
    if (trigger.type === EVENTS.AREA.USER_ENTERED || trigger.type === EVENTS.AREA.USER_LEFT) {
      return <UserEnteredOrLeftArea {...commonProps} />;
    }
    if (trigger.type === EVENTS.CALENDAR.EVENT_IS_COMING) return <CalendarEventIsComing {...commonProps} />;
    if (ALARM_TRIGGERS.includes(trigger.type)) return <AlarmModeTrigger {...commonProps} />;
    if (trigger.type === EVENTS.SYSTEM.START) return <GladysStartTrigger {...commonProps} />;
    if (trigger.type === EVENTS.MQTT.RECEIVED) return <MQTTReceivedTrigger {...commonProps} />;
    return null;
  };

  return (
    <div class={style.configPanel}>
      <div class={style.configPanelHeader} style={{ background: headerColor }}>
        <div class={style.configPanelHeaderLeft}>
          <i class={`fe ${selectedNode.data.icon || 'fe-settings'} ${style.configPanelHeaderIcon}`} />
          <div class={style.configPanelHeaderText}>
            <span class={style.configPanelTypeLabel}>
              {isTrigger ? 'DÉCLENCHEUR' : selectedNode.type === NODE_TYPES.CONDITION ? 'CONDITION' : 'ACTION'}
            </span>
            <span class={style.configPanelTitle}>{selectedNode.data.label || '—'}</span>
          </div>
        </div>
        <button class={style.configPanelClose} onClick={onClose}>
          <i class="fe fe-x" />
        </button>
      </div>

      <div class={style.configPanelBody}>
        {isTrigger ? renderTriggerConfig() : renderActionConfig()}
      </div>

      <div class={style.configPanelFooter}>
        <button class="btn btn-sm btn-outline-danger w-100" onClick={onDelete}>
          <i class="fe fe-trash mr-1" />
          Supprimer ce bloc
        </button>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
