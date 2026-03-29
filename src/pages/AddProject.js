import React, { useState } from 'react';
import { useRice } from '../context/RiceContext';
import { PROJECT_ICONS } from '../constants/icons';
import './AddProject.css';

const AddProject = ({ onClose, projectToEdit }) => {
  const [icon, setIcon] = useState(projectToEdit ? projectToEdit.icon : '⭐');
  const [name, setName] = useState(projectToEdit ? projectToEdit.name : '');
  const [points, setPoints] = useState(projectToEdit ? projectToEdit.points : 10);
  const [period, setPeriod] = useState(projectToEdit ? projectToEdit.period : 7);
  const { addProject, updateProject, deleteProject } = useRice();

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (projectToEdit) {
      updateProject(projectToEdit.id, { icon, name, points, period });
    } else {
      const createdAt = new Date().toISOString().split('T')[0];
      addProject({ icon, name, points, period, createdAt });
    }
    onClose();
  };

  const handleDeleteProject = () => {
    if (window.confirm('确定要删除这个项目吗？')) {
      deleteProject(projectToEdit.id);
      onClose();
    }
  };

  return (
    <div className="add-project-modal-overlay" onClick={onClose}>
      <div className="add-project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-project-header">
          <h3 className="add-project-title">{projectToEdit ? '编辑项目' : '新建项目'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSaveProject} className="add-project-form">
          <div className="form-group">
            <label>图标:</label>
            <div className="icon-selection">
              {PROJECT_ICONS.map((i) => (
                <span
                  key={i}
                  className={`icon-option ${icon === i ? 'selected' : ''}`}
                  onClick={() => setIcon(i)}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>项目名称:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>积分:</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>项目周期 (天):</label>
              <input
                type="number"
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                min="1"
                max="7"
                required
              />
            </div>
          </div>
          <div className="button-group">
            {projectToEdit && (
              <button type="button" className="delete-button" onClick={handleDeleteProject}>
                删除项目
              </button>
            )}
            <button type="submit" className="add-button">{projectToEdit ? '保存' : '添加项目'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
