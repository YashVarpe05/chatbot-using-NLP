import { motion, AnimatePresence } from "framer-motion";
import {
	BarChart3,
	Target,
	Tags,
	Database,
	Activity,
	ChevronRight,
	Eye,
	EyeOff,
} from "lucide-react";
import SentimentGauge from "./SentimentGauge";
import EntityChips from "./EntityChips";

export default function NLPPanel({
	analysis,
	memoryLength,
	diagnostics,
	isOpen,
	onToggle,
}) {
	const sentiment = analysis?.sentiment;
	const intent = analysis?.intent;
	const entities = analysis?.entities || [];
	const provider = diagnostics?.active_provider || "-";
	const cooldown = diagnostics?.gemini?.cooldown_seconds ?? 0;
	const activeSessions = diagnostics?.memory?.active_sessions ?? 0;

	return (
		<>
			<button
				onClick={onToggle}
				className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 surface-strong py-4 px-1.5 rounded-l-xl transition-all ${isOpen ? "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto" : ""}`}
				title="NLP Inspector"
			>
				<div className="flex flex-col items-center gap-2 text-zinc-300">
					{isOpen ? (
						<EyeOff className="w-4 h-4" />
					) : (
						<Eye className="w-4 h-4" />
					)}
					<span className="text-[9px] font-mono [writing-mode:vertical-lr] tracking-widest">
						NLP
					</span>
				</div>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ x: 350, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 350, opacity: 0 }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="fixed right-0 top-0 bottom-0 w-[320px] z-30 pt-20 pb-4 px-3 overflow-y-auto"
					>
						<div className="surface-strong rounded-2xl p-4 h-full flex flex-col gap-4 overflow-y-auto">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
										<BarChart3 className="w-4 h-4" />
									</div>
									<div>
										<h3 className="text-sm font-semibold">NLP Inspector</h3>
										<p className="text-[10px] text-zinc-500">
											Real-time analysis
										</p>
									</div>
								</div>
								<button
									onClick={onToggle}
									className="w-7 h-7 rounded-lg surface flex items-center justify-center text-zinc-300"
								>
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>

							<div className="h-px bg-white/10" />

							<div className="space-y-3">
								<div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
									<Target className="w-4 h-4" />
									<span>Sentiment</span>
								</div>
								{sentiment ? (
									<SentimentGauge sentiment={sentiment} />
								) : (
									<div className="text-center py-4 text-zinc-500 text-xs">
										Send a message to analyze
									</div>
								)}
							</div>

							<div className="h-px bg-white/10" />

							<div className="space-y-3">
								<div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
									<Target className="w-4 h-4" />
									<span>Intent</span>
								</div>
								{intent ? (
									<div className="space-y-2">
										<div className="text-sm font-semibold capitalize text-zinc-100">
											{intent.top_intent}
										</div>
										<div className="text-[10px] text-zinc-500 font-mono">
											confidence: {(intent.confidence * 100).toFixed(1)}%
										</div>
										<div className="space-y-1.5 mt-2">
											{intent.all_intents &&
												Object.entries(intent.all_intents)
													.sort(([, a], [, b]) => b - a)
													.slice(0, 5)
													.map(([label, score]) => (
														<div
															key={label}
															className="flex items-center gap-2"
														>
															<span className="text-[10px] text-zinc-500 w-16 truncate capitalize">
																{label}
															</span>
															<div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
																<motion.div
																	initial={{ width: 0 }}
																	animate={{ width: `${score * 100}%` }}
																	transition={{ duration: 0.4 }}
																	className="h-full rounded-full bg-white"
																/>
															</div>
															<span className="text-[10px] text-zinc-500 font-mono w-10 text-right">
																{(score * 100).toFixed(0)}%
															</span>
														</div>
													))}
										</div>
									</div>
								) : (
									<div className="text-center py-2 text-zinc-500 text-xs">
										Waiting for input...
									</div>
								)}
							</div>

							<div className="h-px bg-white/10" />
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
									<Activity className="w-4 h-4" />
									<span>Runtime</span>
								</div>
								<div className="text-[11px] text-zinc-300 space-y-1">
									<div>
										Provider:{" "}
										<span className="text-zinc-100 font-mono">{provider}</span>
									</div>
									<div>
										Active sessions:{" "}
										<span className="text-zinc-100 font-mono">
											{activeSessions}
										</span>
									</div>
									{cooldown > 0 && (
										<div className="text-amber-300">
											Gemini cooldown:{" "}
											<span className="font-mono">{cooldown}s</span>
										</div>
									)}
								</div>
							</div>

							<div className="h-px bg-white/10" />
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
									<Tags className="w-4 h-4" />
									<span>Entities</span>
								</div>
								<EntityChips entities={entities} />
							</div>

							<div className="h-px bg-white/10" />
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
									<Database className="w-4 h-4" />
									<span>Memory</span>
								</div>
								<div className="flex justify-between mb-1 text-[10px] text-zinc-500 font-mono">
									<span>{memoryLength}/20 msgs</span>
									<span>
										{Math.min(10, Math.ceil(memoryLength / 2))}/10 turns
									</span>
								</div>
								<div className="h-2 rounded-full bg-white/10 overflow-hidden">
									<motion.div
										initial={{ width: 0 }}
										animate={{
											width: `${Math.min(100, (memoryLength / 20) * 100)}%`,
										}}
										transition={{ duration: 0.5 }}
										className="h-full rounded-full bg-white"
									/>
								</div>
							</div>

							<div className="mt-auto pt-2 border-t border-white/10 text-[10px] text-zinc-500 font-mono">
								Pipeline: VADER + BART + spaCy
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
