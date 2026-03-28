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
          <svg t="1762701521906" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4549" width="24" height="24">
            <path d="M512 64.49899c-247.14789 0-447.50101 200.353121-447.50101 447.50101s200.353121 447.50101 447.50101 447.50101 447.50101-200.353121 447.50101-447.50101S759.14789 64.49899 512 64.49899zM750.666728 512c0 13.181207-10.685363 23.86657-23.86657 23.86657L535.86657 535.86657l0 190.933587c0 13.181207-10.685363 23.86657-23.86657 23.86657l0 0c-13.181207 0-23.86657-10.685363-23.86657-23.86657L488.13343 535.86657 297.198819 535.86657c-13.181207 0-23.86657-10.685363-23.86657-23.86657l0 0c0-13.181207 10.685363-23.86657 23.86657-23.86657l190.933587 0L488.132406 297.198819c0-13.181207 10.685363-23.86657 23.86657-23.86657l0 0c13.181207 0 23.86657 10.685363 23.86657 23.86657l0 190.933587 190.933587 0C739.981365 488.13343 750.666728 498.818793 750.666728 512L750.666728 512z" fill="#29B6F6" p-id="4550"></path>
          </svg>
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