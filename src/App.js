
import React from 'react';
import SocialMediaVisualization from './NodeGraph';

function App() {
  return (
    <div className="App">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Real-time Social Media Visualization</h1>
      </header>
      <main>
        <SocialMediaVisualization />
      </main>
    </div>
  );
}

export default App;