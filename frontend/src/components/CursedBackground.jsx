import { useEffect, useRef } from 'react'

export default function CursedBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationFrameId
    let particles = []

    // Fewer particles on mobile for performance
    const isMobile = window.innerWidth <= 768
    const maxParticles = isMobile ? 35 : 70
    // Connection distance threshold
    const connectionDist = isMobile ? 80 : 130
    // Mouse repel radius
    const repelRadius = 90
    const repelStrength = 1.8

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    class Particle {
      constructor(x, y, color = null) {
        this.x = x !== undefined ? x : Math.random() * canvas.width
        this.y = y !== undefined ? y : Math.random() * canvas.height
        // Varied sizes for depth
        this.size = Math.random() < 0.2
          ? Math.random() * 3 + 2.5   // larger "foreground" particles (20%)
          : Math.random() * 2 + 0.5   // small "background" particles (80%)
        this.baseSpeedX = Math.random() * 0.6 - 0.3
        this.baseSpeedY = Math.random() * -0.9 - 0.15 // mostly float upward
        this.speedX = this.baseSpeedX
        this.speedY = this.baseSpeedY
        this.opacity = Math.random() * 0.45 + 0.2
        this.maxOpacity = this.opacity
        this.life = Math.random() * 140 + 80
        this.maxLife = this.life
        this.customColor = color
      }

      update() {
        // Mouse repel effect
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        const dx = this.x - mx
        const dy = this.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < repelRadius && dist > 0) {
          const force = (repelRadius - dist) / repelRadius
          this.speedX += (dx / dist) * force * repelStrength * 0.02
          this.speedY += (dy / dist) * force * repelStrength * 0.02
        }

        // Dampen speed back toward base
        this.speedX += (this.baseSpeedX - this.speedX) * 0.04
        this.speedY += (this.baseSpeedY - this.speedY) * 0.04

        // Soft sinusoidal drift for organic feel
        this.speedX += Math.sin(this.life * 0.04) * 0.012

        this.x += this.speedX
        this.y += this.speedY
        this.life--

        // Fade in early life, fade out late life
        const lifeRatio = this.life / this.maxLife
        if (lifeRatio > 0.85) {
          // Fade in
          this.opacity = this.maxOpacity * ((1 - lifeRatio) / 0.15)
        } else if (lifeRatio < 0.25) {
          // Fade out
          this.opacity = this.maxOpacity * (lifeRatio / 0.25)
        } else {
          this.opacity = this.maxOpacity
        }
      }

      draw() {
        const activeColor = this.customColor
          || getComputedStyle(document.documentElement).getPropertyValue('--cursed-color').trim()
          || '#8a2be2'

        ctx.save()
        ctx.shadowBlur = this.size * 4
        ctx.shadowColor = activeColor
        ctx.fillStyle = activeColor
        ctx.globalAlpha = Math.max(0, this.opacity)
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle())
    }

    const drawConnections = () => {
      const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--cursed-color').trim() || '#8a2be2'

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pa = particles[i]
          const pb = particles[j]
          const dx = pa.x - pb.x
          const dy = pa.y - pb.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.12 * Math.min(pa.opacity, pb.opacity) * 3
            if (alpha <= 0.005) continue
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.strokeStyle = activeColor
            ctx.lineWidth = 0.6
            ctx.shadowBlur = 4
            ctx.shadowColor = activeColor
            ctx.beginPath()
            ctx.moveTo(pa.x, pa.y)
            ctx.lineTo(pb.x, pb.y)
            ctx.stroke()
            ctx.restore()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections first (underneath particles)
      if (!isMobile) {
        drawConnections()
      }

      particles.forEach((p, idx) => {
        p.update()
        p.draw()
        if (p.life <= 0) {
          particles[idx] = new Particle()
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    const handleMouseClick = (e) => {
      const tag = e.target.tagName
      if (tag !== 'BUTTON' && tag !== 'SELECT' && tag !== 'A' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        const burstCount = isMobile ? 4 : 8
        for (let i = 0; i < burstCount; i++) {
          particles.push(new Particle(e.clientX, e.clientY))
        }
        // Keep total under control
        while (particles.length > maxParticles + 40) {
          particles.shift()
        }
      }
    }
    window.addEventListener('click', handleMouseClick)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('click', handleMouseClick)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
