import { useState } from "react";
import { FaSearch, FaEnvelope, FaExclamationTriangle, FaCheckCircle, FaInbox, FaEnvelopeOpen } from "react-icons/fa";

function Inbox({ emails, selectedEmail, onSelectEmail }) {
  const [search, setSearch] = useState("");

  const filtered = emails.filter(
    (e) =>
      e.sender.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col h-full backdrop-blur-xl">
      {/* Search Header */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search inbox..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-sky-500 transition-all outline-none"
        />
        <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-xs" />
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
        <FaInbox className="text-sky-500" />
        <span>Inbox ({filtered.length})</span>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filtered.length > 0 ? (
          filtered.map((email) => {
            const isSelected = selectedEmail?.id === email.id;
            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-sky-500/10 border-sky-500/30 text-white"
                    : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/80 hover:border-slate-700/60 text-slate-300"
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-xs font-bold truncate max-w-[150px]">{email.sender}</span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{email.date}</span>
                </div>
                <div className="text-xs font-semibold truncate mb-2">{email.subject}</div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {email.body.substring(0, 40)}...
                  </span>
                  
                  {/* Badges */}
                  {email.isPhishing ? (
                    <span className="flex items-center gap-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                      <FaExclamationTriangle className="text-[8px]" /> Phishing
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                      <FaCheckCircle className="text-[8px]" /> Safe
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-slate-500 italic">No messages found</div>
        )}
      </div>
    </div>
  );
}

export default Inbox;
