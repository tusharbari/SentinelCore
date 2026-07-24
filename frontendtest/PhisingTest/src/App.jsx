import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:8080";

const QUEUE_EMAILS = [
  {
    id: "MSG-092",
    name: "Safe Business Invoice",
    sender: "billing@aws.amazon.com",
    recipient: "analyst@sentinelcore.local",
    subject: "AWS Cloud Monthly Services Billing",
    body: "Dear Customer,\n\nYour monthly billing statement is now available for download. Your registered card has been charged for the amount of $245.50. You can review your billing details in the AWS console.\n\nThank you for choosing AWS.\nAmazon Web Services Team",
    attachment: "AWS_Invoice_July_2026.pdf",
    description: "Standard business email with clean reputation domain.",
    status: "Ready for Scan"
  },
  {
    id: "MSG-411",
    name: "PayPal Spoofed Domain",
    sender: "security-alert@paypaI.com",
    recipient: "finance-dept@sentinelcore.local",
    subject: "URGENT: Unauthorized login detected on your business account",
    body: "We detected an unauthorized login attempt from IP 203.0.113.50. To protect your funds and restore account access, you must login immediately and verify your account credentials. Failure to verify within 24 hours will result in permanent suspension.",
    attachment: "Security_Token_Details.exe",
    description: "Spoofed lookalike sender domain and urgent call to action.",
    status: "Ready for Scan"
  },
  {
    id: "MSG-718",
    name: "Password Expiry Keywords",
    sender: "sysadmin@internal-security.net",
    recipient: "employee-relations@sentinelcore.local",
    subject: "Action Required: Active Directory Password Expired",
    body: "Your corporate password expired today. Please click here to reset your credentials. Failure to update payment and credentials will lock you out of all Microsoft 365 services by 5:00 PM today.",
    attachment: "",
    description: "Phishing alert containing password expiry keywords.",
    status: "Ready for Scan"
  },
  {
    id: "MSG-503",
    name: "Free Gift Promo Spam",
    sender: "promo@gift-winner-loyalty.com",
    recipient: "hr-inbox@sentinelcore.local",
    subject: "Congratulations! You have received a free gift voucher",
    body: "As a valued corporate user, you have been selected. Click here now to claim your $500 free gift card before the link expires. Enjoy your free gift!",
    attachment: "",
    description: "Promotion offering a free gift with suspicious click-through link.",
    status: "Ready for Scan"
  }
];

