import { Handle, Position } from '@xyflow/react';

export default function ResultNode({ data, selected }) {
  const successChance = Math.max(0, Math.min(1, data.successChance ?? 1));
  const hasFailure = successChance < 1;
  const successText = data.onSuccess?.text?.trim() || 'Success result';
  const failureText = data.onFailure?.text?.trim() || 'Failure result';

  return (
    <div className={`ugc-node-card ugc-node-result ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-[#c79bff] !w-3 !h-3" />

      <div className="ugc-node-head">
        <span>Result</span>
        <span className="ugc-node-badge">R</span>
      </div>

      <div className="ugc-node-body">
        <div className="ugc-node-line">Success: {Math.round(successChance * 100)}%</div>
        <div className="ugc-node-line">
          OK: {successText.length > 26 ? `${successText.slice(0, 26)}...` : successText}
        </div>
        {hasFailure && (
          <div className="ugc-node-line">
            NG: {failureText.length > 26 ? `${failureText.slice(0, 26)}...` : failureText}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="!bg-[#43d37c] !w-3 !h-3"
        style={{ top: '52%' }}
      />
      {hasFailure && (
        <Handle
          type="source"
          position={Position.Right}
          id="failure"
          className="!bg-[#f06a7b] !w-3 !h-3"
          style={{ top: '78%' }}
        />
      )}
    </div>
  );
}

