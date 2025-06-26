// components/ParticlesBackground.jsx
import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine); // ✅ v2 compatible
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: true, zIndex: -1 },
        background: {
          color: { value: "#ffffff" }
        },
        particles: {
          number: { value: 50 },
          size: { value: 3 },
          move: { enable: true, speed: 1 },
          color: { value: "#3b82f6" },
          links: { enable: true, color: "#3b82f6" }
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
            onClick: { enable: true, mode: "push" }
          },
          modes: {
            repulse: { distance: 100 },
            push: { quantity: 4 }
          }
        }
      }}
    />
  );
};

export default ParticlesBackground;
