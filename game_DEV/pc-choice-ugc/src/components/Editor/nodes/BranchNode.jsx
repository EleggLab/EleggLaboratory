import { Handle, Position } from '@xyflow/react';

export default function BranchNode({ data, selected }) {
  const conditions = data.conditions || [];

  return (
    <div className={`ugc-node-card ugc-node-branch ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-[#ffd58a] !w-3 !h-3" />

      <div className="ugc-node-head">
        <span>Branch</span>
        <span className="ugc-node-badge">B</span>
      </div>

      <div className="ugc-node-body">
        {conditions.length === 0 && <div className="ugc-node-line">No condition</div>}
        {conditions.map((cond, idx) => {
          if (cond.type === 'flag') {
            return (
              <div key={cond.id || idx} className="ugc-node-line">
                flag {cond.flagId || '-'} = {String(Boolean(cond.value))}
              </div>
            );
          }
          if (cond.type === 'item') {
            return (
              <div key={cond.id || idx} className="ugc-node-line">
                has item {cond.itemId || '-'}
              </div>
            );
          }
          return (
            <div key={cond.id || idx} className="ugc-node-line">
              {cond.stat || 'stat'} {cond.operator || '>'} {cond.value ?? 0}
            </div>
          );
        })}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!bg-[#43d37c] !w-3 !h-3"
        style={{ top: '42%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!bg-[#f06a7b] !w-3 !h-3"
        style={{ top: '74%' }}
      />
    </div>
  );
}

