import { Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import ChatPage from "./components/ChatPage";
import AboutPage from "./components/AboutPage";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthModal from "./components/AuthModal";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
	const [backendOnline, setBackendOnline] = useState(false);
	const [authUser, setAuthUser] = useState(null);
	const [authModalOpen, setAuthModalOpen] = useState(false);
	const prevOnlineRef = useRef(null);
	const authRequestedRef = useRef(false);

	useEffect(() => {
		const checkHealth = async () => {
			if (document.visibilityState !== "visible") return;
			try {
				const res = await fetch(`${BASE_URL}/health`);
				if (res.ok) setBackendOnline(true);
				else setBackendOnline(false);
			} catch {
				setBackendOnline(false);
			}
		};
		checkHealth();
		const interval = setInterval(checkHealth, 15000);

		const handleVisibility = () => {
			if (document.visibilityState === "visible") checkHealth();
		};
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const response = await fetch(`${BASE_URL}/auth/me`, {
					credentials: "include",
				});
				if (!response.ok) {
					setAuthUser(null);
					return;
				}
				const data = await response.json();
				setAuthUser(data.user || null);
			} catch {
				setAuthUser(null);
			}
		};

		if (backendOnline && !authRequestedRef.current) {
			authRequestedRef.current = true;
			fetchCurrentUser();
		}
		if (!backendOnline) {
			authRequestedRef.current = false;
		}
	}, [backendOnline]);

	useEffect(() => {
		if (prevOnlineRef.current === null) {
			prevOnlineRef.current = backendOnline;
			return;
		}
		if (prevOnlineRef.current && !backendOnline) {
			toast.error("Backend connection lost");
		}
		if (!prevOnlineRef.current && backendOnline) {
			toast.success("Backend reconnected");
		}
		prevOnlineRef.current = backendOnline;
	}, [backendOnline]);

	return (
		<ErrorBoundary>
			<div className="min-h-screen relative bg-app text-zinc-100">
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: "rgba(15,15,30,0.9)",
							color: "#e2e8f0",
							border: "1px solid rgba(139,92,246,0.3)",
						},
					}}
				/>
				<Navbar
					backendOnline={backendOnline}
					authUser={authUser}
					onOpenAuth={() => setAuthModalOpen(true)}
				/>
				<AuthModal
					isOpen={authModalOpen}
					onClose={() => setAuthModalOpen(false)}
					onAuthSuccess={setAuthUser}
					baseUrl={BASE_URL}
				/>
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route
						path="/chat"
						element={<ChatPage backendOnline={backendOnline} />}
					/>
					<Route path="/about" element={<AboutPage />} />
				</Routes>
			</div>
		</ErrorBoundary>
	);
}

export default App;
