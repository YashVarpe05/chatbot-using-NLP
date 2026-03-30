import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
	ArrowRight,
	Bot,
	Brain,
	Database,
	Tags,
	BarChart3,
} from "lucide-react";

export default function Landing() {
	const features = [
		{
			icon: BarChart3,
			title: "Sentiment Intelligence",
			description: "Real-time emotional signal scoring for each user message.",
		},
		{
			icon: Brain,
			title: "Intent Classification",
			description:
				"Zero-shot intent detection for smarter routing and response behavior.",
		},
		{
			icon: Tags,
			title: "Entity Extraction",
			description:
				"Automatic detection of names, organizations, places, and timelines.",
		},
		{
			icon: Database,
			title: "Context Memory",
			description:
				"Conversation memory for continuity across multi-turn interactions.",
		},
	];

	return (
		<div className="relative z-10 min-h-screen pt-24 pb-20 px-4">
			<div className="max-w-6xl mx-auto">
				<motion.section
					initial={{ opacity: 0, y: 18 }}
					animate={{ opacity: 1, y: 0 }}
					className="surface-strong rounded-3xl p-8 sm:p-12 border border-white/10"
				>
					<div className="inline-flex items-center gap-2 text-xs text-zinc-400 border border-white/15 rounded-full px-3 py-1 mb-6">
						<Bot className="w-3.5 h-3.5" />
						<span>Enterprise Conversational AI</span>
					</div>

					<h1 className="text-4xl sm:text-6xl font-semibold tracking-tight mb-4">
						Minimal Design.
						<br />
						Maximum Intelligence.
					</h1>

					<p className="text-zinc-400 max-w-2xl leading-relaxed mb-8">
						NOVA is a production-style chatbot workspace with NLP observability,
						context memory, and guided follow-up actions—built to look clean,
						premium, and focused.
					</p>

					<div className="flex flex-wrap items-center gap-3">
						<Link
							to="/chat"
							className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition"
						>
							Open Workspace
							<ArrowRight className="w-4 h-4" />
						</Link>
						<Link
							to="/about"
							className="inline-flex items-center gap-2 border border-white/20 text-zinc-200 px-6 py-3 rounded-xl text-sm hover:bg-white/5 transition"
						>
							View Architecture
						</Link>
					</div>
				</motion.section>

				<motion.section
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
				>
					{features.map((feature) => (
						<div key={feature.title} className="surface rounded-2xl p-5">
							<div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-3">
								<feature.icon className="w-5 h-5" />
							</div>
							<h3 className="text-sm font-semibold mb-2">{feature.title}</h3>
							<p className="text-xs text-zinc-400 leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</motion.section>
			</div>
		</div>
	);
}
