/**
 * 版本更新日志数据
 */
import type { VersionLog } from '../types/attendance.types';

export const VERSION_LOGS: VersionLog[] = [
  {
    version: '1.0.0',
    releaseDate: '2025-02-14',
    type: 'major',
    features: [
      '✨ 考勤计算器初始版本发布',
      '📅 支持弹性工时计算（8:00-9:30上班，18:00-19:30下班）',
      '⏰ 自动扣除午休时间（12:00-14:00）',
      '📊 实时显示本周已工作天数和总有效工时',
      '🎯 自动计算今天最早下班时间',
      '📅 支持日期范围筛选（最多7天）',
      '🎉 支持假期数据同步和标记',
      '💾 支持数据本地存储',
      '🖼️ 支持导出考勤记录为图片',
    ],
    fixes: [],
    improvements: [
      '⚡ 快速响应的交互体验',
      '🎨 清晰简洁的界面设计',
      '📱 响应式布局，支持不同屏幕尺寸',
    ],
  },
];

/**
 * 获取最新版本信息
 */
export function getLatestVersion(): VersionLog {
  return VERSION_LOGS[0];
}

/**
 * 获取所有版本信息
 */
export function getAllVersions(): VersionLog[] {
  return VERSION_LOGS;
}
