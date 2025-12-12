import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 3 + 1;
        this.density = (Math.random() * 30) + 1;
        this.color = `rgba(59, 130, 246, ${Math.random() * 0.3 + 0.1})`; // Blue-ish
      }

      update() {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxDistance = 200;
        
        // Fast follow/repel effect
        let force = (maxDistance - distance) / maxDistance;
        if (force < 0) force = 0;

        const directionX = forceDirectionX * force * this.density;
        const directionY = forceDirectionY * force * this.density;

        if (distance < maxDistance) {
            // Move away gently or follow - let's make them move slightly towards mouse for "follow" feel
            // but also keep some organic movement
            this.x += directionX * 0.5; 
            this.y += directionY * 0.5;
        } else {
            // Return to base position slowly
            if (this.x !== this.baseX) {
                const dx = this.x - this.baseX;
                this.x -= dx / 20;
            }
            if (this.y !== this.baseY) {
                const dy = this.y - this.baseY;
                this.y -= dy / 20;
            }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const numberOfParticles = (canvas.width * canvas.height) / 15000; // Responsive density
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.x;
      mouseY = e.y;
    };
    
    const handleMouseLeave = () => {
        mouseX = -1000;
        mouseY = -1000;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" />;
};

export default ParticleBackground;