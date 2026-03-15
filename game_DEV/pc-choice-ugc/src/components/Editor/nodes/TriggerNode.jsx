import { Handle, Position } from '@xyflow/react';

export default function TriggerNode({ data, selected }) {
  const minDay = data.minDay || 1;
  const maxDay = data.maxDay;
  const probability = Math.round((data.probability || 1) * 100);
  const timing = data.timing || 'event';
  const common = data.common === true;

  return (
    <div className={`ugc-node-card ugc-node-trigger ${selected ? 'is-selected' : ''}`}>
      <div className="ugc-node-head">
        <span>Trigger</span>
        <span className="ugc-node-badge">T</span>
      </div>

      <div className="ugc-node-body">
        <div className="ugc-node-line">Day: {minDay}{maxDay ? ` - ${maxDay}` : '+'}</div>
        <div className="ugc-node-line">Chance: {probability}%</div>
        <div className="ugc-node-line">Phase: {timing}</div>
        {data.eventImageId && <div className="ugc-node-line">Image: linked</div>}
        {common && <div className="ugc-node-line">Common Trigger</div>}
        {data.requiredFlags?.length > 0 && (
          <div className="ugc-node-line">Flags: {data.requiredFlags.length}</div>
        )}
        {data.requiredItems?.length > 0 && (
          <div className="ugc-node-line">Items: {data.requiredItems.length}</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#42cf7e] !w-3 !h-3" />
    </div>
  );
}
