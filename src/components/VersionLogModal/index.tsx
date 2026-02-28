/**
 * 版本更新日志模态框
 */

import React from 'react';
import { Modal, Tag } from 'antd';
import { RocketOutlined, BugOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getAllVersions } from '../../data/versionLogs';
import type { VersionLog } from '../../types/attendance.types';
import './index.css';

interface VersionLogModalProps {
  visible: boolean;
  onClose: () => void;
}

const VersionLogModal: React.FC<VersionLogModalProps> = ({ visible, onClose }) => {
  const versions = getAllVersions();

  const getVersionTypeColor = (type: VersionLog['type']) => {
    switch (type) {
      case 'major':
        return 'red';
      case 'minor':
        return 'blue';
      case 'patch':
        return 'green';
      default:
        return 'default';
    }
  };

  const getVersionTypeText = (type: VersionLog['type']) => {
    switch (type) {
      case 'major':
        return '重大更新';
      case 'minor':
        return '功能更新';
      case 'patch':
        return '问题修复';
      default:
        return '版本更新';
    }
  };

  return (
    <Modal
      title={<div className="version-modal-title">📋 版本更新日志</div>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      className="version-log-modal"
    >
      <div className="version-list">
        {versions.map((version, index) => (
          <div key={version.version} className="version-item">
            <div className="version-header">
              <div className="version-info">
                <span className="version-number">v{version.version}</span>
                {index === 0 && <Tag color="red">最新</Tag>}
                <span className="version-date">{version.releaseDate}</span>
                <Tag color={getVersionTypeColor(version.type)}>
                  {getVersionTypeText(version.type)}
                </Tag>
              </div>
            </div>

            <div className="version-content">
              {version.features.length > 0 && (
                <div className="version-section">
                  <div className="section-title">
                    <RocketOutlined /> 新增功能
                  </div>
                  <ul className="feature-list">
                    {version.features.map((feature, idx) => (
                      <li key={idx} className="feature-item">{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {version.fixes.length > 0 && (
                <div className="version-section">
                  <div className="section-title">
                    <BugOutlined /> 问题修复
                  </div>
                  <ul className="fix-list">
                    {version.fixes.map((fix, idx) => (
                      <li key={idx} className="fix-item">{fix}</li>
                    ))}
                  </ul>
                </div>
              )}

              {version.improvements.length > 0 && (
                <div className="version-section">
                  <div className="section-title">
                    <ThunderboltOutlined /> 优化改进
                  </div>
                  <ul className="improvement-list">
                    {version.improvements.map((improvement, idx) => (
                      <li key={idx} className="improvement-item">{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default VersionLogModal;
