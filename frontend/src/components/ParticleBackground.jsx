import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.4
        this.speedY = (Math.random() - 0.5) * 0.4
        this.opacity = Math.random() * 0.5 + 0.1
        this.hue = Math.random() > 0.5 ? 271 : 187 // purple or cyan
        this.pulse = Math.random() * Math.PI * 2
        this.pulseSpeed = Math.random() * 0.02 + 0.005
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.pulse += this.pulseSpeed
        this.opacity = (Math.sin(this.pulse) * 0.3 + 0.3)
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, ${this.opacity})`
        ctx.fill()
        // Glow
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, ${this.opacity * 0.15})`
        ctx.fill()
      }
    }

    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000))
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    // Draw connections between nearby particles
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.12
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(124, 58, 237, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.update()
        p.draw()
      })
      drawConnections()
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}
