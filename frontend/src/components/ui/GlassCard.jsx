function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`
        bg-slate-900/80
        backdrop-blur-xl
        border
        border-slate-800
        rounded-3xl
        shadow-2xl
        transition-all
        duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default GlassCard;