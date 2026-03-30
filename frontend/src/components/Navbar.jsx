import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, MessageCircle, BookOpen } from "lucide-react";

export default function Navbar({ backendOnline }) {
	const location = useLocation();
	const navLinks = [
		{ to: "/", label: "Home", icon: Bot },
		{ to: "/chat", label: "Workspace", icon: MessageCircle },
		{ to: "/about", label: "Architecture", icon: BookOpen },
	];

	return (
		<motion.nav
			initial={{ y: -16, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
		>
			<div className="max-w-7xl mx-auto">
				<div className="surface-strong rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
					<Link to="/" className="flex items-center gap-2.5">
						<div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center">
							<Bot className="w-5 h-5" />
						</div>
						<div>
							<div className="text-sm tracking-[0.2em] uppercase text-zinc-400">
								NOVA
							</div>
							<div className="text-xs text-zinc-500">AI Copilot</div>
						</div>
					</Link>

					<div className="flex items-center gap-1">
						{navLinks.map(({ to, label, icon: Icon }) => {
							const isActive = location.pathname === to;
							return (
								<Link
									key={to}
									to={to}
									className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors ${
										isActive
											? "text-white"
											: "text-zinc-400 hover:text-zinc-200"
									}`}
								>
									{isActive && (
										<motion.div
											layoutId="nav-active"
											className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl"
										/>
									)}
									<Icon className="w-4 h-4 relative z-10" />
									<span className="relative z-10 hidden sm:inline">
										{label}
									</span>
								</Link>
							);
						})}
					</div>

					<div className="hidden sm:flex items-center gap-2 text-xs">
						<div
							className={`w-2 h-2 rounded-full ${
								backendOnline ? "bg-emerald-400" : "bg-red-400"
							}`}
						/>
						<span className="text-zinc-500">
							{backendOnline ? "API Online" : "API Offline"}
						</span>
					</div>
				</div>
			</div>
		</motion.nav>
	);
}
