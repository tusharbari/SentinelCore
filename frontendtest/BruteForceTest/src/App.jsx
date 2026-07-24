import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:8080";

export default function App() {
  const [bfEmail, setBfEmail] = useState("");
  const [bfPassword, setBfPassword] = useState("");
  const [bfMessage, setBfMessage] = useState("");
  const [bfMessageType, setBfMessageType] = useState("");
  const [failedCount, setFailedCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const targetIp = "192.168.1.105";

  useEffect(() => {
    checkBfStatus();
    const interval = setInterval(checkBfStatus, 2000);
    return () => clearInterval(interval);
  }, [bfEmail, isBlocked]);

  const checkBfStatus = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/playbooks/target-status?ip=${targetIp}&username=${encodeURIComponent(bfEmail || "test@gmail.com")}`
      );
      if (res.data && res.data.blocked) {
        setIsBlocked(true);
        setBfMessage("Access block enforced. IP address and target account credentials suspended.");
        setBfMessageType("blocked");
      } else if (isBlocked) {
        setIsBlocked(false);
        setBfMessage("");
        setBfMessageType("");
        setFailedCount(0);
      }
    } catch (err) {}
  };

  const handleBfSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked || isSuccess) return;

    const validEmail = "test@gmail.com";
    const validPassword = "testing";

    if (bfEmail === validEmail && bfPassword === validPassword) {
      setBfMessage("Authentication Successful.");
      setBfMessageType("success");
      setIsSuccess(true);
      setFailedCount(0);
    } else {
      const newFailedCount = failedCount + 1;
      setFailedCount(newFailedCount);

      if (newFailedCount >= 5) {
        setIsBlocked(true);
        setBfMessage("Active containment rule blocks authentication. Suspicious brute-force signature detected.");
        setBfMessageType("blocked");

        try {
          await axios.post(
            `${BACKEND_URL}/api/playbooks/simulate-brute-force?ip=${targetIp}&username=${encodeURIComponent(bfEmail || "test@gmail.com")}`
          );
        } catch (err) {
          console.error(err);
        }
      } else {
        setBfMessage(`Invalid credentials. Attempt ${newFailedCount} of 5.`);
        setBfMessageType("error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center font-sans p-4 text-[#1f2937]">
      
      {/* Main Login Form Container */}
      <div className="bg-white border border-[#e5e7eb] rounded shadow-md p-8 w-full max-w-[420px]">
        <h2 className="text-3xl font-bold text-center mb-6 text-[#1f2937]">Login Form</h2>
        
        <form onSubmit={handleBfSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1">Username:</label>
            <input
              type="email"
              placeholder="Enter your username"
              value={bfEmail}
              onChange={(e) => setBfEmail(e.target.value)}
              disabled={isBlocked || isSuccess}
              required
              className="w-full px-3.5 py-2 border border-[#d1d5db] rounded outline-none focus:border-[#3b82f6] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1">Password:</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={bfPassword}
              onChange={(e) => setBfPassword(e.target.value)}
              disabled={isBlocked || isSuccess}
              required
              className="w-full px-3.5 py-2 border border-[#d1d5db] rounded outline-none focus:border-[#3b82f6] text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="text-sm text-[#4b5563] cursor-pointer select-none">
              Remember
            </label>
          </div>

          <button
            type="submit"
            disabled={isBlocked || isSuccess}
            className={`w-full py-2.5 bg-[#007bff] hover:bg-[#0056b3] text-white font-semibold rounded text-sm transition cursor-pointer ${
              isBlocked ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSuccess ? "Session Authenticated" : "Login"}
          </button>
        </form>

        {bfMessage && (
          <div
            className={`mt-5 p-3 rounded text-sm font-semibold border text-center ${
              bfMessageType === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : bfMessageType === "blocked"
                ? "bg-red-50 border-red-200 text-red-700 font-bold"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {bfMessage}
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 font-semibold max-w-sm leading-normal">
        Test credentials: <br/>
        <span className="font-mono text-slate-500 font-bold">test@gmail.com</span> / <span className="font-mono text-slate-500 font-bold">testing</span>
      </div>
    </div>
  );
}
