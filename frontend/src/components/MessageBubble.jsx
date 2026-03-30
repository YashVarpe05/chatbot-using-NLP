import { motion } from "framer-motion";
import { Copy, Check, User, Bot } from "lucide-react";
import { useState } from "react";
import EntityChips from "./EntityChips";
import MessageRenderer from "./MessageRenderer";

export default function MessageBubble({ message, isUser, entities = [] }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(message.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 15, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.35, ease: "easeOut" }}
			className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}
		>
			{/* Avatar (assistant only) */}
			{!isUser && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
					className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center mt-1"
				>
					<Bot className="w-4 h-4 text-white" />
				</motion.div>
			)}

			{/* Bubble */}
			<div className="relative max-w-[75%] sm:max-w-[65%]">
				<div
					className={`rounded-2xl px-4 py-3 text-sm leading-relaxed message-content ${
						isUser
							? "user-bubble rounded-tr-md"
							: "assistant-bubble rounded-tl-md"
					}`}
				>
					<MessageRenderer content={message.content} />

					{/* Entity chips inline for user messages */}
					{isUser && entities.length > 0 && (
						<div className="mt-2 pt-2 border-t border-white/10">
							<EntityChips entities={entities} compact />
						</div>
					)}
				</div>

				{/* Copy button on hover */}
				<motion.button
					initial={{ opacity: 0 }}
					whileHover={{ scale: 1.1 }}
					onClick={handleCopy}
					className={`absolute top-2 ${isUser ? "left-0 -translate-x-10" : "right-0 translate-x-10"} 
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            w-7 h-7 rounded-lg surface flex items-center justify-center text-zinc-400 hover:text-white`}
					title="Copy message"
				>
					{copied ? (
						<Check className="w-3.5 h-3.5 text-emerald-400" />
					) : (
						<Copy className="w-3.5 h-3.5" />
					)}
				</motion.button>

				{/* Timestamp */}
				<div
					className={`text-[10px] text-zinc-500 mt-1 font-mono ${isUser ? "text-right" : "text-left"}`}
				>
					{message.timestamp}
				</div>
			</div>

			{/* Avatar (user only) */}
			{isUser && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
					className="flex-shrink-0 w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center mt-1"
				>
					<User className="w-4 h-4 text-black" />
				</motion.div>
			)}
		</motion.div>
	);
}
