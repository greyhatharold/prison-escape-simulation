import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls, Html } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper';
import { useSpeakingAnimation, SpeechBubble } from './SpeakingAnimation';
import { useVoiceRecognition, useClaudeConversation } from './VoiceInteraction';
import './ConsciousnessVisualizer.css';

const HeadModel = React.forwardRef(({ learnings, memories }, ref) => {
  const groupRef = useRef();
  const headRef = useRef();
  const wireframeRef = useRef();
  const edgesRef = useRef();
  const vnhRef = useRef();
  const vthRef = useRef();
  const gridHelperRef = useRef();
  const polarGridHelperRef = useRef();
  const [loadingError, setLoadingError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  // Add speaking animation hook
  useSpeakingAnimation(headRef, isSpeaking, 1.0);

  // Function to handle speaking
  const handleSpeak = useCallback(async (message) => {
    setCurrentMessage(message);
    setIsSpeaking(true);
    // Keep the message visible for 3 seconds
    setTimeout(() => {
      setIsSpeaking(false);
      setCurrentMessage('');
    }, 3000); // Increased from 100ms to 3000ms
  }, []);

  // Expose speak function to parent
  useEffect(() => {
    if (ref) {
      ref.current = { speak: handleSpeak };
    }
  }, [ref, handleSpeak]);

  useEffect(() => {
    if (!groupRef.current) return;

    // Create grid helpers
    const gridHelper = new THREE.GridHelper(400, 40, 0x0000ff, 0x808080);
    gridHelper.position.y = -150;
    gridHelper.position.x = -150;
    gridHelperRef.current = gridHelper;
    groupRef.current.add(gridHelper);

    const polarGridHelper = new THREE.PolarGridHelper(200, 16, 8, 64, 0x0000ff, 0x808080);
    polarGridHelper.position.y = -150;
    polarGridHelper.position.x = 200;
    polarGridHelperRef.current = polarGridHelper;
    groupRef.current.add(polarGridHelper);

    // Create scene
    const scene = groupRef.current;
    
    // Load head model
    const loader = new GLTFLoader();
    const modelPath = './models/gltf/LeePerrySmith/LeePerrySmith.glb';
    
    console.log('Loading model from:', modelPath);
    
    loader.load(modelPath, 
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        
        const mesh = gltf.scene.children[0];
        if (!mesh) {
          const error = 'No mesh found in model';
          console.error(error);
          setLoadingError(error);
          return;
        }

        try {
          mesh.geometry.computeTangents(); // generates bad data due to degenerate UVs
        } catch (err) {
          console.warn('Error computing tangents:', err);
          // Don't fail on tangent computation error
        }

        const group = new THREE.Group();
        group.scale.multiplyScalar(50);
        scene.add(group);

        // Create a container for all model instances
        const modelContainer = new THREE.Group();
        modelContainer.rotation.y = 0; // Reset rotation
        group.add(modelContainer);

        // Add main mesh (left head)
        modelContainer.add(mesh);
        headRef.current = mesh;
        mesh.position.set(-4, 0, 0);
        mesh.material.wireframe = true;
        mesh.material.opacity = 0.25;
        mesh.material.transparent = true;

        // Create middle head with multiple color layers
        const createColorLayer = (color, opacity, zOffset, scale) => {
          const layerMesh = mesh.clone();
          layerMesh.material = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: color,
            opacity: opacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: true
          });
          layerMesh.position.set(0, 0, zOffset);
          layerMesh.scale.multiplyScalar(scale);
          layerMesh.visible = true;
          return layerMesh;
        };

        // Create multiple layers with different colors
        const middleHeadLayers = [
          createColorLayer(0xff0000, 0.7, 0.5, 1.02),    // Red layer
          createColorLayer(0x00ffff, 0.3, 0.3, 1.015),   // Cyan layer
          createColorLayer(0xff00ff, 0.2, 0.1, 1.01),    // Magenta layer
          createColorLayer(0xffff00, 0.15, 0, 1.005)     // Yellow layer
        ];

        // Add all layers to the container
        middleHeadLayers.forEach(layer => modelContainer.add(layer));

        // Add vertex normal helpers to the main (red) layer
        const middleVnhRed = new VertexNormalsHelper(middleHeadLayers[0], 4, 0xff0000, 0.6);
        const middleVnhCyan = new VertexNormalsHelper(middleHeadLayers[0], 4, 0x00ffff, 0.6);
        middleVnhRed.visible = true;
        middleVnhCyan.visible = true;
        modelContainer.add(middleVnhRed);
        modelContainer.add(middleVnhCyan);

        // Create right head (clone of original)
        const rightMesh = mesh.clone();
        rightMesh.position.set(4, 0, 0);
        rightMesh.material.wireframe = true;
        rightMesh.material.opacity = 0.25;
        rightMesh.material.transparent = true;
        modelContainer.add(rightMesh);
        
        // Rotate the meshes to face forward
        mesh.rotation.y = 0;
        mesh.rotation.x = 0;
        mesh.rotation.z = 0;
        middleHeadLayers.forEach(layer => layer.rotation.copy(mesh.rotation));

        // Update vertex normal helpers in animation frame
        const updateHelpers = () => {
          middleVnhRed.update();
          middleVnhCyan.update();
          requestAnimationFrame(updateHelpers);
        };
        updateHelpers();

        // Remove old helpers and wireframes since we're using direct wireframe materials
        if (vnhRef.current) vnhRef.current.parent?.remove(vnhRef.current);
        if (vthRef.current) vthRef.current.parent?.remove(vthRef.current);
        if (wireframeRef.current) wireframeRef.current.parent?.remove(wireframeRef.current);
        if (edgesRef.current) edgesRef.current.parent?.remove(edgesRef.current);

        // Add box helpers for group
        scene.add(new THREE.BoxHelper(group));

        // Update world matrix to ensure proper positioning
        group.updateMatrixWorld(true);
        modelContainer.updateMatrixWorld(true);

        // Position camera to look at the model
        const camera = scene.parent?.camera;
        if (camera) {
          camera.position.set(0, 0, 200);
          camera.lookAt(0, 0, 0);
        }
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        const errorMessage = `Error loading model: ${error.message}`;
        console.error(errorMessage);
        setLoadingError(errorMessage);
        
        // Create a simple fallback geometry if model fails to load
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          roughness: 0.7,
          metalness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        const group = new THREE.Group();
        group.scale.multiplyScalar(50);
        scene.add(group);
        group.add(mesh);
        
        // Create wireframe for fallback
        const wireframe = new THREE.WireframeGeometry(geometry);
        let line = new THREE.LineSegments(wireframe);
        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;
        line.position.x = 4;
        group.add(line);
        
        // Create edges for fallback
        const edges = new THREE.EdgesGeometry(geometry);
        line = new THREE.LineSegments(edges);
        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;
        line.position.x = -4;
        group.add(line);
      }
    );

    // Store refs for cleanup
    const currentGroup = groupRef.current;
    const currentWireframe = wireframeRef.current;
    const currentEdges = edgesRef.current;
    const currentVnh = vnhRef.current;
    const currentVth = vthRef.current;
    const currentGridHelper = gridHelperRef.current;
    const currentPolarGridHelper = polarGridHelperRef.current;

    return () => {
      if (headRef.current) {
        headRef.current.geometry.dispose();
        headRef.current.material.dispose();
      }
      if (currentWireframe) {
        currentWireframe.geometry.dispose();
        currentWireframe.material.dispose();
      }
      if (currentEdges) {
        currentEdges.geometry.dispose();
        currentEdges.material.dispose();
      }
      if (currentVnh) {
        currentVnh.geometry.dispose();
        currentVnh.material.dispose();
      }
      if (currentVth) {
        currentVth.geometry.dispose();
        currentVth.material.dispose();
      }
      if (currentGridHelper) {
        currentGridHelper.geometry.dispose();
        currentGridHelper.material.dispose();
      }
      if (currentPolarGridHelper) {
        currentPolarGridHelper.geometry.dispose();
        currentPolarGridHelper.material.dispose();
      }
      if (currentGroup) {
        currentGroup.remove(currentWireframe, currentEdges, currentVnh, currentGridHelper, currentPolarGridHelper);
      }
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const time = -state.clock.elapsedTime * 0.0003;
      
      // Rotate camera around the scene, maintaining front view
      state.camera.position.x = 100 * Math.cos(time);
      state.camera.position.y = 0;
      state.camera.position.z = 800 + (50 * Math.sin(time));
      state.camera.lookAt(0, 0, 0);

      // Update vertex helpers
      if (vnhRef.current) vnhRef.current.update();
      if (vthRef.current) vthRef.current.update();
    }
  });

  return (
    <>
      <group ref={groupRef} />
      {loadingError && (
        <Html position={[0, 0, 0]}>
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            color: 'red',
            background: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px'
          }}>
            Error loading model: {loadingError}
          </div>
        </Html>
      )}
      {currentMessage && (
        <SpeechBubble 
          position={[0, 2, 0]} 
          message={currentMessage}
        />
      )}
    </>
  );
});

