import React from 'react';
import './ConsumableItem.css';

const ConsumableItem = ({ name, cost, icon = '🍱', onConsume, onClick }) => {
  return (
    <div className="consumable-item-card" onClick={onClick}>
      <div className="consumable-content">
        <div className="consumable-icon-container">
          <span className="consumable-icon">{icon}</span>
        </div>
        <div className="consumable-details">
          <div className="consumable-name">{name}</div>
          <div className="consumable-cost-preview">消耗 {cost} 积分</div>
        </div>
      </div>
      <button
        className="consume-button"
        onClick={(e) => {
          e.stopPropagation();
          onConsume();
        }}
      >
        扣除 {cost} 积分
      </button>
    </div>
  );
};

export default ConsumableItem;
