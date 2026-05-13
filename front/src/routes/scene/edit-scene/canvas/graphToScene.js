/**
 * graphToScene.js — conversion inverse : graphe React Flow → scène Gladys.
 *
 * Algorithme en cinq étapes :
 *  1. Identifier les nœuds de branche (cibles d'arêtes 'then'/'else' issues de
 *     nœuds condition), puis étendre transitivement pour inclure leurs successeurs.
 *  2. Séparer les nœuds du flux principal (ni déclencheurs, ni branche).
 *  3. Attribuer un niveau de profondeur à chaque nœud via un parcours DFS
 *     "chemin le plus long" depuis les déclencheurs (gère les convergences).
 *  4. Pour chaque nœud IF_THEN_ELSE, reconstruire action.then et action.else
 *     depuis les connexions du graphe (BFS par distance depuis step-0).
 *  5. Regrouper les nœuds du flux principal par niveau (actions parallèles),
 *     trier par position X pour retrouver l'ordre gauche→droite.
 */
import { NODE_TYPES, isIfThenElse } from './sceneToGraph';

// Champs stockés dans le nœud pour l'affichage canvas mais absents du schéma serveur.
const CANVAS_ONLY_FIELDS = ['device_feature_type', 'device_feature_category'];

function cleanAction(action) {
  if (!action) return action;
  const a = { ...action };
  CANVAS_ONLY_FIELDS.forEach(f => delete a[f]);
  return a;
}

