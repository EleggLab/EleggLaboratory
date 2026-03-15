import { Handle, Position } from '@xyflow/react';

export default function FlagNode({ data, selected }) {
  const flagId = data.flagId || '(unset)';
  const value = Boolean(data.value);
  const preview = data.text?.trim() || `Set ${flagId} = ${String(value)}`;

  return (
    <div className={`ugc-node-card ugc-node-flag ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-[#72e6d5] !w-3 !h-3" />

      <div className="ugc-node-head">
        <span>Flag</span>
        <span className="ugc-node-badge">F</span>
      </div>

      <div className="ugc-node-body">
        <div className="ugc-node-line">{flagId} = {String(value)}</div>
        <div className="ugc-node-line">{preview.length > 50 ? `${preview.slice(0, 50)}...` : preview}</div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#72e6d5] !w-3 !h-3" />
    </div>
  );
}

