import { useState, useEffect } from 'preact/hooks';
import { ACTIONS, CONDITION_ACTIONS } from '../../../../../../server/utils/constants';

import CheckTime from '../actions/CheckTime';
import OnlyContinueIfParams from '../actions/only-continue-if/OnlyContinueIfParams';
import EdfTempoCondition from '../actions/EdfTempoCondition';
import CheckAlarmMode from '../actions/CheckAlarmMode';
import CalendarIsEventRunning from '../actions/CalendarIsEventRunning';
import EcowattCondition from '../actions/EcowattCondition';
import HouseEmptyOrNotCondition from '../actions/HouseEmptyOrNotCondition';

const CONDITION_LABELS = {
  [ACTIONS.CONDITION.CHECK_TIME]: "Vérifier l'heure",
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'Continuer si (variable)',
  [ACTIONS.EDF_TEMPO.CONDITION]: 'Condition EDF Tempo',
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: 'Vérifier mode alarme',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'Événement en cours',
  [ACTIONS.ECOWATT.CONDITION]: 'Condition Ecowatt',
  [ACTIONS.HOUSE.IS_EMPTY]: 'Maison vide',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'Maison occupée',
};

const CONDITION_ICONS = {
  [ACTIONS.CONDITION.CHECK_TIME]: 'fe-watch',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'fe-filter',
  [ACTIONS.EDF_TEMPO.CONDITION]: 'fe-zap',
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: 'fe-bell',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'fe-calendar',
  [ACTIONS.ECOWATT.CONDITION]: 'fe-zap',
  [ACTIONS.HOUSE.IS_EMPTY]: 'fe-home',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'fe-home',
};

const CONDITION_COMPONENTS = {
  [ACTIONS.CONDITION.CHECK_TIME]: CheckTime,
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: OnlyContinueIfParams,
  [ACTIONS.EDF_TEMPO.CONDITION]: EdfTempoCondition,
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: CheckAlarmMode,
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: CalendarIsEventRunning,
  [ACTIONS.ECOWATT.CONDITION]: EcowattCondition,
  [ACTIONS.HOUSE.IS_EMPTY]: HouseEmptyOrNotCondition,
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: HouseEmptyOrNotCondition,
};