// originalScene est utilisé comme base pour préserver les champs non-graph de la scène
// (name, icon, selector, triggers…) — seuls triggers et actions sont reconstruits.
export function graphToScene(nodes, edges, originalScene) {
  const triggerNodes = nodes
    .filter(n => n.type === NODE_TYPES.TRIGGER)
    .sort((a, b) => a.position.x - b.position.x);

  // Tables d'adjacence construites depuis les arêtes.
  // outgoing conserve le sourceHandle pour distinguer then/else/after des arêtes normales.
  const outgoing = {}; // nodeId -> [{ target, sourceHandle }]
  const incoming = {}; // nodeId -> [sourceId]
  nodes.forEach(n => {
    outgoing[n.id] = [];
    incoming[n.id] = [];
  });
  edges.forEach(edge => {
    if (outgoing[edge.source]) {
      outgoing[edge.source].push({ target: edge.target, sourceHandle: edge.sourceHandle || null });
    }
    if (incoming[edge.target]) {
      incoming[edge.target].push(edge.source);
    }
  });

  // Identification des nœuds de branche : cibles directes des arêtes 'then'/'else'
  // issues des nœuds condition IF_THEN_ELSE.
  const thenTargets = {}; // conditionNodeId -> [targetId, ...]  (étape 0 de la branche "Oui")
  const elseTargets = {}; // conditionNodeId -> [targetId, ...]  (étape 0 de la branche "Non")
  const branchNodeIds = new Set();

  nodes.filter(n => n.type === NODE_TYPES.CONDITION).forEach(condNode => {
    thenTargets[condNode.id] = [];
    elseTargets[condNode.id] = [];
    (outgoing[condNode.id] || []).forEach(({ target, sourceHandle }) => {
      if (sourceHandle === 'then') {
        thenTargets[condNode.id].push(target);
        branchNodeIds.add(target);
      } else if (sourceHandle === 'else') {
        elseTargets[condNode.id].push(target);
        branchNodeIds.add(target);
      }
    });
  });

  // Extension transitive : les successeurs (step 1, step 2…) d'un nœud de branche
  // sont aussi des nœuds de branche. On suit uniquement les arêtes sans sourceHandle
  // (arêtes séquentielles normales, pas les sorties then/else).
  {
    let frontier = [...branchNodeIds];
    const visited = new Set(branchNodeIds);
    while (frontier.length > 0) {
      const next = [];
      frontier.forEach(nodeId => {
        (outgoing[nodeId] || []).forEach(({ target, sourceHandle }) => {
          if (!visited.has(target) && sourceHandle === null) {
            next.push(target);
            visited.add(target);
            branchNodeIds.add(target);
          }
        });
      });
      frontier = next;
    }
  }

  // Nœuds du flux principal : tout sauf les déclencheurs et les nœuds de branche.
  const mainActionNodes = nodes.filter(
    n => n.type !== NODE_TYPES.TRIGGER && !branchNodeIds.has(n.id)
  );

  // Attribution des niveaux par DFS "chemin le plus long" depuis les déclencheurs.
  // On utilise le chemin le plus long (et non le plus court) pour que deux chemins
  // qui convergent vers un même nœud placent ce nœud après les deux branches.
  const levels = {};

  // DFS récursif : propage le niveau maximal depuis nodeId vers ses successeurs du flux principal.
  function propagate(nodeId, depth) {
    // Met à jour seulement si on trouve un chemin plus long — garantit la convergence.
    if (levels[nodeId] === undefined || levels[nodeId] < depth) {
      levels[nodeId] = depth;
      (outgoing[nodeId] || []).forEach(({ target, sourceHandle }) => {
        if (
          !triggerNodes.find(t => t.id === target) &&
          !branchNodeIds.has(target) &&
          // Ne pas traverser les sorties then/else (ce sont des branches, pas le flux principal)
          sourceHandle !== 'then' &&
          sourceHandle !== 'else'
        ) {
          propagate(target, depth + 1);
        }
      });
    }
  }

  triggerNodes.forEach(t => {
    (outgoing[t.id] || []).forEach(({ target }) => {
      if (!triggerNodes.find(tn => tn.id === target) && !branchNodeIds.has(target)) {
        propagate(target, 0);
      }
    });
  });

  // Les nœuds du flux principal non connectés (aucun chemin depuis un déclencheur)
  // sont ordonnés par leur topologie interne (connexions entre eux uniquement) :
  //  - sans fil entre eux → même niveau → actions parallèles
  //  - A → B (fil entre orphelins) → niveaux distincts → actions séquentielles
  const maxExistingLevel =
    Object.values(levels).length > 0 ? Math.max(...Object.values(levels)) : -1;
  {
    const orphanSet = new Set(
      mainActionNodes.filter(n => levels[n.id] === undefined).map(n => n.id)
    );
    if (orphanSet.size > 0) {
      const orphanLevels = {};
      // DFS longest-path dans le sous-graphe des orphelins.
      const orphanPropagate = (nodeId, depth) => {
        if (orphanLevels[nodeId] === undefined || orphanLevels[nodeId] < depth) {
          orphanLevels[nodeId] = depth;
          (outgoing[nodeId] || []).forEach(({ target, sourceHandle }) => {
            if (orphanSet.has(target) && sourceHandle !== 'then' && sourceHandle !== 'else') {
              orphanPropagate(target, depth + 1);
            }
          });
        }
      };
      // Sources : orphelins sans parent orphelin → départ à la profondeur 0.
      orphanSet.forEach(id => {
        const hasOrphanParent = (incoming[id] || []).some(src => orphanSet.has(src));
        if (!hasOrphanParent) orphanPropagate(id, 0);
      });
      const base = maxExistingLevel + 1;
      orphanSet.forEach(id => { levels[id] = base + (orphanLevels[id] || 0); });
    }
  }

  // Reconstruit le tableau de groupes d'actions d'une branche (then ou else) à partir
  // des IDs des nœuds de l'étape 0 (cibles directes du handle then/else).
  // Utilise un BFS par distance pour ordonner les étapes ; à distance égale,
  // les nœuds sont triés par position X (gauche → droite = ordre dans le groupe).
  // Retourne [[actions step 0], [actions step 1], ...].
  const buildBranchGroup = step0Ids => {
    if (!step0Ids || step0Ids.length === 0) return [[]];
    const stepOf = {};
    step0Ids.forEach(id => { stepOf[id] = 0; });
    let current = [...step0Ids];
    while (current.length > 0) {
      const next = [];
      current.forEach(nodeId => {
        const s = stepOf[nodeId];
        (outgoing[nodeId] || []).forEach(({ target, sourceHandle }) => {
          if (stepOf[target] === undefined && sourceHandle === null) {
            stepOf[target] = s + 1;
            next.push(target);
          }
        });
      });
      current = next;
    }
    const maxStep = Math.max(...Object.values(stepOf));
    const result = [];
    for (let step = 0; step <= maxStep; step++) {
      const stepNodes = Object.keys(stepOf)
        .filter(id => stepOf[id] === step)
        .map(id => nodes.find(n => n.id === id))
        .filter(Boolean)
        .sort((a, b) => a.position.x - b.position.x);
      result.push(stepNodes.map(n => {
        const action = cleanAction({ ...n.data.action });
        // Un IF_THEN_ELSE imbriqué dans une branche doit reconstruire ses propres branches.
        if (n.type === NODE_TYPES.CONDITION && isIfThenElse(n.data.action)) {
          action.then = buildBranchGroup(thenTargets[n.id] || []);
          action.else = buildBranchGroup(elseTargets[n.id] || []);
        }
        return action;
      }));
    }
    return result;
  };

  // Construction des groupes d'actions triés par niveau puis par position X.
  // Chaque niveau correspond à un groupe d'actions parallèles dans la scène Gladys.
  const maxLevel =
    mainActionNodes.length > 0
      ? Math.max(...mainActionNodes.map(n => levels[n.id] || 0))
      : -1;

  const actionGroups = [];
  for (let level = 0; level <= maxLevel; level++) {
    const nodesAtLevel = mainActionNodes
      .filter(n => (levels[n.id] || 0) === level)
      .sort((a, b) => a.position.x - b.position.x);

    if (nodesAtLevel.length > 0) {
      const actions = nodesAtLevel.map(n => {
        const action = cleanAction({ ...n.data.action });
        // Seul IF_THEN_ELSE possède des branches then/else dans le graphe.
        if (n.type === NODE_TYPES.CONDITION && isIfThenElse(n.data.action)) {
          action.then = buildBranchGroup(thenTargets[n.id] || []);
          action.else = buildBranchGroup(elseTargets[n.id] || []);
        }
        return action;
      });
      actionGroups.push(actions);
    }
  }

  return {
    ...originalScene,
    triggers: triggerNodes.map(n => n.data.trigger),
    actions: actionGroups,
  };
}
