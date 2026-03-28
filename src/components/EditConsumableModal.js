import React, { useState, useEffect } from 'react';
import './EditConsumableModal.css';

const EditConsumableModal = ({ consumable, onSave, onDelete, onClose }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [icon, setIcon] = useState('🍱');

  const availableIcons = ['🍱', '🍕', '🍔', '🍟', '🌮', '🍩', '🍪', '🎮', '🎁', '🛍️', '📱', '🎬', '🎨', '⚽', '🎸', '💄'];

  useEffect(() => {
    if (consumable) {
      setName(consumable.name);
      setCost(consumable.cost.toString());
      setIcon(consumable.icon || '🍱');
    }
  }, [consumable]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && cost) {
      const costValue = parseInt(cost);
      if (costValue > 0) {
        onSave(consumable.id, { name, cost: costValue, icon });
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个消耗项目吗？')) {
      onDelete(consumable.id);
    }
  };

  return (
    <div className="edit-consumable-modal-overlay" onClick={onClose}>
      <div className="edit-consumable-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-consumable-modal-header">
          <h3 className="edit-consumable-modal-title">编辑消耗项目</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
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
            <label>消耗米粒:</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              min="1"
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="delete-button" onClick={handleDelete}>
              删除项目
            </button>
            <button type="submit" className="save-button">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConsumableModal;
