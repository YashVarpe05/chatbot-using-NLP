import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SentimentGauge({ sentiment }) {
	const [animatedScore, setAnimatedScore] = useState(0);

	const compound = sentiment?.compound ?? 0;
	const label = sentiment?.label ?? "neutral";

	useEffect(() => {
		const timer = setTimeout(() => setAnimatedScore(compound), 100);
		return () => clearTimeout(timer);
	}, [compound]);

	// Map compound (-1 to 1) to angle (0 to 180)
	const angle = ((animatedScore + 1) / 2) * 180;

	// Color based on sentiment
	const getColor = () => {
		if (label === "positive") {
			return {
				stroke: "#ffffff",
				glow: "rgba(255,255,255,0.25)",
				text: "text-zinc-100",
			};
		}
		if (label === "negative") {
			return {
				stroke: "#a1a1aa",
				glow: "rgba(161,161,170,0.25)",
				text: "text-zinc-300",
			};
		}
		return {
			stroke: "#d4d4d8",
			glow: "rgba(212,212,216,0.25)",
			text: "text-zinc-200",
		};
	};

	const colors = getColor();

	// SVG arc calculation
	const radius = 60;
	const circumference = Math.PI * radius; // Half circle
	const progress = (animatedScore + 1) / 2; // 0 to 1
	const dashOffset = circumference * (1 - progress);

	return (
		<div className="flex flex-col items-center">
			{/* Gauge SVG */}
			<div className="relative w-36 h-20 mb-2">
				<svg
					viewBox="0 0 140 80"
					className="w-full h-full"
					style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
				>
					{/* Background arc */}
					<path
						d="M 10 70 A 60 60 0 0 1 130 70"
						fill="none"
						stroke="rgba(255,255,255,0.08)"
						strokeWidth="7"
						strokeLinecap="round"
					/>
					{/* Foreground arc */}
					<motion.path
						d="M 10 70 A 60 60 0 0 1 130 70"
						fill="none"
						stroke={colors.stroke}
						strokeWidth="7"
						strokeLinecap="round"
						strokeDasharray={circumference}
						initial={{ strokeDashoffset: circumference }}
						animate={{ strokeDashoffset: dashOffset }}
						transition={{ duration: 0.8, ease: "easeOut" }}
					/>
					{/* Tick marks */}
					{[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
						const a = Math.PI * (1 - t);
						const x1 = 70 + 52 * Math.cos(a);
						const y1 = 70 - 52 * Math.sin(a);
						const x2 = 70 + 47 * Math.cos(a);
						const y2 = 70 - 47 * Math.sin(a);
						return (
							<line
								key={i}
								x1={x1}
								y1={y1}
								x2={x2}
								y2={y2}
								stroke="rgba(255,255,255,0.15)"
								strokeWidth="1"
							/>
						);
					})}
				</svg>

				{/* Score display */}
				<div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
					<motion.span
						key={compound}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						className={`text-xl font-bold font-mono ${colors.text}`}
					>
						{compound > 0 ? "+" : ""}
						{compound.toFixed(2)}
					</motion.span>
				</div>
			</div>

			{/* Label */}
			<motion.div
				key={label}
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
					label === "positive"
						? "bg-white/10 text-zinc-100 border border-white/20"
						: label === "negative"
							? "bg-zinc-500/15 text-zinc-300 border border-zinc-500/20"
							: "bg-zinc-400/15 text-zinc-200 border border-zinc-400/20"
				}`}
			>
				{label}
			</motion.div>

			{/* Detail scores */}
			<div className="flex gap-3 mt-3 text-[10px] font-mono text-zinc-500">
				<span>pos: {(sentiment?.positive ?? 0).toFixed(2)}</span>
				<span>neu: {(sentiment?.neutral ?? 0).toFixed(2)}</span>
				<span>neg: {(sentiment?.negative ?? 0).toFixed(2)}</span>
			</div>
		</div>
	);
}
