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

  const handleEditConsumable = (consumable) => {
    setSelectedConsumable(consumable);
    setShowEditForm(true);
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
          <svg t="1762701521906" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4549" width="24" height="24">
            <path d="M512 64.49899c-247.14789 0-447.50101 200.353121-447.50101 447.50101s200.353121 447.50101 447.50101 447.50101 447.50101-200.353121 447.50101-447.50101S759.14789 64.49899 512 64.49899zM750.666728 512c0 13.181207-10.685363 23.86657-23.86657 23.86657L535.86657 535.86657l0 190.933587c0 13.181207-10.685363 23.86657-23.86657 23.86657l0 0c-13.181207 0-23.86657-10.685363-23.86657-23.86657L488.13343 535.86657 297.198819 535.86657c-13.181207 0-23.86657-10.685363-23.86657-23.86657l0 0c0-13.181207 10.685363-23.86657 23.86657-23.86657l190.933587 0 0-190.933587c0-13.181207 10.685363-23.86657 23.86657-23.86657l0 0c13.181207 0 23.86657 10.685363 23.86657 23.86657l0 190.933587 190.933587 0C739.981365 488.13343 750.666728 498.818793 750.666728 512L750.666728 512z" fill="#29B6F6" p-id="4550"></path>
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
