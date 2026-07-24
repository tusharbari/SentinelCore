import { X, Bot } from "lucide-react";

export default function AlertAnalysisModal({
    open,
    onClose,
    analysis,
    loading,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">

            <div className="bg-slate-900 border border-cyan-500 rounded-2xl shadow-2xl w-[850px] max-h-[85vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">

                    <div className="flex items-center gap-3">
                        <Bot className="text-cyan-400" size={28} />
                        <h2 className="text-2xl font-bold text-white">
                            AI Alert Analysis
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-red-400 transition"
                    >
                        <X size={26} />
                    </button>

                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[65vh]">

                    {loading ? (

                        <div className="text-center py-20">

                            <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-cyan-400 mx-auto"></div>

                            <p className="mt-6 text-lg text-slate-300">
                                🤖 AI is analyzing this security alert...
                            </p>

                        </div>

                    ) : (

                        <div className="bg-slate-800 rounded-xl p-5">

                            <pre className="whitespace-pre-wrap text-slate-200 leading-8 text-[15px] font-sans">
                                {analysis}
                            </pre>

                        </div>

                    )}

                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 px-6 py-4 flex justify-end">

                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition"
                    >
                        Close
                    </button>

                </div>

            </div>

        </div>
    );
}