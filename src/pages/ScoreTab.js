import React, { useState } from 'react';
import ProjectItem from '../components/ProjectItem';
import CalendarModal from '../components/CalendarModal';
import { useRice } from '../context/RiceContext';
import './ScoreTab.css';

const ScoreTab = ({ onAddProject }) => {
  const { riceScore, projects, completeProject } = useRice();
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const handleComplete = (id) => {
    completeProject(id);
  };

  const handleProjectClick = (project) => {
    setSelectedProjectId(project.id);
  };

  const handleCloseModal = () => {
    setSelectedProjectId(null);
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  const sortedProjects = [...(projects || [])].sort((a, b) => {
    const aCompletedToday = (a.completionDates || []).includes(today);
    const bCompletedToday = (b.completionDates || []).includes(today);

    if (aCompletedToday && !bCompletedToday) {
      return 1; // a goes to the end
    } else if (!aCompletedToday && bCompletedToday) {
      return -1; // b goes to the end
    } else {
      return 0; // maintain original order
    }
  });

  return (
    <div className="score-tab-container">
      <div className="score-tab-header">
        <div className="current-rice-display">
          <span className="rice-label">米粒</span>
          <span className="rice-score">{riceScore}</span>
        </div>
        <button className="add-project-button" onClick={onAddProject}>
          <span className="add-button-plus" aria-hidden="true">+</span>
        </button>
      </div>
      <div className="project-list">
        {sortedProjects.map((project) => (
          <ProjectItem
            key={project.id}
            icon={project.icon}
            name={project.name}
            completionDates={project.completionDates || []}
            onComplete={() => handleComplete(project.id)}
            onClick={() => handleProjectClick(project)}
          />
        ))}
      </div>
      <CalendarModal
        project={(projects || []).find(p => p.id === selectedProjectId) || null}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ScoreTab;
