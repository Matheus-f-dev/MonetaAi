import { ProgressCard } from './ProgressCard';
import { BillsCard } from './BillsCard';

export function SidePanel({ progress, salary, monthlyExpenses, bills }) {
  return (
    <div className="sys-side">
      <ProgressCard progress={progress} salary={salary} monthlyExpenses={monthlyExpenses} />
      <BillsCard bills={bills} />
    </div>
  );
}