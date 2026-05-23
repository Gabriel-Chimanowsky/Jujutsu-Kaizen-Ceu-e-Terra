import { useEffect, useRef } from 'react'

export default function CursedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    let animationFrameId
    let particles = []
    const maxParticles = 65

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    class Particle {
      constructor(x, y, color = null) {
        this.x = x || Math.random() * canvas.width
        this.y = y || Math.random() * canvas.height
        this.size = Math.random() * 4 + 1
        this.speedX = Math.random() * 0.8 - 0.4
        this.speedY = Math.random() * -1.2 - 0.3 // floats up
        this.opacity = Math.random() * 0.5 + 0.3
        this.life = Math.random() * 120 + 80
        this.customColor = color
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life--
        this.opacity = Math.max(0, this.opacity - 0.005)
        this.speedX += Math.sin(this.life * 0.05) * 0.03
      }

      draw() {
        const activeColor = this.customColor || getComputedStyle(document.documentElement).getPropertyValue('--cursed-color').trim() || '#8a2be2'
        ctx.save()
        ctx.shadowBlur = this.size * 3
        ctx.shadowColor = activeColor
        ctx.fillStyle = activeColor
        ctx.globalAlpha = this.opacity
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle())
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, idx) => {
        p.update()
        p.draw()
        if (p.life <= 0 || p.opacity <= 0) {
          particles[idx] = new Particle()
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    const handleMouseClick = (e) => {
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'A' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        for (let i = 0; i < 6; i++) {
          particles.push(new Particle(e.clientX, e.clientY))
          if (particles.length > maxParticles + 30) {
            particles.shift()
          }
        }
      }
    }
    window.addEventListener('click', handleMouseClick)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('click', handleMouseClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
