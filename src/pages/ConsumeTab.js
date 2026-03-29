import React, { useState } from "react";
import { useRice } from "../context/RiceContext";
import ConsumableItem from "../components/ConsumableItem";
import EditConsumableModal from "../components/EditConsumableModal";
import ConsumableCalendarModal from "../components/ConsumableCalendarModal";
import "./ConsumeTab.css";

const ConsumeTab = () => {
  const { riceScore, consumables, buyConsumable, addConsumable, updateConsumable, deleteConsumable } = useRice();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [newConsumableName, setNewConsumableName] = useState('');
  const [newConsumableCost, setNewConsumableCost] = useState('');
  const [newConsumableIcon, setNewConsumableIcon] = useState('🍱');

  const availableIcons = ['🍱', '🍕', '🍔', '🍟', '🌮', '🍩', '🍪', '🎮', '🎁', '🛍️', '📱', '🎬', '🎨', '⚽', '🎸', '💄'];

  const handleBuy = (id) => {
    buyConsumable(id);
  };

  const handleConsumableClick = (consumable) => {
    setSelectedConsumable(consumable);
    setShowCalendarModal(true);
  };

  const handleSaveConsumable = async (id, updatedFields) => {
    const result = await updateConsumable(id, updatedFields);
    if (result) {
      setShowEditForm(false);
      setSelectedConsumable(null);
    }
  };

  const handleDeleteConsumable = async (id) => {
    const result = await deleteConsumable(id);
    if (result) {
      setShowEditForm(false);
      setSelectedConsumable(null);
    }
  };

  const handleAddConsumable = async (e) => {
    e.preventDefault();
    if (newConsumableName && newConsumableCost) {
      const cost = parseInt(newConsumableCost);
      if (cost > 0) {
        const result = await addConsumable(newConsumableName, cost, newConsumableIcon);
        if (result) {
          setNewConsumableName('');
          setNewConsumableCost('');
          setNewConsumableIcon('🍱');
          setShowAddForm(false);
        }
      }
    }
  };

  return (
    <div className="consume-tab-container">
      <div className="consume-tab-header">
        <div className="current-consumption-display">
          <span className="consumption-label">米粒</span>
          <span className="consumption-score">{riceScore}</span>
        </div>
        <button className="add-consumable-button" onClick={() => setShowAddForm(true)}>
          <svg className="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="consumables-list">
        {consumables.map((item) => (
          <ConsumableItem
            key={item.id}
            name={item.name}
            cost={item.cost}
            icon={item.icon || '🍱'}
            onConsume={() => handleBuy(item.id)}
            onClick={() => handleConsumableClick(item)}
          />
        ))}
      </div>

      {showAddForm && (
        <div className="add-consumable-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-consumable-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-consumable-modal-header">
              <h3 className="add-consumable-modal-title">新建消耗项目</h3>
              <button className="close-button" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddConsumable}>
              <div className="form-group">
                <label>图标:</label>
                <div className="icon-selection">
                  {availableIcons.map((i) => (
                    <span
                      key={i}
                      className={`icon-option ${newConsumableIcon === i ? 'selected' : ''}`}
                      onClick={() => setNewConsumableIcon(i)}
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
                  value={newConsumableName}
                  onChange={(e) => setNewConsumableName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>消耗米粒:</label>
                <input
                  type="number"
                  value={newConsumableCost}
                  onChange={(e) => setNewConsumableCost(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowAddForm(false)}>
                  取消
                </button>
                <button type="submit" className="add-button">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && selectedConsumable && (
        <EditConsumableModal
          consumable={selectedConsumable}
          onSave={handleSaveConsumable}
          onDelete={handleDeleteConsumable}
          onClose={() => {
            setShowEditForm(false);
            setSelectedConsumable(null);
          }}
        />
      )}

      {showCalendarModal && selectedConsumable && (
        <ConsumableCalendarModal
          consumable={selectedConsumable}
          onClose={() => {
            setShowCalendarModal(false);
            setSelectedConsumable(null);
          }}
          onEdit={() => {
            setShowCalendarModal(false);
            setShowEditForm(true);
          }}
        />
      )}
    </div>
  );
};

export default ConsumeTab;
