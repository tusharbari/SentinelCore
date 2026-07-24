import { useEffect, useState } from "react";
import { FaCheckCircle, FaSpinner, FaClock, FaTimes, FaShieldAlt } from "react-icons/fa";

function PlaybookSimulation({ email, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Email Received", desc: "Phishing message injected into mail queue." },
    { label: "Alert Created", desc: "System Alert #8990 triggered for investigation." },
    { label: "Playbook Triggered", desc: "SOAR automation kicks off 'Phishing Email Response'." },
    { label: "Email Analysis", desc: "Scanning headers, blacklisted IOCs, and attachments." },
    { label: "Risk Score", desc: "Calculated risk score above threshold." },
    { label: "Quarantine", desc: "Inbound email isolated at secure backup store." },
    { label: "Block Sender", desc: "Sender address blacklisted at mail relay and firewall." },
    { label: "Incident Created", desc: "Created ticket Critical incident #1002 in console." },
    { label: "Notify Analyst", desc: "Sent Slack notification alerts to SOC response teams." },
    { label: "Completed", desc: "Threat contained, alert updated to closed." },
  ];

  useEffect(() => {
    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200); // Progress each step every 1.2s for visibility

    return () => clearInterval(interval);
  }, []);

  const progress = ((currentStep) / (steps.length - 1)) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white max-h-[85vh] flex flex-col scrollbar-thin scrollbar-thumb-slate-800 w-full max-w-xl">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
        <h3 className="text-base font-bold text-sky-400 flex items-center gap-1.5">
          <FaShieldAlt className="text-rose-500 text-sm animate-pulse" /> Playbook Containment Simulation
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer transition">
            <FaTimes />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Progress Bar Header */}
        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl mb-2 text-xs">
          <div className="flex justify-between items-center mb-2 font-bold uppercase tracking-wider text-slate-400">
            <span>Playbook Progress</span>
            <span className="font-mono text-white text-sm">{Math.round(progress)}%</span>
          </div>
          <div className="bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="relative pl-8 space-y-5">
          {/* Vertical connection line */}
          <div className="absolute left-3.5 top-2.5 bottom-2.5 w-[2px] bg-slate-800" />
          <div
            className="absolute left-3.5 top-2.5 w-[2px] bg-gradient-to-b from-sky-400 via-amber-400 to-emerald-500 transition-all duration-500"
            style={{ height: `calc(${progress}% - 8px)` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isPending = idx > currentStep;

            return (
              <div key={idx} className="relative flex gap-4 items-start text-xs">
                {/* Node icon */}
                <div className="absolute -left-[27px] mt-0.5 z-10">
                  {isCompleted && <FaCheckCircle className="text-emerald-400 bg-slate-900 rounded-full text-base" />}
                  {isCurrent && <FaSpinner className="text-sky-400 bg-slate-900 rounded-full text-base animate-spin" />}
                  {isPending && <FaClock className="text-slate-600 bg-slate-900 rounded-full text-base" />}
                </div>

                <div>
                  <h4 className={`font-bold transition duration-300 ${
                    isCompleted ? "text-slate-300" : isCurrent ? "text-sky-400 font-extrabold text-sm" : "text-slate-500"
                  }`}>
                    {step.label}
                  </h4>
                  {(isCompleted || isCurrent) && (
                    <p className="text-slate-500 mt-0.5 leading-normal transition duration-300 font-medium">
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlaybookSimulation;
