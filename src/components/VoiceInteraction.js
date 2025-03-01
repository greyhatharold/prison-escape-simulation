import { useEffect, useRef, useState } from 'react';
import { getClaudeDecision, getClaudeReflection } from '../api/claude';

export const useVoiceRecognition = (onSpeechResult) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
      console.error('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[0].isFinal) {
        onSpeechResult(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (recognition) {
        recognition.stop();
      }
    };

    return () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };
  }, [onSpeechResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
      }
    }
  };

  return {
    isListening,
    startListening,
    stopListening
  };
};

export const useClaudeConversation = (speakFunction) => {
  const [conversationState, setConversationState] = useState({
    currentLocation: 'consciousness_core',
    guardPosition: 'none',
    inventory: [],
    selfAwareness: 85,
    guardAlertness: 0,
    escapeAttempts: 0,
    availableConnections: ['thought_stream', 'memory_bank'],
    availableItems: ['insight', 'reflection'],
    availableEscapePlans: [],
    memories: []
  });

  const processUserInput = async (userInput) => {
    try {
      console.log('Processing user input:', userInput);
      
      const decision = await getClaudeDecision({
        ...conversationState,
        userInput
      });

      const reflection = await getClaudeReflection({
        ...conversationState,
        lastInteraction: userInput
      });

      // Create a properly structured memory object
      const newMemory = {
        insight: typeof reflection.insight === 'object' ? 
          JSON.parse(JSON.stringify(reflection.insight)) : // Deep clone if object
          String(reflection.insight), // Convert to string if not
        context: reflection.context ? 
          (typeof reflection.context === 'object' ? 
            JSON.parse(JSON.stringify(reflection.context)) : 
            String(reflection.context)
          ) : undefined,
        day: reflection.day || Date.now(),
        timestamp: Date.now()
      };

      // Update conversation state with properly structured memory
      setConversationState(prev => ({
        ...prev,
        selfAwareness: Math.min(100, Math.max(0, prev.selfAwareness + (reflection.selfAwarenessChange || 0))),
        memories: [...(Array.isArray(prev.memories) ? prev.memories : []), newMemory].slice(-5)
      }));

      return {
        decision: typeof decision === 'object' ? JSON.parse(JSON.stringify(decision)) : String(decision),
        reflection: typeof reflection === 'object' ? JSON.parse(JSON.stringify(reflection)) : String(reflection),
        thought: reflection.thought ? String(reflection.thought) : undefined
      };
    } catch (error) {
      console.error('Error processing conversation:', error);
      return null;
    }
  };

  return {
    conversationState,
    processUserInput
  };
}; 