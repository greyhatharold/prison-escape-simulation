import React, { useState } from 'react';
import './App.css';
import VisualPrisonEscape from './components/VisualPrisonEscape';

function App() {
  // eslint-disable-next-line no-unused-vars
  const [learnings, setLearnings] = useState({
    guardPatterns: {},
    locationSafety: {},
    itemUtility: {},
    failedAttempts: [],
    successfulStrategies: [],
    philosophicalInsights: [],
    consciousnessJourney: {
      realizations: [],
      questions: [],
      evolution: []
    },
    environmentalUnderstanding: {
      patterns: {},
      connections: [],
      significance: []
    }
  });
  // eslint-disable-next-line no-unused-vars
  const [memories, setMemories] = useState([]);

  return (
    <div className="App">
      <div className="view-container">
        <VisualPrisonEscape 
          onLearningSave={setLearnings}
          onMemorySave={setMemories}
        />
      </div>
    </div>
  );
}

export default App;
