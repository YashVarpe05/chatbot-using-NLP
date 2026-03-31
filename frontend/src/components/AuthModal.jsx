import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound, Mail, Lock, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AuthModal({ isOpen, onClose, onAuthSuccess, baseUrl }) {
	const [mode, setMode] = useState("login");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (isSubmitting) return;
		setIsSubmitting(true);

		try {
			const endpoint = mode === "login" ? "login" : "register";
			const payload =
				mode === "login"
					? { email: email.trim(), password }
					: { name: name.trim(), email: email.trim(), password };

			const response = await fetch(`${baseUrl}/auth/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(payload),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.detail || "Authentication failed");
			}

			onAuthSuccess(data.user);
			toast.success(mode === "login" ? "Logged in" : "Account created");
			setPassword("");
			onClose();
		} catch (error) {
			toast.error(String(error?.message || "Authentication failed"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					id="auth-modal-overlay"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm px-4 flex items-center justify-center"
					onClick={onClose}
				>
					<motion.div
						id="auth-modal-card"
						initial={{ opacity: 0, y: 24, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.97 }}
						transition={{ duration: 0.22, ease: "easeOut" }}
						className="surface-strong w-full max-w-md rounded-2xl p-5"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-lg font-semibold">
									{mode === "login" ? "Welcome back" : "Create account"}
								</h3>
								<p className="text-xs text-zinc-500 mt-1">
									{mode === "login"
										? "Sign in to sync sessions with your account"
										: "Register to persist your NOVA workspace"}
								</p>
							</div>
							<button
								id="auth-modal-close-button"
								type="button"
								onClick={onClose}
								className="w-9 h-9 rounded-lg surface flex items-center justify-center text-zinc-400 hover:text-white"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="mb-4 flex items-center gap-2 surface rounded-xl p-1">
							<button
								id="auth-modal-login-tab"
								type="button"
								onClick={() => setMode("login")}
								className={`flex-1 text-xs rounded-lg px-3 py-2 transition-colors ${
									mode === "login"
										? "bg-white text-black"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
							>
								Login
							</button>
							<button
								id="auth-modal-register-tab"
								type="button"
								onClick={() => setMode("register")}
								className={`flex-1 text-xs rounded-lg px-3 py-2 transition-colors ${
									mode === "register"
										? "bg-white text-black"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
							>
								Register
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-3">
							{mode === "register" && (
								<label className="block">
									<span className="text-xs text-zinc-500 mb-1 block">Name</span>
									<div className="surface rounded-xl px-3 py-2 flex items-center gap-2">
										<UserRound className="w-4 h-4 text-zinc-500" />
										<input
											id="auth-modal-name-input"
											type="text"
											value={name}
											onChange={(event) => setName(event.target.value)}
											placeholder="Your name"
											className="bg-transparent w-full text-sm text-zinc-100 placeholder-zinc-600 outline-none"
											required={mode === "register"}
										/>
									</div>
								</label>
							)}

							<label className="block">
								<span className="text-xs text-zinc-500 mb-1 block">Email</span>
								<div className="surface rounded-xl px-3 py-2 flex items-center gap-2">
									<Mail className="w-4 h-4 text-zinc-500" />
									<input
										id="auth-modal-email-input"
										type="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="you@example.com"
										className="bg-transparent w-full text-sm text-zinc-100 placeholder-zinc-600 outline-none"
										required
									/>
								</div>
							</label>

							<label className="block">
								<span className="text-xs text-zinc-500 mb-1 block">
									Password
								</span>
								<div className="surface rounded-xl px-3 py-2 flex items-center gap-2">
									<Lock className="w-4 h-4 text-zinc-500" />
									<input
										id="auth-modal-password-input"
										type="password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										placeholder="Minimum 6 characters"
										className="bg-transparent w-full text-sm text-zinc-100 placeholder-zinc-600 outline-none"
										required
									/>
								</div>
							</label>

							<button
								id="auth-modal-submit-button"
								type="submit"
								disabled={isSubmitting}
								className={`w-full mt-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
									isSubmitting
										? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
										: "bg-white text-black hover:opacity-90"
								}`}
							>
								{isSubmitting
									? "Please wait..."
									: mode === "login"
										? "Sign in"
										: "Create account"}
							</button>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
