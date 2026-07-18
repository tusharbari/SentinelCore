import { motion } from "framer-motion";

function DashboardCard({ title, value, icon, trend, trendUp }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {trend && (
            <p className={`text-xs mt-2 ${trendUp ? 'text-rose-400' : 'text-emerald-400'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardCard;
