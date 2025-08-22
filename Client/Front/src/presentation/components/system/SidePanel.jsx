import { ProgressCard } from './ProgressCard';
import { BillsCard } from './BillsCard';

export function SidePanel({ progress, salary, bills }) {
  return (
    <div className="sys-side">
      <ProgressCard progress={progress} salary={salary} />
      <BillsCard bills={bills} />
    </div>
  );
}