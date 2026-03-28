import React from 'react';
import './ProjectItem.css';

const ProjectItem = ({ icon, name, completionDates, onComplete, onClick }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayISO = `${year}-${month}-${day}`; // Local YYYY-MM-DD

  let currentDayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  // 调整为从周一开始计算，周日为7
  currentDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;

  const isCompletedToday = completionDates.includes(todayISO);
  const isButtonDisabled = isCompletedToday;

  const renderCompletionStatus = () => {
    const statusCircles = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      // 计算从周一开始的过去7天日期
      // 当i=0时显示周一，i=6时显示周日
      const daysDiff = (currentDayOfWeek - 1) - i;
      day.setDate(today.getDate() - daysDiff);

      const dYear = day.getFullYear();
      const dMonth = String(day.getMonth() + 1).padStart(2, '0');
      const dDay = String(day.getDate()).padStart(2, '0');
      const dayISO = `${dYear}-${dMonth}-${dDay}`;

      let circleClass = '';
      let circleContent = '';

      if (dayISO === todayISO) {
        // Today
        if (isCompletedToday) {
          circleClass = 'completed-today';
          circleContent = '✓';
        } else {
          circleClass = 'pending-today';
        }
      } else if (day < today) {
        // Past days
        if (completionDates.includes(dayISO)) {
          circleClass = 'completed-historical';
          circleContent = '✓';
        } else {
          circleClass = 'pending-historical';
        }
      } else {
        // Future days
        circleClass = 'pending-future';
      }

      statusCircles.push(
        <span key={i} className={`completion-circle ${circleClass}`}>
          {circleContent}
        </span>
      );
    }

    return (
      <div className="completion-status">
        {statusCircles}
      </div>
    );
  };

  return (
    <div className="project-item-card" onClick={onClick}>
      <div className="project-content">
        <div className="project-icon-container">
          <span className="project-icon">{icon}</span>
        </div>
        <div className="project-details">
          <div className="project-name">{name}</div>
          {renderCompletionStatus()}
        </div>
      </div>
      <button
        className="complete-button"
        onClick={(e) => {
          e.stopPropagation(); // 防止点击按钮时触发卡片的点击事件
          onComplete();
        }}
        disabled={isButtonDisabled}
      >✓</button>
    </div>
  );
};

export default ProjectItem;