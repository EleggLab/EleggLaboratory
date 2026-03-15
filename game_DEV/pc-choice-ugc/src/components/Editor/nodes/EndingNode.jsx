import { Handle, Position } from '@xyflow/react';

export default function EndingNode({ data, selected }) {
  const title = data.title?.trim() || data.label?.trim() || 'Ending';
  const description = data.reason?.trim() || (data.victory === false ? 'Bad ending.' : 'Story complete.');
  const short = description.length > 64 ? `${description.slice(0, 64)}...` : description;

  return (
    <div className={`ugc-node-card ugc-node-ending ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-[#ff9d9d] !w-3 !h-3" />

      <div className="ugc-node-head">
        <span>{title}</span>
        <span className="ugc-node-badge">E</span>
      </div>

      <div className="ugc-node-body">
        <div className="ugc-node-line">{data.victory === false ? 'Defeat' : 'Victory'}</div>
        <div className="ugc-node-line">{short}</div>
      </div>
    </div>
  );
}

