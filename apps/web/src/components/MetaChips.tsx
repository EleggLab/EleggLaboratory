import {
  INFO_TYPE_LABELS,
  PHASE_TYPE_LABELS,
  TARGET_TYPE_LABELS,
} from "@tong/shared/config";
import type { InfoType, PhaseType, TargetType } from "@tong/shared/types";

interface MetaChipsProps {
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
}

export function MetaChips({ phaseType, targetType, infoType }: MetaChipsProps) {
  return (
    <div className="meta-chip-row">
      <span className="meta-chip">{PHASE_TYPE_LABELS[phaseType]}</span>
      <span className="meta-chip">{TARGET_TYPE_LABELS[targetType]}</span>
      <span className="meta-chip">{INFO_TYPE_LABELS[infoType]}</span>
    </div>
  );
}
