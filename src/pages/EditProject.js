import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRice } from '../context/RiceContext';
import './EditProject.css';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject } = useRice();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteOption, setDeleteOption] = useState('projectOnly'); // 'projectOnly' 或 'withPoints'

  const project = useMemo(() => projects.find(p => p.id === id) || null, [projects, id]);

  const [icon, setIcon] = useState('⭐');
  const [name, setName] = useState('');
  const [points, setPoints] = useState(1);
  const [period, setPeriod] = useState(7);

  useEffect(() => {
    if (project) {
      setIcon(project.icon || '⭐');
      setName(project.name || '');
      setPoints(project.points || 1);
      setPeriod(project.period || 7);
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProject(id, { icon, name, points, period });
      navigate('/');
    } catch (error) {
      alert('保存失败，请稍后再试');
    }
  };

  const availableIcons = ['⭐', '💪', '📚', '🏃‍♀️', '🧘‍♀️', '🍎', '💰'];

  if (!project) {
    return <div style={{ padding: 20 }}>项目不存在或尚未加载</div>;
  }

  return (
    <div className="add-project-container">
      <h2>编辑项目</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>图标:</label>
          <div className="icon-selection">
            {availableIcons.map((i) => (
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
        <div className="form-group">
          <label>积分:</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
            min="1"
            required
          />
        </div>
        <div className="form-group">
          <label>项目周期 (天):</label>
          <input
            type="number"
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value) || 0)}
            min="1"
            max="7"
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="add-button">保存</button>
          <button 
            type="button" 
            className="delete-button"
            onClick={() => setShowDeleteDialog(true)}
          >
            删除项目
          </button>
        </div>
      </form>

      {showDeleteDialog && (
        <div className="delete-dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>删除项目</h3>
            <p>请选择删除方式：</p>
            <div className="delete-options">
              <label className="delete-option">
                <input
                  type="radio"
                  name="deleteOption"
                  value="projectOnly"
                  checked={deleteOption === 'projectOnly'}
                  onChange={(e) => setDeleteOption(e.target.value)}
                />
                仅删除项目
              </label>
              <label className="delete-option">
                <input
                  type="radio"
                  name="deleteOption"
                  value="withPoints"
                  checked={deleteOption === 'withPoints'}
                  onChange={(e) => setDeleteOption(e.target.value)}
                />
                删除项目并清空该项目获得的米粒
              </label>
            </div>
            <div className="delete-dialog-actions">
              <button className="cancel-button" onClick={() => setShowDeleteDialog(false)}>
                取消
              </button>
              <button 
                className="confirm-delete-button"
                onClick={async () => {
                  const success = await deleteProject(id, deleteOption === 'withPoints');
                  setShowDeleteDialog(false);
                  if (success) {
                    navigate('/');
                  }
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProject;