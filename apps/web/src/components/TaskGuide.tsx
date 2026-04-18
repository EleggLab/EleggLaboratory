import { Target } from "lucide-react";

interface TaskGuideProps {
  title: string;
  description: string;
  meta: string[];
}

export function TaskGuide({ title, description, meta }: TaskGuideProps) {
  return (
    <article className="task-guide">
      <div className="task-guide-head">
        <span className="status-icon subtle">
          <Target size={18} strokeWidth={2.2} />
        </span>
        <div>
          <p className="eyebrow">지금 할 일</p>
          <h3>{title}</h3>
          <p className="helper-copy">{description}</p>
        </div>
      </div>
      <div className="task-guide-meta">
        {meta.map((item) => (
          <span key={item} className="pill muted">
            {item}
          </span>
        ))}
      </div>
    </article>
  );
}
