export function SideItem({ icon, label, active = false, onClick }) {
  return (
    <button 
      className={`sys-side-item ${active ? "sys-active" : ""}`}
      onClick={onClick}
    >
      <span className="sys-ico">{icon}</span>
      <span>{label}</span>
    </button>
  );
}