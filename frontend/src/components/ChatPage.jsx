import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, AlertCircle, Settings2 } from "lucide-react";
import { toast } from "react-hot-toast";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import NLPPanel from "./NLPPanel";
import { v4 as uuidv4 } from "uuid";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getSessionId = () => {
	let id = sessionStorage.getItem("nova_session_id");
	if (!id) {
		id = uuidv4();
		sessionStorage.setItem("nova_session_id", id);
	}
	return id;
};

export default function ChatPage({ backendOnline }) {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [sessionId, setSessionId] = useState(getSessionId);
	const [nlpAnalysis, setNlpAnalysis] = useState(null);
	const [memoryLength, setMemoryLength] = useState(0);
	const [nlpPanelOpen, setNlpPanelOpen] = useState(true);
	const [followups, setFollowups] = useState([]);
	const [runtimeMode, setRuntimeMode] = useState("local");
	const [providerDiagnostics, setProviderDiagnostics] = useState(null);
	const [responseStyle, setResponseStyle] = useState("balanced");
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);
	const abortRef = useRef(null);
	const prevProviderRef = useRef(null);
	const prevCooldownRef = useRef(0);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, isLoading, scrollToBottom]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		const fetchDiagnostics = async () => {
			if (!backendOnline) return;
			try {
				const res = await fetch(`${API_URL}/debug/provider`);
				if (!res.ok) return;
				const data = await res.json();
				setProviderDiagnostics(data);
			} catch {
				// silent
			}
		};

		fetchDiagnostics();
		const id = setInterval(fetchDiagnostics, 20000);
		return () => clearInterval(id);
	}, [backendOnline]);

	const getTimestamp = () =>
		new Date().toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});

	const geminiCooldown = providerDiagnostics?.gemini?.cooldown_seconds ?? 0;
	const providerLastError = providerDiagnostics?.gemini?.last_error || "";
	const activeProvider = providerDiagnostics?.active_provider || "unknown";
	const charCount = input.length;

	const sendMessage = async (overrideInput) => {
		const text = (overrideInput ?? input).trim();
		if (!text || isLoading || text.length > 2000) return;

		abortRef.current?.abort();
		abortRef.current = new AbortController();

		const userMsg = {
			id: uuidv4(),
			role: "user",
			content: text,
			timestamp: getTimestamp(),
		};

		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsLoading(true);

		try {
			const res = await fetch(`${API_URL}/chat`, {
				method: "POST",
				signal: abortRef.current.signal,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: text,
					session_id: sessionId,
					response_style: responseStyle,
					temperature: 0.35,
				}),
			});

			if (!res.ok) {
				if (res.status === 429) {
					toast.error("Rate limit hit. Please wait a bit.");
					throw new Error("RATE_LIMIT");
				}
				throw new Error("API request failed");
			}

			const data = await res.json();

			setNlpAnalysis({
				sentiment: data.sentiment,
				intent: data.intent,
				entities: data.entities,
			});
			setMemoryLength(data.memory_length);
			if (data.session_id && data.session_id !== sessionId) {
				setSessionId(data.session_id);
				sessionStorage.setItem("nova_session_id", data.session_id);
			}
			setFollowups(data.suggestions || data.followups || []);
			setRuntimeMode(data.runtime_mode || "local");

			try {
				const dbg = await fetch(`${API_URL}/debug/provider`);
				if (dbg.ok) {
					setProviderDiagnostics(await dbg.json());
				}
			} catch {
				// silent
			}

			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === userMsg.id ? { ...msg, entities: data.entities } : msg,
				),
			);

			const assistantMsg = {
				id: uuidv4(),
				role: "assistant",
				content: data.reply,
				timestamp: getTimestamp(),
			};
			setMessages((prev) => [...prev, assistantMsg]);
		} catch (err) {
			if (err?.name === "AbortError") return;
			if (String(err?.message || "") === "RATE_LIMIT") {
				setIsLoading(false);
				return;
			}
			console.error("Chat error:", err);
			setMessages((prev) => [
				...prev,
				{
					id: uuidv4(),
					role: "assistant",
					content: backendOnline
						? "Request failed. Check your connection and try again."
						: "Backend is offline. Start FastAPI using: uvicorn main:app --reload",
					timestamp: getTimestamp(),
				},
			]);
			toast.error("Request failed");
		} finally {
			setIsLoading(false);
		}
	};

	const clearMemory = async () => {
		try {
			await fetch(`${API_URL}/clear`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ session_id: sessionId }),
			});
		} catch (err) {
			console.error("Clear error:", err);
		}
		setMessages([]);
		setNlpAnalysis(null);
		setMemoryLength(0);
		setFollowups([]);
		const next = uuidv4();
		setSessionId(next);
		sessionStorage.setItem("nova_session_id", next);
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	useEffect(() => {
		return () => abortRef.current?.abort();
	}, []);

	useEffect(() => {
		if (!providerDiagnostics) return;
		const providerNow = providerDiagnostics?.active_provider || "unknown";
		if (prevProviderRef.current && prevProviderRef.current !== providerNow) {
			toast(`Switched to ${providerNow} fallback`, { icon: "⚡" });
		}
		prevProviderRef.current = providerNow;

		const cooldownNow = providerDiagnostics?.gemini?.cooldown_seconds ?? 0;
		if (cooldownNow > 0 && prevCooldownRef.current <= 0) {
			toast.error("Gemini rate limited — using fallback");
		}
		prevCooldownRef.current = cooldownNow;
	}, [providerDiagnostics]);

	useEffect(() => {
		const handler = (e) => {
			if (e.ctrlKey && e.key.toLowerCase() === "l") {
				e.preventDefault();
				clearMemory();
			}
			if (e.key === "Escape") {
				setNlpPanelOpen(false);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionId]);

	return (
		<div className="relative z-10 min-h-screen pt-20 flex">
			<div
				className={`flex-1 flex flex-col transition-all duration-300 ${
					nlpPanelOpen ? "lg:mr-[320px]" : ""
				}`}
			>
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					className="sticky top-20 z-20 mx-4 mb-2"
				>
					<div className="surface-strong rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
						<div>
							<h2 className="text-sm font-semibold">Conversation Workspace</h2>
							<p className="text-[11px] text-zinc-500">
								{backendOnline ? "Connected" : "Offline"} •{" "}
								{runtimeMode.toUpperCase()} mode
							</p>
						</div>

						<div className="flex items-center gap-2">
							<div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 border border-white/10 rounded-lg px-2 py-1">
								<Settings2 className="w-3.5 h-3.5" />
								<select
									value={responseStyle}
									onChange={(e) => setResponseStyle(e.target.value)}
									className="bg-transparent outline-none"
								>
									<option className="text-black" value="concise">
										Concise
									</option>
									<option className="text-black" value="balanced">
										Balanced
									</option>
									<option className="text-black" value="deep">
										Deep
									</option>
								</select>
							</div>

							<span className="text-[10px] font-mono text-zinc-500 border border-white/10 rounded-lg px-2 py-1">
								{memoryLength} msgs
							</span>
							<button
								onClick={clearMemory}
								className="w-8 h-8 rounded-lg surface flex items-center justify-center text-zinc-400 hover:text-white"
								title="Clear memory"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</div>
					{geminiCooldown > 0 && (
						<div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
							<span className="font-semibold">Provider cooldown:</span>{" "}
							{activeProvider.toUpperCase()} is rate-limited for ~
							{geminiCooldown}s. Responses may run in degraded mode.
						</div>
					)}
					{providerLastError && geminiCooldown === 0 && (
						<div className="mt-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
							<span className="font-semibold">Provider warning:</span>{" "}
							{providerLastError}
						</div>
					)}
				</motion.div>

				<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
					{messages.length === 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col items-center justify-center h-[48vh] text-center"
						>
							<h3 className="text-3xl font-semibold mb-3">Build with NOVA</h3>
							<p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
								Enterprise-style AI chat with real-time NLP signals, memory, and
								guided follow-up actions.
							</p>
							{!backendOnline && (
								<div className="mt-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
									<AlertCircle className="w-4 h-4" />
									<span>
										Run backend:{" "}
										<code className="font-mono">uvicorn main:app --reload</code>
									</span>
								</div>
							)}
							<div className="flex flex-wrap gap-2 mt-6 justify-center max-w-xl">
								{[
									"Design a scalable customer support chatbot architecture",
									"Explain transformer models in simple terms",
									"Create a 7-day AI learning roadmap",
								].map((suggestion) => (
									<button
										key={suggestion}
										onClick={() => {
											setInput(suggestion);
											inputRef.current?.focus();
										}}
										className="text-xs surface rounded-xl px-3 py-2 text-zinc-300 hover:text-white"
									>
										{suggestion}
									</button>
								))}
							</div>
						</motion.div>
					)}

					<AnimatePresence mode="popLayout">
						{messages.map((msg) => (
							<MessageBubble
								key={msg.id}
								message={msg}
								isUser={msg.role === "user"}
								entities={msg.entities}
							/>
						))}
					</AnimatePresence>

					<AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>

					{followups.length > 0 && !isLoading && (
						<div className="pt-2 flex flex-wrap gap-2">
							{followups.map((item) => (
								<button
									key={item}
									onClick={() => sendMessage(item)}
									className="text-xs border border-white/15 rounded-full px-3 py-1.5 text-zinc-300 hover:text-white hover:border-white/30"
								>
									{item}
								</button>
							))}
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="sticky bottom-0 px-4 pb-4 pt-2"
				>
					<div className="surface-strong rounded-2xl p-2 flex items-end gap-2">
						<textarea
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask anything..."
							rows={1}
							className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none px-4 py-3 rounded-xl focus:outline-none max-h-32"
							onInput={(e) => {
								e.target.style.height = "auto";
								e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
							}}
							disabled={isLoading}
						/>
						<button
							onClick={() => sendMessage()}
							disabled={!input.trim() || isLoading || input.length > 2000}
							className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
								input.trim() && !isLoading
									? "bg-white text-black hover:opacity-90"
									: "bg-zinc-800 text-zinc-600 cursor-not-allowed"
							}`}
						>
							<Send className="w-4 h-4" />
						</button>
					</div>
					<div
						className={`mt-1 text-right text-[11px] font-mono ${
							charCount > 1800 ? "text-red-400" : "text-zinc-500"
						}`}
					>
						{charCount} / 2000
					</div>
				</motion.div>
			</div>

			<NLPPanel
				analysis={nlpAnalysis}
				memoryLength={memoryLength}
				diagnostics={providerDiagnostics}
				isOpen={nlpPanelOpen}
				onToggle={() => setNlpPanelOpen((prev) => !prev)}
			/>
		</div>
	);
}
