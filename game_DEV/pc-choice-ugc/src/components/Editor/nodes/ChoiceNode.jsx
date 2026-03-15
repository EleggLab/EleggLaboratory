import { Handle, Position } from '@xyflow/react';

export default function ChoiceNode({ data, selected }) {
  const choices = data.choices || [];

  return (
    <div className={`ugc-node-card ugc-node-choice ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-[#f0b66b] !w-3 !h-3" />

      <div className="ugc-node-head">
        <span>Choice</span>
        <span className="ugc-node-badge">C</span>
      </div>

      <div className="ugc-node-body">
        {choices.length === 0 && <div className="ugc-node-line">No options</div>}
        {choices.map((choice, index) => {
          const txt = choice.text?.trim() || 'Option';
          const short = txt.length > 28 ? `${txt.slice(0, 28)}...` : txt;
          return (
            <div key={choice.id || index} className="ugc-node-line">
              {index + 1}. {short}{choice.requiredItem ? ' (item)' : ''}
            </div>
          );
        })}
      </div>

      {choices.map((choice, index) => (
        <Handle
          key={choice.id || index}
          type="source"
          position={Position.Right}
          id={`choice-${index}`}
          className="!bg-[#ffd16a] !w-3 !h-3"
          style={{ top: `${46 + index * 26}px` }}
        />
      ))}
    </div>
  );
}

