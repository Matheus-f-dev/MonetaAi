export function SideItem({ icon, label, active = false }) {
  return (
    <a href="#" className={`sys-side-item ${active ? "sys-active" : ""}`}>
      <span className="sys-ico">{icon}</span>
      <span>{label}</span>
    </a>
  );
}