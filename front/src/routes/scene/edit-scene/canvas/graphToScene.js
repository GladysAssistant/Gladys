import { NODE_TYPES, isIfThenElse } from './sceneToGraph';

/**
 * Converts a React Flow graph (nodes + edges) back to the Gladys scene format.
 *
 * Algorithm:
 * 1. Identify branch nodes: targets of 'then'/'else' sourceHandle edges from condition nodes
 * 2. Build the main flow using only non-branch nodes
 * 3. Assign depth levels via longest-path DFS from trigger nodes
 * 4. Rebuild condition.then / condition.else from graph connections
 * 5. Group main nodes by level (parallel groups), sort by X position
 */
export function graphToScene(nodes, edges, originalScene) {
  const triggerNodes = nodes
    .filter(n => n.type === NODE_TYPES.TRIGGER)
    .sort((a, b) => a.position.x - b.position.x);

  // Build adjacency maps preserving sourceHandle
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

  // Identify branch node IDs: targets of 'then' / 'else' edges from condition nodes
  const thenTargets = {}; // conditionNodeId -> [targetId, ...]
  const elseTargets = {}; // conditionNodeId -> [targetId, ...]
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

  // Expand branchNodeIds to include all transitive (multi-step) branch nodes
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

  // Main flow nodes: exclude triggers and branch nodes
  const mainActionNodes = nodes.filter(
    n => n.type !== NODE_TYPES.TRIGGER && !branchNodeIds.has(n.id)
  );

  // Assign depth levels via longest-path DFS from trigger outputs (main flow only)
  const levels = {};

  function propagate(nodeId, depth) {
    if (levels[nodeId] === undefined || levels[nodeId] < depth) {
      levels[nodeId] = depth;
      (outgoing[nodeId] || []).forEach(({ target, sourceHandle }) => {
        if (
          !triggerNodes.find(t => t.id === target) &&
          !branchNodeIds.has(target) &&
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

  // Disconnected main action nodes go at the end
  const maxExistingLevel =
    Object.values(levels).length > 0 ? Math.max(...Object.values(levels)) : -1;
  mainActionNodes.forEach((n, idx) => {
    if (levels[n.id] === undefined) {
      levels[n.id] = maxExistingLevel + 1 + idx;
    }
  });

  // Build branch action array [[step0actions], [step1actions], ...] from step-0 node IDs.
  // Uses BFS distance to determine step order, X position to sort within a step.
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
      result.push(stepNodes.map(n => n.data.action));
    }
    return result;
  };

  // Build action groups sorted by level, then by X position within each level
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
        const action = { ...n.data.action };
        // Only IF_THEN_ELSE has then/else branches in the graph
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
