import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function CopyButton({ text }) {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<button
			onClick={copy}
			className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800/80 transition-all duration-200"
		>
			{copied ? "Copied!" : "Copy"}
		</button>
	);
}

export default function MessageRenderer({ content }) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				code({ inline, className, children }) {
					const lang = /language-(\w+)/.exec(className || "")?.[1];
					const code = String(children).replace(/\n$/, "");
					if (inline) {
						return (
							<code className="bg-zinc-900/60 px-1 rounded text-zinc-200 text-sm">
								{code}
							</code>
						);
					}
					return (
						<div className="relative my-3 group">
							<div className="opacity-0 group-hover:opacity-100 transition-opacity">
								<CopyButton text={code} />
							</div>
							<SyntaxHighlighter
								language={lang || "text"}
								style={oneDark}
								customStyle={{
									borderRadius: "8px",
									fontSize: "13px",
									border: "1px solid rgba(255,255,255,0.12)",
								}}
							>
								{code}
							</SyntaxHighlighter>
						</div>
					);
				},
				p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
				ul: ({ children }) => (
					<ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
				),
				ol: ({ children }) => (
					<ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
				),
				h1: ({ children }) => (
					<h1 className="text-lg font-bold mb-2 text-zinc-100">{children}</h1>
				),
				h2: ({ children }) => (
					<h2 className="text-base font-bold mb-2 text-zinc-100">{children}</h2>
				),
				h3: ({ children }) => (
					<h3 className="text-sm font-bold mb-1 text-zinc-100">{children}</h3>
				),
			}}
		>
			{content}
		</ReactMarkdown>
	);
}
