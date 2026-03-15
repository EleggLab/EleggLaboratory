import { Handle, Position } from '@xyflow/react';

export default function StartNode({ data, selected }) {
  const label = data.label?.trim() || 'Start';
  const text = data.description?.trim() || 'Story entry point';
  const preview = text.length > 58 ? `${text.slice(0, 58)}...` : text;

  return (
    <div className={`ugc-node-card ugc-node-start ${selected ? 'is-selected' : ''}`}>
      <div className="ugc-node-head">
        <span>{label}</span>
        <span className="ugc-node-badge">S</span>
      </div>

      <div className="ugc-node-body">
        <div className="ugc-node-line">{preview}</div>
        <div className="ugc-node-line">Single entry</div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#7ee28f] !w-3 !h-3" />
    </div>
  );
}

