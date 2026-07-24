import { FaShieldAlt, FaPaperclip, FaLink, FaEnvelope, FaExclamationTriangle } from "react-icons/fa";

function EmailDetails({ email, onCheckPhishing }) {
  if (!email) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center h-full text-slate-500 backdrop-blur-xl">
        <FaEnvelope className="text-4xl mb-4 text-slate-700 animate-pulse" />
        <p className="text-sm font-semibold">Select an email to view details</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col h-full backdrop-blur-xl">
      {/* Header Info */}
      <div className="border-b border-slate-800 pb-4 mb-4 space-y-2">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-lg font-bold text-white tracking-wide">{email.subject}</h2>
          <button
            onClick={() => onCheckPhishing(email)}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <FaShieldAlt className="text-sm animate-pulse" /> Check Phishing
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase min-w-[70px] inline-block">From:</span>
            <span className="text-sky-400 font-bold">{email.sender}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase min-w-[70px] inline-block">To:</span>
            <span className="text-slate-300 font-medium">{email.recipient}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase min-w-[70px] inline-block">Date:</span>
            <span className="text-slate-400 font-mono">{email.date}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap font-sans scrollbar-thin scrollbar-thumb-slate-800 mb-4">
        {email.body}
      </div>

      {/* Attachments & URLs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-4 text-xs">
        {/* Attachments */}
        <div>
          <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider mb-2">
            <FaPaperclip className="text-slate-500" />
            <span>Attachments</span>
          </div>
          {email.attachments && email.attachments.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {email.attachments.map((att, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-semibold hover:border-slate-700 transition"
                >
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                  {att}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 italic">No attachments</div>
          )}
        </div>

        {/* URLs */}
        <div>
          <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider mb-2">
            <FaLink className="text-slate-500" />
            <span>Analyzed URLs</span>
          </div>
          {email.urls && email.urls.length > 0 ? (
            <div className="space-y-1">
              {email.urls.map((url, idx) => (
                <div
                  key={idx}
                  className="text-cyan-400 hover:underline font-mono truncate cursor-pointer hover:text-cyan-300 flex items-center gap-1"
                >
                  <span className="text-[10px] text-slate-500">▶</span>
                  {url}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 italic">No URLs identified</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailDetails;
