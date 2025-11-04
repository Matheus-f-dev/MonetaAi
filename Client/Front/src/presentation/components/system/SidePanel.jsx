import { ProgressCard } from './ProgressCard';

export function SidePanel({ progress, salary, monthlyExpenses }) {
  return (
    <div className="sys-side">
      <ProgressCard progress={progress} salary={salary} monthlyExpenses={monthlyExpenses} />
    </div>
  );
}