import React, { useMemo, useState } from 'react';
import { useRice } from '../context/RiceContext';
import CalendarModal from '../components/CalendarModal';
import './RecordTab.css';

const RecordTab = () => {
  const { projects, purchaseRecords, riceScore } = useRice();
  const [selectedProject, setSelectedProject] = useState(null);

  // 构建时间轴数据
  const timelineData = useMemo(() => {
    const dateMap = new Map();

    // 收集所有项目完成记录（获得米粒）
    projects.forEach(project => {
      const points = Number(project.points) || 0;
      const completionDates = project.completionDates || [];
      completionDates.forEach(date => {
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, earnings: [], consumptions: [] });
        }
        const dayData = dateMap.get(date);
        dayData.earnings.push({
          type: 'project',
          name: project.name,
          icon: project.icon || '⭐',
          points: points
        });
      });
    });

    // 收集所有购买记录（消耗米粒）
    purchaseRecords.forEach(record => {
      const date = record.purchaseDate ? record.purchaseDate.slice(0, 10) : record.purchaseDate;
      if (!date) return;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, earnings: [], consumptions: [] });
      }
      const dayData = dateMap.get(date);
      dayData.consumptions.push({
        type: 'purchase',
        name: record.name,
        cost: Number(record.cost) || 0
      });
    });

    // 转换为数组并按日期排序（最新的在前）
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(b) - new Date(a));

    // 计算累计余额
    let runningBalance = riceScore;
    const timeline = sortedDates.map(date => {
      const dayData = dateMap.get(date);
      const dayEarnings = dayData.earnings.reduce((sum, e) => sum + e.points, 0);
      const dayConsumptions = dayData.consumptions.reduce((sum, c) => sum + c.cost, 0);
      const dayNet = dayEarnings - dayConsumptions;

      const entry = {
        ...dayData,
        dayNet,
        runningBalance: runningBalance
      };
      runningBalance -= dayNet;
      return entry;
    });

    return timeline;
  }, [projects, purchaseRecords, riceScore]);

  // 格式化日期显示
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateOnly.getTime() === today.getTime()) {
      return '今天';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return '昨天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
    }
  };

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // 统计总获得和总消耗
  const totalStats = useMemo(() => {
    let totalEarnings = 0;
    let totalConsumptions = 0;
    timelineData.forEach(day => {
      totalEarnings += day.earnings.reduce((sum, e) => sum + e.points, 0);
      totalConsumptions += day.consumptions.reduce((sum, c) => sum + c.cost, 0);
    });
    return { totalEarnings, totalConsumptions, net: totalEarnings - totalConsumptions };
  }, [timelineData]);

  return (
    <div className="record-tab-container">
      {/* 统计概览 */}
      <div className="timeline-header">
        <div className="timeline-summary">
          <div className="summary-item earnings">
            <span className="summary-value">+{totalStats.totalEarnings}</span>
            <span className="summary-label">累计获得</span>
          </div>
          <div className="summary-item consumptions">
            <span className="summary-value">-{totalStats.totalConsumptions}</span>
            <span className="summary-label">累计消耗</span>
          </div>
          <div className="summary-item balance">
            <span className="summary-value">{riceScore}</span>
            <span className="summary-label">当前余额</span>
          </div>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="timeline">
        {timelineData.length === 0 ? (
          <div className="timeline-empty">
            <span className="empty-icon">📝</span>
            <span className="empty-text">暂无记录</span>
            <span className="empty-hint">完成任务或购买消耗品后将显示在这里</span>
          </div>
        ) : (
          timelineData.map((day, index) => (
            <div key={day.date} className="timeline-item">
              {/* 时间线连接线 */}
              <div className="timeline-connector">
                <div className={`timeline-dot ${day.dayNet >= 0 ? 'positive' : 'negative'}`}></div>
                {index < timelineData.length - 1 && <div className="timeline-line"></div>}
              </div>

              {/* 日期标记 */}
              <div className="timeline-date">
                <span className="date-text">{formatDate(day.date)}</span>
                <span className={`date-balance ${day.runningBalance >= 0 ? 'positive' : 'negative'}`}>
                  余额: {day.runningBalance >= 0 ? '+' : ''}{day.runningBalance}
                </span>
              </div>

              {/* 当日记录 */}
              <div className="timeline-content">
                {/* 获得记录 */}
                {day.earnings.length > 0 && (
                  <div className="timeline-section earnings-section">
                    <div className="section-header">
                      <span className="section-icon">🌾</span>
                      <span className="section-label">获得米粒</span>
                      <span className="section-total positive">+{day.earnings.reduce((sum, e) => sum + e.points, 0)}</span>
                    </div>
                    <div className="section-items">
                      {day.earnings.map((item, i) => (
                        <div key={i} className="timeline-entry">
                          <span className="entry-icon">{item.icon}</span>
                          <span className="entry-name">{item.name}</span>
                          <span className="entry-points positive">+{item.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 消耗记录 */}
                {day.consumptions.length > 0 && (
                  <div className="timeline-section consumptions-section">
                    <div className="section-header">
                      <span className="section-icon">🛒</span>
                      <span className="section-label">消耗米粒</span>
                      <span className="section-total negative">-{day.consumptions.reduce((sum, c) => sum + c.cost, 0)}</span>
                    </div>
                    <div className="section-items">
                      {day.consumptions.map((item, i) => (
                        <div key={i} className="timeline-entry">
                          <span className="entry-icon">🍱</span>
                          <span className="entry-name">{item.name}</span>
                          <span className="entry-points negative">-{item.cost}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 项目点击弹窗（保留原有功能） */}
      {selectedProject && (
        <CalendarModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          hideFooter={true}
          readOnly={true}
        />
      )}
    </div>
  );
};

export default RecordTab;
