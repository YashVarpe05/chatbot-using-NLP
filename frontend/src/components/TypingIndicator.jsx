import { motion } from "framer-motion";

export default function TypingIndicator() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="flex items-center gap-3"
		>
			<div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
				<svg
					className="w-4 h-4 text-white"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" />
				</svg>
			</div>
			<div className="assistant-bubble rounded-2xl rounded-tl-md px-5 py-3 flex items-center gap-1.5">
				<div className="typing-dot w-2 h-2 rounded-full bg-zinc-200" />
				<div className="typing-dot w-2 h-2 rounded-full bg-zinc-200" />
				<div className="typing-dot w-2 h-2 rounded-full bg-zinc-200" />
			</div>
		</motion.div>
	);
}
