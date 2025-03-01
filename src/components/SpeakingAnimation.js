import React, { useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import gsap from 'gsap';

export const useSpeakingAnimation = (meshRef, isSpeaking = false, intensity = 1.0) => {
  const animationRef = useRef(null);
  const originalVerticesRef = useRef(null);
  const gsapAnimationRef = useRef(null);

  // Mouth animation effect
  useEffect(() => {
    if (!meshRef.current) return;

    // Store original vertices on first load
    if (!originalVerticesRef.current) {
      const geometry = meshRef.current.geometry;
      originalVerticesRef.current = geometry.attributes.position.array.slice();
    }

    const animate = () => {
      if (!meshRef.current || !isSpeaking) return;

      const geometry = meshRef.current.geometry;
      const positions = geometry.attributes.position.array;
      const originalPositions = originalVerticesRef.current;

      // Only animate vertices in the mouth area (approximate y-coordinate range)
      for (let i = 0; i < positions.length; i += 3) {
        const y = originalPositions[i + 1];
        // Check if vertex is in mouth area (adjust these values based on your model)
        if (y > -0.2 && y < 0.2) {
          // Apply sinusoidal movement for natural mouth animation
          const time = Date.now() * 0.005;
          const displacement = Math.sin(time) * 0.1 * intensity;
          positions[i + 2] = originalPositions[i + 2] + displacement;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isSpeaking) {
      animate();
    }

    // Store the current mesh reference for cleanup
    const currentMesh = meshRef.current;
    const originalPositions = originalVerticesRef.current;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Reset vertices to original positions when unmounting or stopping speech
      if (currentMesh && originalPositions) {
        const geometry = currentMesh.geometry;
        geometry.attributes.position.array.set(originalPositions);
        geometry.attributes.position.needsUpdate = true;
      }
    };
  }, [meshRef, isSpeaking, intensity]);

  // Position animation effect
  useEffect(() => {
    if (!meshRef.current) return;
    
    const currentMesh = meshRef.current;
    const animation = gsap.to(currentMesh.position, {
      y: '+=0.1',
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut',
      paused: !isSpeaking
    });

    gsapAnimationRef.current = animation;

    return () => {
      if (gsapAnimationRef.current) {
        gsapAnimationRef.current.kill();
      }
    };
  }, [meshRef, isSpeaking]);
};

export const SpeechBubble = ({ position, message }) => {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <Html position={[0.6, 0, 0]} style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '10px',
        maxWidth: '200px'
      }}>
        <div>{message}</div>
      </Html>
    </group>
  );
};

// Helper function to convert text to speech (if needed)
export const speakText = async (text) => {
  if (!window.speechSynthesis) return;
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = resolve;
    speechSynthesis.speak(utterance);
  });
};