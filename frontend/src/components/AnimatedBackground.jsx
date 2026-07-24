function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Static Grid */}
      <div
        className="absolute inset-0 opacity-5 dark:opacity-10 transition-opacity duration-300"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56,189,248,.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,.2) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Static background blur spots */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full bg-sky-500/20 blur-[140px] dark:bg-sky-500/20" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[180px] dark:bg-indigo-500/20" />
      <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[140px] -translate-x-1/2 -translate-y-1/2 dark:bg-cyan-500/15" />
    </div>
  );
}

export default AnimatedBackground;