import { motion } from "framer-motion";

const ENTITY_STYLES = {
	PERSON: {
		bg: "bg-zinc-700/40",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	ORG: {
		bg: "bg-zinc-800/70",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	GPE: {
		bg: "bg-zinc-700/40",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	LOC: {
		bg: "bg-zinc-700/40",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	DATE: {
		bg: "bg-zinc-800/70",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	TIME: {
		bg: "bg-zinc-800/70",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	MONEY: {
		bg: "bg-zinc-700/40",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	PRODUCT: {
		bg: "bg-zinc-800/70",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	EVENT: {
		bg: "bg-zinc-700/40",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
	NORP: {
		bg: "bg-zinc-700/40",
		border: "border-zinc-400/30",
		text: "text-zinc-100",
		dot: "bg-zinc-200",
	},
};

const DEFAULT_STYLE = {
	bg: "bg-zinc-800/70",
	border: "border-zinc-400/30",
	text: "text-zinc-100",
	dot: "bg-zinc-300",
};

export default function EntityChips({ entities = [], compact = false }) {
	if (entities.length === 0) {
		return (
			<div className="text-xs text-white/30 italic">No entities detected</div>
		);
	}

	return (
		<div className="flex flex-wrap gap-1.5">
			{entities.map((entity, i) => {
				const style = ENTITY_STYLES[entity.label] || DEFAULT_STYLE;
				return (
					<motion.span
						key={`${entity.text}-${i}`}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.05, duration: 0.2 }}
						className={`inline-flex items-center gap-1.5 ${
							compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
						} rounded-lg ${style.bg} border ${style.border} ${style.text} font-medium`}
					>
						<span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
						<span>{entity.text}</span>
						<span className="opacity-50 text-[9px] font-mono">
							{entity.label}
						</span>
					</motion.span>
				);
			})}
		</div>
	);
}