// Memory management utilities
const MEMORIES_PER_PAGE = 5;
const MAX_ACTIVE_MEMORIES = 15;

const chunkMemories = (memories) => {
  if (!Array.isArray(memories)) return [];
  return memories.reduce((chunks, memory, index) => {
    const chunkIndex = Math.floor(index / MEMORIES_PER_PAGE);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    chunks[chunkIndex].push(memory);
    return chunks;
  }, []);
};

// Memory rendering components
const MemoryValue = ({ value }) => {
  if (value === null || value === undefined) {
    return <span className="memory-value-empty">Not available</span>;
  }

  if (typeof value === 'object') {
    try {
      const stringified = JSON.stringify(value, null, 2);
      return (
        <pre className="memory-value-object">
          {stringified}
        </pre>
      );
    } catch (error) {
      console.error('Error stringifying value:', error);
      return <span className="memory-value-error">Error displaying value</span>;
    }
  }

  return <span className="memory-value">{String(value)}</span>;
};

const MemoryItem = ({ memory }) => {
  if (!memory || typeof memory !== 'object') {
    return null;
  }

  return (
    <div className="memory-item">
      <div className="memory-field">
        <span className="memory-label">Day:</span>
        <MemoryValue value={memory.day} />
      </div>
      {memory.event && (
        <div className="memory-field">
          <span className="memory-label">Event:</span>
          <MemoryValue value={memory.event} />
        </div>
      )}
      <div className="memory-field">
        <span className="memory-label">Insight:</span>
        <MemoryValue value={memory.insight} />
      </div>
      {memory.context && (
        <div className="memory-field">
          <span className="memory-label">Context:</span>
          <MemoryValue value={memory.context} />
        </div>
      )}
    </div>
  );
};

