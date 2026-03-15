import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEditorStore } from '../../stores/editorStore';
import StartNode from './nodes/StartNode';
import TriggerNode from './nodes/TriggerNode';
import DialogueNode from './nodes/DialogueNode';
import ChoiceNode from './nodes/ChoiceNode';
import ResultNode from './nodes/ResultNode';
import BranchNode from './nodes/BranchNode';
import FlagNode from './nodes/FlagNode';
import EndingNode from './nodes/EndingNode';
import NoteNode from './nodes/NoteNode';
import NodeSidebar from './NodeSidebar';
import { auditProjectGraph } from '../../utils/graphAudit';

const nodeTypes = {
  startNode: StartNode,
  triggerNode: TriggerNode,
  dialogueNode: DialogueNode,
  choiceNode: ChoiceNode,
  resultNode: ResultNode,
  branchNode: BranchNode,
  flagNode: FlagNode,
  endingNode: EndingNode,
  noteNode: NoteNode,
};

const NODE_PALETTE = [
  { type: 'start', label: 'Start', labelKo: '시작', icon: 'S', color: '#4aa35c' },
  { type: 'ending', label: 'Ending', labelKo: '엔딩', icon: 'E', color: '#a95656' },
  { type: 'trigger', label: 'Trigger', labelKo: '트리거', icon: 'T', color: '#4a7c4a' },
  { type: 'dialogue', label: 'Dialogue', labelKo: '대화', icon: 'D', color: '#4a6a8a' },
  { type: 'choice', label: 'Choice', labelKo: '선택지', icon: 'C', color: '#8a6a4a' },
  { type: 'result', label: 'Result', labelKo: '결과', icon: 'R', color: '#6a4a8a' },
  { type: 'branch', label: 'Branch', labelKo: '분기', icon: 'B', color: '#8a8a4a' },
  { type: 'flag', label: 'Flag', labelKo: '플래그', icon: 'F', color: '#3f8d8a' },
  { type: 'note', label: 'Note', labelKo: '노트', icon: 'N', color: '#d8b34f' },
];

export default function NodeEditor({ language }) {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onConnect,
    addNode,
    selectedNode,
    selectNode,
    clearSelection,
  } = useEditorStore();
  const t = useCallback((en, ko) => (language === 'ko' ? ko : en), [language]);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const handleConnect = useCallback(
    (connection) => {
      onConnect(connection);
    },
    [onConnect]
  );

  const handleNodeClick = useCallback(
    (_, node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const bounds = e.currentTarget.getBoundingClientRect();

      const position = {
        x: e.clientX - bounds.left - 120,
        y: e.clientY - bounds.top - 70,
      };

      addNode(type, position);
    },
    [addNode]
  );

  const selectedNodeData = useMemo(() => {
    return nodes.find((n) => n.id === selectedNode);
  }, [nodes, selectedNode]);

  const graphAudit = useMemo(() => auditProjectGraph({ nodes, edges }), [nodes, edges]);

  return (
    <div className="editor-surface node-editor-root h-full">
      <aside className="editor-palette node-editor-palette">
        <h3 className="text-sm font-bold text-gray-200 mb-3">
          {t('Node Palette', '노드 팔레트')}
        </h3>
        <div className="space-y-2">
          {NODE_PALETTE.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', node.type);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className="node-palette-item flex items-center gap-2 p-2 cursor-grab transition-colors"
              style={{ borderLeft: `3px solid ${node.color}` }}
            >
              <span className="text-xs font-bold w-5 h-5 rounded-full bg-black/35 border border-white/20 flex items-center justify-center">
                {node.icon}
              </span>
              <span className="text-sm">
                {language === 'ko' ? node.labelKo : node.label}
              </span>
            </div>
          ))}
        </div>

        <div className="node-editor-help">
          {t(
            'Start from one Start node, branch with choices, and finish at one of multiple endings. Note nodes are documentation only.',
            '시작 노드는 반드시 1개입니다. 시작 -> 대화 -> 선택지 -> 결과/분기 -> 엔딩 흐름으로 구성하고, 노트 노드는 설명용으로 사용하세요.'
          )}
        </div>

        <div className="node-editor-health">
          <div className="node-editor-health-title">{t('Graph Health', '그래프 점검')}</div>
          <div className="node-editor-health-meta">
            {t('Start', '시작')}: {graphAudit.metrics.startNodes}/1 | {t('Ending', '엔딩')}: {graphAudit.metrics.endingNodes} | {t('Nodes', '노드')}: {graphAudit.metrics.activeNodes}
          </div>
          {graphAudit.errors.length === 0 && graphAudit.warnings.length === 0 && (
            <div className="node-editor-health-ok">
              {t('No structural issues found.', '구조상 문제를 찾지 못했습니다.')}
            </div>
          )}
          {graphAudit.errors.slice(0, 3).map((issue) => (
            <div key={`err-${issue.code}-${issue.messageEn}`} className="node-editor-health-item is-error">
              {t(issue.messageEn, issue.messageKo)}
            </div>
          ))}
          {graphAudit.warnings.slice(0, 3).map((issue) => (
            <div key={`warn-${issue.code}-${issue.messageEn}`} className="node-editor-health-item is-warn">
              {t(issue.messageEn, issue.messageKo)}
            </div>
          ))}
          {(() => {
            const shown = Math.min(3, graphAudit.errors.length) + Math.min(3, graphAudit.warnings.length);
            const hidden = graphAudit.errors.length + graphAudit.warnings.length - shown;
            if (hidden <= 0) return null;
            return (
            <div className="node-editor-health-more">
              {t(
                `${hidden} more issues hidden...`,
                `추가 이슈 ${hidden}개가 더 있습니다...`
              )}
            </div>
            );
          })()}
        </div>
      </aside>

      <div className="editor-flow-panel node-editor-flow-wrap" onDragOver={handleDragOver} onDrop={handleDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
          }}
        >
          <Background color="rgba(190, 205, 233, 0.35)" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const colors = {
                startNode: '#63c678',
                triggerNode: '#48b267',
                dialogueNode: '#56a4e8',
                choiceNode: '#d5a052',
                resultNode: '#af86ee',
                branchNode: '#d7bf73',
                flagNode: '#5acdbd',
                endingNode: '#d86f7a',
                noteNode: '#d8b34f',
              };
              return colors[node.type] || '#8092b0';
            }}
            maskColor="rgba(6, 9, 17, 0.74)"
          />
        </ReactFlow>
      </div>

      <NodeSidebar node={selectedNodeData || null} language={language} />
    </div>
  );
}
