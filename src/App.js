import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScoreTab from './pages/ScoreTab';
import ConsumeTab from './pages/ConsumeTab';
import RecordTab from './pages/RecordTab';
import AddProject from './pages/AddProject';
import EditProject from './pages/EditProject';
import './App.css';

function App() {
  const [showAddProject, setShowAddProject] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <div className="main-content">
          <Routes>
            <Route path="/" element={<ScoreTab onAddProject={() => setShowAddProject(true)} />} />
            <Route path="/consume" element={<ConsumeTab />} />
            <Route path="/record" element={<RecordTab />} />
            <Route path="/projects/:id/edit" element={<EditProject />} />
          </Routes>
        </div>
        <Layout />
        {showAddProject && <AddProject onClose={() => setShowAddProject(false)} />}
      </div>
    </Router>
  );
}

export default App;