const CanvasConditionIfThenElse = ({
  action,
  path,
  updateActionProperty,
  variables,
  triggersVariables,
  actionsGroupsBefore,
  allActions,
}) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const conditions = action.if || [];

  useEffect(() => {
    if (!action.if) {
      updateActionProperty(path, 'if', []);
    }
  }, []);

  // Ajoute une nouvelle condition vide (type non encore choisi) à la liste.
  const addCondition = () => {
    updateActionProperty(path, 'if', [...conditions, { type: null }]);
  };

  // Supprime la condition à l'index donné et corrige l'index d'expansion :
  // - si c'était la condition expandée → on ferme
  // - si une condition avant elle était expandée → on décale l'index de -1
  const deleteCondition = index => {
    const next = conditions.filter((_, i) => i !== index);
    updateActionProperty(path, 'if', next);
    setExpandedIndex(prev => {
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  // Remplace le type d'une condition (sélection dans le <select>) en réinitialisant
  // tous ses autres champs pour repartir d'un état vierge cohérent avec le nouveau type.
  const setConditionType = (index, type) => {
    const next = conditions.map((c, i) => (i === index ? { type } : c));
    updateActionProperty(path, 'if', next);
  };

  // Délègue directement au updateActionProperty parent en passant le chemin imbriqué,
  // afin que setNestedValue dans NodeConfigPanel applique la mise à jour sur l'état
  // courant du nœud. Cela évite un bug de closure périmée (stale closure) lorsqu'un
  // sous-composant appelle updateActionProperty plusieurs fois dans le même événement
  // (ex : HouseEmptyOrNotCondition appelle updateActionProperty d'abord pour `house`
  // puis pour `house_label`) : grâce au updater fonctionnel de setNodes, chaque appel
  // voit l'état résultant du précédent plutôt qu'un snapshot initial figé.
  const makeConditionUpdater = index => (_subPath, property, value) => {
    updateActionProperty(`${path}.if.${index}`, property, value);
  };

  return (
    <div>
      <div
        class="d-flex align-items-center justify-content-between mb-2"
        style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}
      >
        <span>Conditions ({conditions.length})</span>
      </div>

      {conditions.length === 0 && (
        <p class="text-muted text-center" style={{ fontSize: '12px', margin: '8px 0 12px' }}>
          Aucune condition ajoutée.
        </p>
      )}

      {conditions.map((condition, index) => {
        const CondComponent = CONDITION_COMPONENTS[condition.type];
        const isExpanded = expandedIndex === index;

        return (
          // Pas de overflow:hidden : évite le clipping des time pickers et des menus
          // déroulants (React Select) qui se positionnent en dehors du flux normal.
          <div
            key={index}
            class="mb-2"
            style={{ border: '1px solid #fcd34d', borderRadius: '6px' }}
          >
            {/* ── Condition header ─────────────────────────────── */}
            {/* borderRadius uniquement sur les coins supérieurs : le parent n'ayant
                plus overflow:hidden, le body qui suit arrondit lui-même ses coins. */}
            <div
              class="d-flex align-items-center justify-content-between"
              style={{ padding: '6px 10px', background: '#fef3c7', cursor: 'pointer', borderRadius: '5px 5px 0 0' }}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <div
                class="d-flex align-items-center"
                style={{ gap: '6px', overflow: 'hidden', flex: 1 }}
              >
                <i
                  class={`fe ${CONDITION_ICONS[condition.type] || 'fe-circle'}`}
                  style={{ color: '#92400e', fontSize: '13px', flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#92400e',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {CONDITION_LABELS[condition.type] || 'Type à choisir…'}
                </span>
              </div>
              <div class="d-flex align-items-center" style={{ gap: '6px', flexShrink: 0 }}>
                <i
                  class={`fe ${isExpanded ? 'fe-chevron-up' : 'fe-chevron-down'}`}
                  style={{ fontSize: '12px', color: '#92400e' }}
                />
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 2px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    lineHeight: 1,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    deleteCondition(index);
                  }}
                  title="Supprimer cette condition"
                >
                  <i class="fe fe-trash" style={{ fontSize: '12px' }} />
                </button>
              </div>
            </div>

            {/* ── Condition config body ────────────────────────── */}
            {isExpanded && (
              <div style={{ padding: '10px', background: '#fff' }}>
                {/* Type selector when not yet chosen */}
                {!condition.type && (
                  <div class="form-group mb-0">
                    <label class="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Type de condition
                    </label>
                    <select
                      class="form-control form-control-sm"
                      value=""
                      onChange={e => setConditionType(index, e.target.value)}
                    >
                      <option value="">-- Choisir --</option>
                      {CONDITION_ACTIONS.map(ct => (
                        <option key={ct} value={ct}>
                          {CONDITION_LABELS[ct] || ct}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Composant dédié à la condition sélectionnée */}
                {/* setVariables est requis par CalendarIsEventRunning.componentDidMount →
                    initVariables() → removeVariables() → this.props.setVariables().
                    Sans ce prop (undefined), un TypeError casse silencieusement le composant
                    et rend la croix de suppression de la condition inopérante. */}
                {CondComponent && (
                  <CondComponent
                    action={condition}
                    path={`${path}.if.${index}`}
                    updateActionProperty={makeConditionUpdater(index)}
                    variables={variables || {}}
                    triggersVariables={triggersVariables || []}
                    actionsGroupsBefore={actionsGroupsBefore || []}
                    allActions={allActions || []}
                    setVariables={() => {}}
                    deleteAction={() => {}}
                    deleteActionGroup={() => {}}
                    addAction={() => {}}
                    moveCard={() => {}}
                    moveCardGroup={() => {}}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      <button class="btn btn-sm btn-outline-warning w-100 mt-1" onClick={addCondition}>
        <i class="fe fe-plus mr-1" />
        Ajouter une condition
      </button>
    </div>
  );
};

export default CanvasConditionIfThenElse;
