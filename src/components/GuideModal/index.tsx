/**
 * 功能引导弹窗
 */

import React from 'react';
import { Modal, Button } from 'antd';
import type { SystemConfig } from '../../types/attendance.types';
import './index.css';

interface GuideModalProps {
  visible: boolean;
  onClose: () => void;
  config: SystemConfig;
}

const GuideModal: React.FC<GuideModalProps> = ({ visible, onClose, config }) => {
  return (
    <Modal
      title={<div className="guide-modal-title">📖 功能引导</div>}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="never" onClick={() => {
          onClose();
          localStorage.setItem('attendance-guide-hidden', 'true');
        }}>
          不再显示
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          我知道了
        </Button>,
      ]}
      width={700}
      className="guide-modal"
    >
      <div className="guide-content">
        <div className="guide-section">
          <div className="guide-section-title">🎯 核心功能</div>
          <ul className="guide-list">
            <li><strong>记录打卡时间</strong>：点击输入框选择或手动输入上下班时间</li>
            <li><strong>自动计算工时</strong>：系统自动扣除午休时间，计算有效工时</li>
            <li><strong>智能提示下班</strong>：根据累计工时智能推算今天下班时间</li>
            <li><strong>加班统计</strong>：可手动记录加班时长（需工作满8小时后）</li>
          </ul>
        </div>

        <div className="guide-section">
          <div className="guide-section-title">⌨️ 快捷操作</div>
          <ul className="guide-list">
            <li><strong>Ctrl+S / Cmd+S</strong>：快速保存数据</li>
            <li><strong>自动跳转</strong>：输入完时间后800ms自动跳到下一个输入框</li>
            <li><strong>日期筛选</strong>：右上角选择日期范围筛选统计数据</li>
            <li><strong>假期同步</strong>：点击同步按钮获取本月假期数据（节假日自动扣除工时）</li>
          </ul>
        </div>

        <div className="guide-section">
          <div className="guide-section-title">💾 数据说明</div>
          <ul className="guide-list">
            <li><strong>自动保存</strong>：输入数据后自动保存到浏览器本地</li>
            <li><strong>保存提示</strong>：标题旁边显示最后保存时间，如"已保存 14:30"</li>
            <li><strong>数据持久</strong>：刷新页面数据不会丢失</li>
            <li><strong>导出功能</strong>：可导出为图片分享或存档</li>
          </ul>
        </div>

        <div className="guide-section">
          <div className="guide-section-title">📊 统计说明</div>
          <ul className="guide-list">
            <li><strong>本周进度</strong>：显示"已完成天数/总天数"，如"3/5"表示本周需工作5天，已完成3天</li>
            <li><strong>超额进度</strong>：当累计工时超过40h时，进度条变绿显示超额部分</li>
            <li><strong>累计工时</strong>：支持跨天累计，前一天加班可抵扣后一天工时</li>
          </ul>
        </div>

        <div className="guide-section">
          <div className="guide-section-title">⚠️ 注意事项</div>
          <ul className="guide-list">
            <li>上班时间不能早于 <strong>{config.flexibleStartEarly}</strong></li>
            <li>下班时间一般不能早于 <strong>{config.flexibleEndEarly}</strong>（累计工时满40h可提前）</li>
            <li>加班时长必须以0.5小时为单位，最多不超过超出8小时的部分</li>
            <li>午休时间（{config.lunchStart} - {config.lunchEnd}）不计入工作时长</li>
          </ul>
        </div>

        <div className="guide-section">
          <div className="guide-section-title">❓ 常见问题</div>
          <ul className="guide-list">
            <li><strong>Q: 为什么下班时间显示不准？</strong><br/>
                A: 系统会根据累计工时计算下班时间，前一天的加班可以抵扣今天的工时</li>
            <li><strong>Q: 输入时间后没有自动保存？</strong><br/>
                A: 只有时间格式完整（HH:mm）时才会保存，只填小时不会保存</li>
            <li><strong>Q: 如何查看功能引导？</strong><br/>
                A: 点击左下角的"查看功能引导"按钮</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default GuideModal;
