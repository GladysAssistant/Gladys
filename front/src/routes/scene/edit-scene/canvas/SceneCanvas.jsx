import { useState, useCallback, useMemo, useEffect, useRef } from 'preact/hooks';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Text } from 'preact-i18n';
import { v4 as uuidv4 } from 'uuid';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import {
  sceneToGraph,
  NODE_TYPES,
  getActionLabel,
  getActionIcon,
  getTriggerLabel,
  getTriggerIcon,
  isConditionAction,
  isIfThenElse,
} from './sceneToGraph';
import { graphToScene } from './graphToScene';
import NodeSelector from './NodeSelector';
import NodeConfigPanel from './NodeConfigPanel';
import style from './canvasStyle.css';

const nodeTypes = {
  [NODE_TYPES.TRIGGER]: TriggerNode,
  [NODE_TYPES.ACTION]: ActionNode,
  [NODE_TYPES.CONDITION]: ConditionNode,
};

const NODE_COLORS = {
  [NODE_TYPES.TRIGGER]: '#10b981',
  [NODE_TYPES.ACTION]: '#3b82f6',
  [NODE_TYPES.CONDITION]: '#f59e0b',
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  style: { stroke: '#94a3b8', strokeWidth: 2 },
};

function loadSavedPositions(key) {
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

const SceneCanvas = ({
  scene,
  saveScene,
  saving,
  variables,
  triggersVariables,
  setVariables,
  setVariablesTrigger,
}) => {
  // Stable key per scene — used to persist node positions in localStorage
  const positionsKey = scene.selector ? `gladys-canvas-pos-${scene.selector}` : null;

  const initialGraph = useMemo(() => {
    const graph = sceneToGraph(scene);
    const saved = loadSavedPositions(positionsKey);
    if (Object.keys(saved).length > 0) {
      graph.nodes = graph.nodes.map(n =>
        saved[n.id] ? { ...n, position: saved[n.id] } : n
      );
    }
    return graph;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Custom drag state
  const [draggingNode, setDraggingNode] = useState(null); // {nodeType, triggerType, actionType, label, icon}
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // ── Copy / paste (Ctrl+C / Ctrl+V) + save (Ctrl+S) ──────────────────
  const clipboardRef = useRef(null);
  // Keep stable refs so the keydown listener never goes stale
  const selectedNodeIdRef = useRef(selectedNodeId);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const handleApplyRef = useRef(null);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  useEffect(() => {
    const handleKeyDown = e => {
      // Don't intercept shortcuts when the user is typing in a form field
      const tag = e.target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        e.target.isContentEditable
      ) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (handleApplyRef.current) handleApplyRef.current();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const node = nodesRef.current.find(n => n.id === selectedNodeIdRef.current);
        if (node) clipboardRef.current = node;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        e.preventDefault();
        const src = clipboardRef.current;
        const id = `new-${uuidv4()}`;
        const newNode = {
          ...src,
          id,
          selected: false,
          position: { x: src.position.x + 40, y: src.position.y + 40 },
          data: JSON.parse(JSON.stringify(src.data)),
        };
        setNodes(nds => [...nds, newNode]);
        setSelectedNodeId(id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setNodes]);
  // ─────────────────────────────────────────────────────────────────────

  // ── Persist node positions to localStorage (debounced 600ms) ─────────
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!positionsKey) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const positions = {};
      nodes.forEach(n => { positions[n.id] = n.position; });
      try {
        localStorage.setItem(positionsKey, JSON.stringify(positions));
      } catch {}
    }, 600);
    return () => clearTimeout(saveTimerRef.current);
  }, [nodes, positionsKey]);
  // ─────────────────────────────────────────────────────────────────────

  const onConnect = useCallback(
    params => {
      let handleOverride = {};
      if (params.sourceHandle === 'then') {
        handleOverride = { style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } };
      } else if (params.sourceHandle === 'else') {
        handleOverride = { style: { stroke: '#ef4444', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' } };
      } else {
        // Non-branching condition node (e.g. "Continuer si") → green edge
        const sourceNode = nodes.find(n => n.id === params.source);
        if (sourceNode && sourceNode.type === NODE_TYPES.CONDITION && !isIfThenElse(sourceNode.data.action)) {
          handleOverride = { style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } };
        }
      }
      setEdges(eds => addEdge({ ...params, ...defaultEdgeOptions, ...handleOverride }, eds));
    },
    [setEdges, nodes]
  );

  const onNodeClick = useCallback((e, node) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(node.id);
      // Deselect all other nodes so multi-selection doesn't persist
      setNodes(nds => nds.map(n => (n.id === node.id ? n : { ...n, selected: false })));
    }
    setSelectorOpen(false);
  }, [setNodes]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onSelectionChange = useCallback(({ nodes: sel }) => {
    if (sel.length > 1) setSelectedNodeId(null);
    else if (sel.length === 1) setSelectedNodeId(sel[0].id);
  }, []);

  const onDeleteNode = useCallback(
    nodeId => {
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges]
  );

  const createNode = useCallback(
    ({ nodeType, actionType, triggerType }, position) => {
      const id = `new-${uuidv4()}`;
      if (nodeType === NODE_TYPES.TRIGGER) {
        const trigger = { type: triggerType };
        setNodes(nds => [
          ...nds,
          {
            id,
            type: NODE_TYPES.TRIGGER,
            position,
            data: { trigger, label: getTriggerLabel(trigger), icon: getTriggerIcon(trigger) },
          },
        ]);
      } else {
        const action = { type: actionType };
        setNodes(nds => [
          ...nds,
          {
            id,
            type: isConditionAction(action) ? NODE_TYPES.CONDITION : NODE_TYPES.ACTION,
            position,
            data: { action, label: getActionLabel(action), icon: getActionIcon(action) },
          },
        ]);
      }
    },
    [setNodes]
  );

  const onAddNode = useCallback(
    ({ type: nodeType, actionType, triggerType }) => {
      const center = reactFlowInstance
        ? reactFlowInstance.project({ x: 400, y: 200 + nodes.length * 40 })
        : { x: 400, y: 200 };
      createNode({ nodeType, actionType, triggerType }, center);
      setSelectorOpen(false);
    },
    [nodes, reactFlowInstance, createNode]
  );

  // ── Auto-layout: re-compute positions from current scene state ────────
  const handleAutoLayout = useCallback(() => {
    const currentScene = graphToScene(nodes, edges, scene);
    const freshGraph = sceneToGraph(currentScene);
    setNodes(freshGraph.nodes);
    setEdges(freshGraph.edges);
    if (positionsKey) {
      try { localStorage.removeItem(positionsKey); } catch {}
    }
  }, [nodes, edges, scene, setNodes, setEdges, positionsKey]);
  // ─────────────────────────────────────────────────────────────────────

  // ── Custom pointer drag ──────────────────────────────────────────────
  const dragStartPos = useRef(null);
  const hasMoved = useRef(false);

  const onSelectorPointerDown = useCallback((nodeData, clientX, clientY) => {
    dragStartPos.current = { x: clientX, y: clientY };
    hasMoved.current = false;
    setDraggingNode(nodeData);
    setGhostPos({ x: clientX, y: clientY });
  }, []);

  // Exposed so NodeSelector can suppress onClick when a real drag occurred
  const getDragMoved = useCallback(() => hasMoved.current, []);

  useEffect(() => {
    if (!draggingNode) return;

    const handleMove = e => {
      if (!hasMoved.current && dragStartPos.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
      }
      setGhostPos({ x: e.clientX, y: e.clientY });
    };

    const handleUp = e => {
      if (hasMoved.current && canvasRef.current && reactFlowInstance) {
        const rect = canvasRef.current.getBoundingClientRect();
        const inCanvas =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (inCanvas) {
          const position = reactFlowInstance.screenToFlowPosition({
            x: e.clientX,
            y: e.clientY,
          });
          createNode(draggingNode, position);
          setSelectorOpen(false);
        }
      }
      setDraggingNode(null);
    };

    const handleKey = e => {
      if (e.key === 'Escape') setDraggingNode(null);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('keydown', handleKey);
    };
  }, [draggingNode, reactFlowInstance, createNode]);
  // ────────────────────────────────────────────────────────────────────

  const handleApply = useCallback(() => {
    const updatedScene = graphToScene(nodesRef.current, edgesRef.current, scene);
    saveScene(updatedScene);
  }, [scene, saveScene]);

  // Keep the ref fresh so the stable keydown listener can call the latest version
  handleApplyRef.current = handleApply;

  const miniMapNodeColor = node => {
    if (node.type === NODE_TYPES.TRIGGER) return '#10b981';
    if (node.type === NODE_TYPES.CONDITION) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div class={`${style.sceneCanvasOuter} ${draggingNode ? style.isDragging : ''}`}>
      <div class={style.canvasWrapper} ref={canvasRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onSelectionChange={onSelectionChange}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Control"
        >
          <Background color="#e2e8f0" gap={24} size={1} />
          <Controls />
          <MiniMap nodeColor={miniMapNodeColor} pannable zoomable />

          <Panel position="top-left">
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                class={`btn btn-sm btn-outline-primary ${style.panelBtn}`}
                onClick={() => { setSelectorOpen(v => !v); setSelectedNodeId(null); }}
              >
                <i class="fe fe-plus mr-1" />
                <Text id="editScene.canvas.addBlock">Ajouter un bloc</Text>
              </button>
              <button
                class={`btn btn-sm btn-outline-secondary ${style.panelBtn}`}
                onClick={handleAutoLayout}
                title="Réorganiser automatiquement"
              >
                <i class="fe fe-grid mr-1" />
                <Text id="editScene.canvas.autoLayout">Réorganiser</Text>
              </button>
              <button
                class={`btn btn-sm btn-primary ${style.panelBtn}`}
                onClick={handleApply}
                disabled={saving}
                title="Appliquer le graphe (Ctrl+S)"
              >
                {saving ? <i class="fe fe-loader mr-1" /> : <i class="fe fe-check mr-1" />}
                <Text id="editScene.canvas.applyGraph">Appliquer le graphe</Text>
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectorOpen && (
        <NodeSelector
          onAddNode={onAddNode}
          onSelectorPointerDown={onSelectorPointerDown}
          getDragMoved={getDragMoved}
          onClose={() => setSelectorOpen(false)}
        />
      )}

      {selectedNode && (
        <NodeConfigPanel
          selectedNode={selectedNode}
          setNodes={setNodes}
          scene={scene}
          variables={variables}
          triggersVariables={triggersVariables}
          setVariables={setVariables}
          setVariablesTrigger={setVariablesTrigger}
          onDelete={() => onDeleteNode(selectedNode.id)}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {/* Drag ghost — follows the cursor, rendered outside any overflow container */}
      {draggingNode && (
        <div
          class={style.dragGhost}
          style={{
            transform: `translate(${ghostPos.x + 12}px, ${ghostPos.y + 12}px)`,
            borderColor: NODE_COLORS[draggingNode.nodeType] || '#3b82f6',
          }}
        >
          <i class={`fe ${draggingNode.icon}`} />
          <span>{draggingNode.label}</span>
        </div>
      )}
    </div>
  );
};

export default SceneCanvas;
