import { Handle, Position } from '@xyflow/react';

export default function DialogueNode({ data, selected }) {
  const text = data.text?.trim();
  const truncatedText = text && text.length > 80 ? `${text.slice(0, 80)}...` : (text || 'Enter dialogue');

  return (
    <div className={`ugc-node-card ugc-node-dialogue ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-[#5a9bff] !w-3 !h-3" />

      <div className="ugc-node-head">
        <span>Dialogue</span>
        <span className="ugc-node-badge">D</span>
      </div>

      <div className="ugc-node-body">
        <div className="ugc-node-line">{truncatedText}</div>
        {(data.characterId || data.backgroundId) && (
          <div className="ugc-node-line">
            {data.characterId ? `Char: ${data.characterId}` : 'Char: -'}
            {' | '}
            {data.backgroundId ? `BG: ${data.backgroundId}` : 'BG: -'}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#5a9bff] !w-3 !h-3" />
    </div>
  );
}

