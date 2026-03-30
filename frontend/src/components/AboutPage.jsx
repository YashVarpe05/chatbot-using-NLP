import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Cpu, BarChart3, Brain, Tags, Database } from "lucide-react";

const blocks = [
	{
		icon: BarChart3,
		title: "Sentiment Analysis",
		detail:
			"VADER scores each message from -1 to +1 so the assistant can adapt tone and urgency.",
	},
	{
		icon: Brain,
		title: "Intent Detection",
		detail:
			"BART-MNLI classifies intent labels like question, request, command, or greeting.",
	},
	{
		icon: Tags,
		title: "Entity Recognition",
		detail:
			"spaCy identifies names, organizations, places, and dates with structured metadata.",
	},
	{
		icon: Database,
		title: "Context Memory",
		detail:
			"Session memory stores recent turns so follow-up questions stay coherent and contextual.",
	},
];

export default function AboutPage() {
	return (
		<div className="relative z-10 min-h-screen pt-24 pb-16 px-4">
			<div className="max-w-5xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<Link
						to="/chat"
						className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 mb-6"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Workspace
					</Link>

					<div className="surface-strong rounded-3xl p-8 border border-white/10 mb-6">
						<div className="inline-flex items-center gap-2 text-xs text-zinc-400 border border-white/15 rounded-full px-3 py-1 mb-4">
							<Cpu className="w-3.5 h-3.5" />
							<span>System Architecture</span>
						</div>
						<h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
							How NOVA Works
						</h1>
						<p className="text-zinc-400 max-w-2xl leading-relaxed">
							NOVA combines NLP analysis, memory, and LLM reasoning in one
							runtime pipeline. Each user message is analyzed first, then sent
							through a response engine with style controls and fallback
							behavior.
						</p>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 14 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="grid grid-cols-1 sm:grid-cols-2 gap-4"
				>
					{blocks.map((block) => (
						<div key={block.title} className="surface rounded-2xl p-5">
							<div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-3">
								<block.icon className="w-5 h-5" />
							</div>
							<h3 className="text-sm font-semibold mb-2">{block.title}</h3>
							<p className="text-xs text-zinc-400 leading-relaxed">
								{block.detail}
							</p>
						</div>
					))}
				</motion.div>

				<div className="mt-6 surface rounded-2xl p-5 text-xs text-zinc-400 font-mono">
					Pipeline: input → sentiment + intent + entities → memory context →
					response generation
				</div>
			</div>
		</div>
	);
}