export default function App() {
  const [emailQueue, setEmailQueue] = useState(QUEUE_EMAILS);
  const [selectedMailIndex, setSelectedMailIndex] = useState(0);
  const [customMode, setCustomMode] = useState(false);

  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState(null);
  const [executionDetails, setExecutionDetails] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [isPhishingResult, setIsPhishingResult] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);

  const pollingRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [executionLogs]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (!customMode && emailQueue[selectedMailIndex]) {
      const activeMail = emailQueue[selectedMailIndex];
      setSender(activeMail.sender);
      setRecipient(activeMail.recipient);
      setSubject(activeMail.subject);
      setBody(activeMail.body);
      setAttachment(activeMail.attachment);
    }
  }, [selectedMailIndex, customMode]);

  const runEmailGatewayScanner = async (e) => {
    if (e) e.preventDefault();
    if (!sender || !recipient || !subject || !body) {
      alert("Missing required fields. Ingestion failed.");
      return;
    }

    setIsAnalyzing(true);
    setExecutionLogs([{ time: new Date().toLocaleTimeString(), message: "[System] Connected to SentinelCore Sandbox Engine." }]);
    setExecutionDetails(null);
    setIsDelivered(false);

    if (!customMode) {
      const updatedQueue = [...emailQueue];
      updatedQueue[selectedMailIndex].status = "Scanning...";
      setEmailQueue(updatedQueue);
    }

    try {
      const res = await axios.post(`${BACKEND_URL}/api/playbooks/simulate-phishing`, {
        sender,
        recipient,
        subject,
        body,
        attachment
      });

      const execId = res.data.id;
      setCurrentExecutionId(execId);
      pollDatabaseExecution(execId);
    } catch (err) {
      setIsAnalyzing(false);
      setExecutionLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: "[Error] Failed to connect to Spring Boot. Check if backend is running on port 8080." }
      ]);
      console.error(err);
    }
  };

  const pollDatabaseExecution = (execId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const detailsRes = await axios.get(`${BACKEND_URL}/api/playbooks/executions/${execId}`);
        const logsRes = await axios.get(`${BACKEND_URL}/api/playbooks/executions/${execId}/logs`);

        const exec = detailsRes.data;
        const logs = logsRes.data;

        setExecutionDetails(exec);

        const mappedLogs = logs.map((log) => ({
          time: new Date(log.timestamp).toLocaleTimeString(),
          message: `[${log.stepName}] ${log.message}`
        }));
        setExecutionLogs(mappedLogs);

        if (exec.status === "SUCCESS" || exec.status === "FAILED") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsAnalyzing(false);

          const isPhish = exec.incidentTitle && exec.incidentTitle.includes("Phishing");
          setIsPhishingResult(isPhish);

          if (!customMode) {
            const updatedQueue = [...emailQueue];
            updatedQueue[selectedMailIndex].status = isPhish ? "Quarantined" : "Clean";
            setEmailQueue(updatedQueue);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 500);
  };

  const renderHighlightedContent = (text) => {
    if (!text) return "";
    let highlighted = text;

    const keywords = [
      "verify your account",
      "urgent",
      "click here",
      "password expired",
      "login immediately",
      "update payment",
      "free gift"
    ];

    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlighted = highlighted.replace(
        regex,
        `<span class="bg-red-100 text-red-705 border border-red-200 px-1 py-0.5 rounded font-bold text-sm select-none">$1</span>`
      );
    });

    return (
      <div className="text-sm leading-relaxed whitespace-pre-line text-slate-800">
        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  };

  const timelineSteps = [
    { label: "Email Received", index: 0, desc: "Message captured" },
    { label: "Domain Check", index: 1, desc: "Reputation verification" },
    { label: "Keyword Scan", index: 2, desc: "NLP heuristic check" },
    { label: "Threat Assessment", index: 3, desc: "Score calculation" },
    { label: "Sandbox Isolation", index: 4, desc: "Attachment sandbox scan" },
    { label: "Incident Logging", index: 5, desc: "Incident ticket log" },
    { label: "SOC Dispatch Alert", index: 6, desc: "Broadcast alerts" },
    { label: "Playbook Complete", index: 7, desc: "Containment finished" }
  ];

  const getTimelineState = (stepIndex) => {
    if (!executionDetails) return { isCompleted: false, isActive: false };
    const backendIdx = executionDetails.currentStepIndex || 0;
    const isFinished = executionDetails.status === "SUCCESS" || executionDetails.status === "FAILED";

    if (isFinished) return { isCompleted: true, isActive: false };

    const mappedIndex = Math.min(Math.floor(backendIdx * 1.5), 7);

    if (stepIndex < mappedIndex) {
      return { isCompleted: true, isActive: false };
    }
    if (stepIndex === mappedIndex) {
      return { isCompleted: false, isActive: true };
    }
    return { isCompleted: false, isActive: false };
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#1f2937] font-sans pb-16">
      
      {/* Header (No icons or logos) */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div>
          <h1 className="text-lg font-bold text-[#1f2937] tracking-wider">
            SentinelCore Phishing Gateway Simulator
          </h1>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Gateway Active
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* 1. Left: Inbound Queue */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-white border border-[#e5e7eb] rounded shadow-sm p-4 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <span className="text-sm font-bold text-slate-700">
                  Inbound Inbox
                </span>
                <button
                  onClick={() => {
                    setCustomMode(true);
                    setSender("");
                    setRecipient("");
                    setSubject("");
                    setBody("");
                    setAttachment("");
                    setExecutionDetails(null);
                  }}
                  className="text-xs bg-[#007bff] hover:bg-[#0056b3] text-white px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer font-bold transition active:scale-95"
                >
                  <span>Compose</span>
                </button>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1">
                {emailQueue.map((mail, idx) => {
                  const active = !customMode && selectedMailIndex === idx;
                  return (
                    <button
                      key={mail.id}
                      onClick={() => {
                        setCustomMode(false);
                        setSelectedMailIndex(idx);
                        setExecutionDetails(null);
                        setExecutionLogs([]);
                      }}
                      className={`w-full text-left p-3.5 rounded border text-sm transition duration-205 flex flex-col gap-1 cursor-pointer relative ${
                        active
                          ? "bg-slate-100 border-[#007bff] text-slate-900 font-semibold"
                          : "bg-transparent border-[#e5e7eb] hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full gap-2">
                        <span className="font-bold truncate pr-1">{mail.name}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-black shrink-0 ${
                            mail.status === "Quarantined"
                              ? "bg-red-50 text-red-705 border border-red-200"
                              : mail.status === "Clean"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {mail.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{mail.subject}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Center: Inspector / Composer */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {customMode ? (
              <div className="bg-white border border-[#e5e7eb] rounded shadow-sm p-5 flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900">
                      Compose Simulated Payload
                    </h3>
                    <button
                      onClick={() => setCustomMode(false)}
                      className="text-xs text-slate-450 hover:text-slate-700 cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={runEmailGatewayScanner} className="space-y-3 text-sm">
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1">
                        Sender Address:
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. support@fakebank.com"
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-[#d1d5db] rounded text-sm text-[#1f2937] focus:border-[#3b82f6] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1">
                        Recipient Address:
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. victim@corp.local"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-[#d1d5db] rounded text-sm text-[#1f2937] focus:border-[#3b82f6] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1">
                        Email Subject:
                      </label>
                      <input
                        type="text"
                        placeholder="Urgent account alert"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-[#d1d5db] rounded text-sm text-[#1f2937] focus:border-[#3b82f6] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1">
                        Email Body:
                      </label>
                      <textarea
                        placeholder="Write raw text body..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#d1d5db] rounded text-sm text-[#1f2937] focus:border-[#3b82f6] outline-none resize-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1">
                        Attachment File:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. invoice.pdf"
                        value={attachment}
                        onChange={(e) => setAttachment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#d1d5db] rounded text-sm text-[#1f2937] focus:border-[#3b82f6] outline-none transition"
                      />
                    </div>
                  </form>
                </div>

                <div className="pt-3 border-t border-slate-200 mt-4">
                  <button
                    type="submit"
                    onClick={runEmailGatewayScanner}
                    disabled={isAnalyzing}
                    className="w-full py-2.5 bg-[#007bff] hover:bg-[#0056b3] text-white rounded text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95"
                  >
                    <span>Inject and Test Payload</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#e5e7eb] rounded shadow-sm p-5 flex flex-col h-full justify-between min-h-[500px]">
                <div>
                  <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Gateway Message Inspector
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        Queue Status: <strong className="text-[#007bff]">{emailQueue[selectedMailIndex]?.status}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Email Details Card */}
                  <div className="bg-slate-50 border border-[#e5e7eb] rounded p-4 mb-4 text-sm space-y-2 font-sans">
                    <div className="flex gap-2">
                      <span className="text-slate-500 font-bold min-w-[60px]">From:</span>
                      <span className="font-semibold text-slate-800 truncate">{sender}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 font-bold min-w-[60px]">To:</span>
                      <span className="text-slate-700">{recipient}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 font-bold min-w-[60px]">Subject:</span>
                      <span className="font-bold text-slate-900">{subject}</span>
                    </div>
                    {attachment && (
                      <div className="flex gap-1.5 items-center text-blue-600 bg-blue-50 border border-blue-105 px-2.5 py-1 rounded text-xs font-semibold mt-2.5 w-fit">
                        <span>Paperclip:</span>
                        <span>{attachment}</span>
                      </div>
                    )}
                  </div>

                  {/* Body container with larger, readable font */}
                  <div className="min-h-[140px] bg-slate-50 rounded p-4 border border-slate-200 overflow-y-auto max-h-[220px]">
                    {!isAnalyzing && executionDetails ? (
                      renderHighlightedContent(body)
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                        {body}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => runEmailGatewayScanner()}
                    disabled={isAnalyzing}
                    className={`w-full py-3 bg-[#007bff] hover:bg-[#0056b3] text-white rounded text-sm font-bold uppercase tracking-wider transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow ${
                      isAnalyzing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isAnalyzing ? (
                      <span>Simulating Response steps...</span>
                    ) : (
                      <span>Run Gateway Analysis Scan</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Right: SOAR Status Checklist & Logs */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {(isAnalyzing || executionDetails) ? (
              <div className="space-y-4 flex flex-col h-full justify-between">
                <div className="space-y-4">
                  {/* Banners */}
                  {!isAnalyzing && executionDetails && (
                    <div>
                      {isPhishingResult ? (
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Malicious Threat Isolated
                          </h4>
                          <p className="text-xs mt-1 leading-normal font-semibold">
                            Rule Enforced: Email isolated and sender blocked. Incident logged in SOC.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded p-4 text-green-750">
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Legitimate Email Verified
                          </h4>
                          <p className="text-xs mt-1 leading-normal font-semibold">
                            Clean indicators. Router has approved message delivery.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step list */}
                  <div className="bg-white border border-[#e5e7eb] rounded p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3.5 border-b border-slate-200 pb-2">
                      Active Response Stepper
                    </h4>

                    <div className="relative pl-6 space-y-3 text-sm">
                      <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-slate-200" />

                      {timelineSteps.map((step, idx) => {
                        const { isCompleted, isActive } = getTimelineState(step.index);

                        return (
                          <div key={idx} className="relative flex flex-col gap-0.5">
                            <div className="absolute -left-[20px] flex items-center justify-center w-4 h-4 z-10 bg-white rounded-full">
                              {isCompleted ? (
                                <span className="text-xs text-green-600 font-bold">✓</span>
                              ) : isActive ? (
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              )}
                            </div>

                            <span
                              className={`text-xs font-bold leading-none ${
                                isCompleted
                                  ? "text-slate-800 font-semibold"
                                  : isActive
                                  ? "text-blue-600 font-black"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.label}
                            </span>
                            {(isCompleted || isActive) && (
                              <span className="text-[10px] text-slate-400">
                                {step.desc}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Incident Ticket */}
                  {!isAnalyzing && executionDetails && isPhishingResult && (
                    <div className="bg-white border border-[#e5e7eb] rounded p-4 shadow-sm space-y-2">
                      <h4 className="text-xs font-bold text-slate-550 uppercase tracking-widest border-b border-slate-200 pb-2">
                        Incident Log Report
                      </h4>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Incident ID</p>
                          <p className="text-slate-800 font-mono font-bold">INC-#{executionDetails.incidentId}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Classification</p>
                          <p className="text-red-650 font-bold">CRITICAL</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Console Logs */}
                  <div className="bg-[#1f2937] border border-slate-800 rounded overflow-hidden shadow">
                    <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-slate-350">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                        soar_terminal_runner.log
                      </span>
                    </div>

                    <div className="p-3.5 font-mono text-xs h-32 overflow-y-auto space-y-1.5 text-slate-300">
                      {executionLogs.map((log, idx) => (
                        <p key={idx} className="flex gap-2">
                          <span className="text-cyan-400 font-semibold shrink-0">[{log.time}]</span>
                          <span
                            className={
                              log.message.includes("WARN") || log.message.includes("failed")
                                ? "text-yellow-400"
                                : log.message.includes("ERROR") || log.message.includes("quarantine") || log.message.includes("blocked")
                                ? "text-red-400 font-bold"
                                : log.message.includes("SUCCESS") || log.message.includes("complete") || log.message.includes("routed")
                                ? "text-green-400"
                                : "text-slate-300"
                            }
                          >
                            {log.message}
                          </span>
                        </p>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#e5e7eb] rounded p-5 shadow-sm text-xs space-y-4 flex flex-col justify-between h-full min-h-[400px]">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                    Telemetry Guidelines
                  </h4>
                  <p className="text-slate-500 leading-relaxed font-semibold">
                    Load predefined templates from the inbound gateway queue to examine subject domains, headers, and body alerts.
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 font-mono text-xs space-y-1.5 mt-3 text-slate-600">
                    <div className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Engine Constants:
                    </div>
                    <div>• Blacklists: paypaI.com, fakebank.com</div>
                    <div>• Keywords: urgent, reset password, update details</div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
