import React from "react";

export default class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center p-6">
					<div className="surface-strong rounded-2xl p-8 text-center max-w-lg w-full">
						<h2 className="text-red-400 text-xl mb-2">Something went wrong</h2>
						<p className="text-zinc-400 text-sm mb-4">
							{this.state.error?.message || "Unexpected application error"}
						</p>
						<button
							onClick={() => window.location.reload()}
							className="border border-white/20 px-4 py-2 rounded text-sm hover:bg-white/5"
						>
							Reload NOVA
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
