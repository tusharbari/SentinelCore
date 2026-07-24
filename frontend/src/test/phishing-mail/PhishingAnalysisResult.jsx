import { FaShieldAlt, FaTimes, FaEnvelope, FaExclamationTriangle, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { useEffect, useState } from "react";

function PhishingAnalysisResult({ email, onTriggerPlaybook, onClose }) {
  const [analyzing, setAnalyzing] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    setAnalyzing(true);
    const timer = setTimeout(() => {
      // Generate simulated analysis results based on the email
      let riskScore = 10;
      let senderRep = "Neutral / Verified";
      let urlScan = "Clean";
      let attachmentScan = "No attachments found";
      let headerCheck = "Valid SPF, Valid DKIM, Match Domain";
      let hasMaliciousUrl = false;
      let hasMaliciousAtt = false;

      // Analysis calculations
      if (email.isPhishing) {
        riskScore = 45; // base for suspicious keywords
        const senderDomain = email.sender.split("@")[1]?.toLowerCase() || "";
        const blacklist = ["fakebank.com", "paypai.com", "secure-login.net", "verify-account.com", "netflix-verify.net", "amazon-login.com"];
        if (blacklist.includes(senderDomain)) {
          riskScore += 30;
          senderRep = "CRITICAL - Sender domain is blacklisted!";
        } else {
          riskScore += 10;
          senderRep = "SUSPICIOUS - Domain lacks registration history";
        }

        if (email.urls && email.urls.length > 0) {
          hasMaliciousUrl = email.urls.some(u => u.includes("verify") || u.includes("login") || u.includes("update") || u.includes("fakebank") || u.includes("paypai"));
          if (hasMaliciousUrl) {
            riskScore += 20;
            urlScan = "MALICIOUS - Embedded URLs redirect to credential harvesting domains";
          } else {
            urlScan = "SUSPICIOUS - Contains short-lived external links";
          }
        }

        if (email.attachments && email.attachments.length > 0) {
          hasMaliciousAtt = email.attachments.some(att => att.endsWith(".exe") || att.endsWith(".scr") || att.endsWith(".lnk") || att.endsWith(".zip") || att.endsWith(".js"));
          if (hasMaliciousAtt) {
            riskScore += 15;
            attachmentScan = "CRITICAL - Suspicious execution entry in zip/exe payload";
          } else {
            attachmentScan = "CLEAN - Document scans are neutral";
          }
        }

        headerCheck = "FAILED - SPF alignment fail, DKIM signature invalid";
      } else {
        // Legitimate mail
        if (email.attachments && email.attachments.length > 0) {
          attachmentScan = "CLEAN - 0 malware signatures detected";
        }
        urlScan = email.urls && email.urls.length > 0 ? "CLEAN - URL reputations are verified" : "No URLs analyzed";
      }

      if (riskScore > 100) riskScore = 100;
      const verdict = riskScore >= 50 ? "PHISHING" : "SAFE";

      setResults({
        riskScore,
        senderRep,
        urlScan,
        attachmentScan,
        headerCheck,
        verdict,
      });
      setAnalyzing(false);
    }, 1500); // 1.5s analysis delay for realism

    return () => clearTimeout(timer);
  }, [email]);

  if (analyzing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-white h-[450px]">
        <FaSpinner className="text-4xl text-sky-400 animate-spin mb-4" />
        <h3 className="text-base font-bold mb-2">Analyzing Inbound Indicators</h3>
        <p className="text-slate-500 text-xs font-mono">Running sandboxed inspections, checking blacklist IOCs...</p>
      </div>
    );
  }

  const isPhish = results.verdict === "PHISHING";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-slate-800 w-full max-w-xl">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
        <h3 className="text-base font-bold text-sky-400">Inspections forensics results</h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer transition">
            <FaTimes />
          </button>
        )}
      </div>

      <div className="space-y-5 flex-1">
        {/* Verdict and Risk Score Card */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          isPhish 
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        }`}>
          <div>
            <div className="text-xs uppercase font-bold tracking-wider mb-0.5">Verdict</div>
            <div className="text-xl font-black flex items-center gap-1.5">
              {isPhish ? (
                <>
                  <FaExclamationTriangle className="text-rose-500" /> PHISHING EMAIL
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-emerald-500" /> LEGITIMATE / SAFE
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase font-bold tracking-wider mb-0.5">Risk Score</div>
            <div className="text-2xl font-black font-mono">
              {results.riskScore}<span className="text-xs font-semibold text-slate-500">/100</span>
            </div>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="space-y-4 text-xs">
          {/* Sender */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5">
            <div className="text-slate-500 font-bold uppercase tracking-wider mb-1">Sender Reputation Check</div>
            <div className={`font-semibold ${isPhish && results.senderRep.includes("CRITICAL") ? "text-rose-400" : "text-slate-300"}`}>
              {results.senderRep}
            </div>
          </div>

          {/* URLs */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5">
            <div className="text-slate-500 font-bold uppercase tracking-wider mb-1">Embedded URL Reputation</div>
            <div className={`font-semibold ${isPhish && results.urlScan.includes("MALICIOUS") ? "text-rose-400" : "text-slate-300"}`}>
              {results.urlScan}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5">
            <div className="text-slate-500 font-bold uppercase tracking-wider mb-1">Attachment Sandbox Scan</div>
            <div className={`font-semibold ${isPhish && results.attachmentScan.includes("CRITICAL") ? "text-rose-400" : "text-slate-300"}`}>
              {results.attachmentScan}
            </div>
          </div>

          {/* Headers */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5">
            <div className="text-slate-500 font-bold uppercase tracking-wider mb-1">Email Header Analysis</div>
            <div className={`font-mono ${isPhish ? "text-amber-400 font-bold" : "text-slate-400"}`}>
              {results.headerCheck}
            </div>
          </div>
        </div>

        {/* Action Trigger button */}
        {isPhish ? (
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center gap-4">
            <span className="text-[10px] text-slate-500 max-w-[250px] leading-normal font-medium">
              Malicious profile detected. Click to simulate the SOAR response playbook containment.
            </span>
            <button
              onClick={() => onTriggerPlaybook(email)}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
            >
              <FaShieldAlt className="text-sm" /> Run Playbook
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-800 text-slate-500 text-[10px] leading-normal text-center italic font-medium">
            This email is classified as clean. Playbook automation response is bypassed.
          </div>
        )}
      </div>
    </div>
  );
}

export default PhishingAnalysisResult;