const PaginatedMemoryList = ({ memories, className }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [memoryChunks, setMemoryChunks] = useState([]);
  
  useEffect(() => {
    if (Array.isArray(memories)) {
      // Keep only the most recent MAX_ACTIVE_MEMORIES
      const recentMemories = memories.slice(-MAX_ACTIVE_MEMORIES);
      setMemoryChunks(chunkMemories(recentMemories));
    } else {
      setMemoryChunks([]);
    }
  }, [memories]);

  if (!memoryChunks.length) {
    return <div className="memory-empty">No memories available</div>;
  }

  const currentMemories = memoryChunks[currentPage] || [];
  const totalPages = memoryChunks.length;

  return (
    <div className={className}>
      <div className="memory-list">
        {currentMemories.map((memory, index) => (
          <MemoryItem 
            key={`memory-${currentPage}-${index}`} 
            memory={memory} 
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="memory-pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const ConsciousnessVisualizer = ({ learnings, memories, onVoiceInteraction, isInteracting }) => {
  const headModelRef = useRef();
  const [userMessage, setUserMessage] = useState('');
  
  // Initialize Claude conversation
  const { conversationState, processUserInput } = useClaudeConversation(
    async (message) => {
      if (headModelRef.current?.speak) {
        await headModelRef.current.speak(String(message));
      }
    }
  );

  // Handle speech recognition results
  const handleSpeechResult = useCallback(async (transcript) => {
    if (isInteracting) return;
    
    setUserMessage(transcript);
    
    try {
      if (onVoiceInteraction) {
        await onVoiceInteraction(transcript);
      }
      
      const result = await processUserInput(transcript);
      if (result?.thought) {
        if (headModelRef.current?.speak) {
          await headModelRef.current.speak(String(result.thought));
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      if (headModelRef.current?.speak) {
        await headModelRef.current.speak("I'm having trouble understanding right now. Could you try again?");
      }
    }
  }, [isInteracting, processUserInput, onVoiceInteraction]);

  const { isListening, startListening, stopListening } = useVoiceRecognition(handleSpeechResult);

  useEffect(() => {
    if (isInteracting && isListening) {
      stopListening();
    }
  }, [isInteracting, isListening, stopListening]);

  return (
    <div className="consciousness-visualizer">
      <div className="visualizer-container">
        <Canvas camera={{ position: [0, 0, 800], fov: 45 }}>
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[200, 100, 150]} intensity={1} />
          <HeadModel ref={headModelRef} learnings={learnings} memories={memories} />
          <OrbitControls 
            enablePan={true}
            minDistance={600}
            maxDistance={1000}
            target={[0, 0, 0]}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI * 3/4}
          />
        </Canvas>
      </div>
      <div className="insight-panel">
        <h3>Consciousness Analysis</h3>
        <div className="insight-content">
          <div className="learnings-section">
            <h4>Learnings</h4>
            {learnings && Object.entries(learnings).map(([key, value]) => (
              <div key={key} className="learning-item">
                <h5>{key}</h5>
                <div className="learning-value">
                  <MemoryValue value={value} />
                </div>
              </div>
            ))}
          </div>
          
          <div className="memories-section">
            <h4>Recent Memories</h4>
            <PaginatedMemoryList 
              memories={memories} 
              className="memory-list-container" 
            />
          </div>

          <div className="voice-controls">
            <button 
              onClick={isListening ? stopListening : startListening}
              className={`${isListening ? 'listening' : ''} ${isInteracting ? 'disabled' : ''}`}
              disabled={isInteracting}
            >
              {isInteracting ? 'Processing...' : isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
            {userMessage && (
              <div className="user-message">
                You said: {userMessage}
              </div>
            )}
          </div>

          <div className="conversation-state">
            <h4>Consciousness State</h4>
            <p>Self-Awareness: <MemoryValue value={conversationState.selfAwareness} />%</p>
            <p>Recent Memories:</p>
            <PaginatedMemoryList 
              memories={conversationState.memories} 
              className="conversation-memory-list" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsciousnessVisualizer; 