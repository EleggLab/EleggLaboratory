import { Handle, Position } from '@xyflow/react';

export default function NoteNode({ data, selected }) {
  const title = data.title?.trim() || data.label?.trim() || 'Note';
  const text = data.text?.trim() || 'Designer note';
  const preview = text.length > 84 ? `${text.slice(0, 84)}...` : text;
  const tone = data.noteColor || '#d8b34f';

  return (
    <div
      className={`ugc-node-card ugc-node-note ${selected ? 'is-selected' : ''}`}
      style={{ borderColor: `${tone}aa` }}
    >
      <Handle type="target" position={Position.Left} className="!bg-[#d8b34f] !w-3 !h-3" />

      <div className="ugc-node-head">
        <span>{title}</span>
        <span className="ugc-node-badge">N</span>
      </div>

      <div className="ugc-node-body">
        <div className="ugc-node-line">{preview}</div>
        <div className="ugc-node-line">Doc only / not gameplay logic</div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#d8b34f] !w-3 !h-3" />
    </div>
  );
}

