import React, { useMemo, useState } from 'react';
import { useRice } from '../context/RiceContext';
import AddProject from '../pages/AddProject'; // 导入 AddProject 组件
import './CalendarModal.css';

const CalendarModal = ({ project, onClose, hideFooter = false, readOnly = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEditModal, setShowEditModal] = useState(false); // 控制编辑模态框显示的状态
  const { toggleProjectCompletion } = useRice();

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // 将周日(0)转换为7，这样周一为1，周日为7
    return day === 0 ? 7 : day;
  };

  const toLocalISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDateCompleted = (date) => {
    const dateStr = toLocalISO(date);
    return (project?.completionDates ?? []).includes(dateStr);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const todayISO = toLocalISO(new Date());

    // Empty cells for days before the first day of the month
    // 由于我们从周一开始，所以第一天为1时不需要空单元格
    for (let i = 1; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isCompleted = isDateCompleted(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const dayISO = toLocalISO(date);
      const isFuture = dayISO > todayISO;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${readOnly ? 'read-only' : ''}`}
          onClick={async () => {
            if (isFuture || readOnly) return;
            try {
              await toggleProjectCompletion(project.id, dayISO);
            } catch (e) {
              // 已在 context 打印错误，这里无需重复处理
            }
          }}
          role="button"
          tabIndex={isFuture ? -1 : 0}
          onKeyDown={async (e) => {
            if (isFuture || readOnly) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              try {
                await toggleProjectCompletion(project.id, dayISO);
              } catch { }
            }
          }}
        >
          {isCompleted ? (
            <span className="day-mark">✓</span>
          ) : (
            <span className="day-number">{day}</span>
          )}
        </div>
      );
    }

    return days;
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const monthStats = useMemo(() => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthlyCompleted = (project?.completionDates ?? []).filter((dateStr) => {
      return dateStr.startsWith(prefix);
    }).length;
    const daysInMonth = getDaysInMonth(currentMonth);
    const monthlyRate = daysInMonth > 0 ? Math.round((monthlyCompleted / daysInMonth) * 100) : 0;
    const monthlyRice = monthlyCompleted * ((project?.points) || 0);
    return { monthlyCompleted, monthlyRate, monthlyRice };
  }, [project, currentMonth]);

  if (!project) return null;

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="nav-button" onClick={() => changeMonth(-1)}>‹</button>
          <h3 className="calendar-title">
            {project.name} - {currentMonth.getFullYear()}年{monthNames[currentMonth.getMonth()]}
          </h3>
          <button className="nav-button" onClick={() => changeMonth(1)}>›</button>
        </div>

        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {renderCalendarDays()}
        </div>

        <div className="calendar-stats">
          <div className="stat-item">
            <span className="stat-label">本月完成</span>
            <span className="stat-value">{monthStats.monthlyCompleted}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">总完成</span>
            <span className="stat-value">{(project?.completionDates ?? []).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">本月完成率</span>
            <span className="stat-value">{monthStats.monthlyRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">本月米粒</span>
            <span className="stat-value">{monthStats.monthlyRice}</span>
          </div>
        </div>

        {!hideFooter && (
          <div className="button-group">
            <button className="modal-close-btn" onClick={onClose}>关闭</button>
            <button className="modal-edit-btn" onClick={() => setShowEditModal(true)}>编辑</button>
          </div>
        )}
      </div>

      {showEditModal && (
        <AddProject
          onClose={() => setShowEditModal(false)}
          projectToEdit={project}
        />
      )}
    </div>
  );
};

export default CalendarModal;