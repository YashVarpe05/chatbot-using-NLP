import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Landing from './components/Landing'
import ChatPage from './components/ChatPage'
import AboutPage from './components/AboutPage'
import ParticleBackground from './components/ParticleBackground'

function App() {
  const [backendOnline, setBackendOnline] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health')
        if (res.ok) setBackendOnline(true)
        else setBackendOnline(false)
      } catch {
        setBackendOnline(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen animated-gradient relative">
      <ParticleBackground />
      <Navbar backendOnline={backendOnline} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<ChatPage backendOnline={backendOnline} />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  )
}

export default App
