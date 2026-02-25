/**
 * 版本更新日志数据
 */
import type { VersionLog } from '../types/attendance.types';

export const VERSION_LOGS: VersionLog[] = [
  {
    version: '1.1.0',
    releaseDate: '2025-02-25',
    type: 'minor',
    features: [
      '💾 新增自动保存状态指示器，实时显示保存状态',
      '📊 优化进度条显示：超额完成时显示绿色并标注超额百分比',
    ],
    fixes: [
      '🐛 修复下班时间计算bug：支持累计工时计算，允许前一天加班抵扣当天工时',
      '🐛 修复时间输入体验：延迟跳转光标，避免输入分钟时意外跳转',
      '🐛 修复有效工时显示bug：删除下班时间后不显示旧数据',
      '🐛 修复内存泄漏：组件卸载时清理所有定时器',
      '🐛 修复配置硬编码问题：使用config值替代硬编码的时间配置',
      '🐛 修复ID冲突风险：使用随机数生成唯一记录ID',
    ],
    improvements: [
      '⚡ 优化时间验证：使用配置中的时间限制进行验证',
      '⚡ 优化错误提示：假期同步失败时显示具体错误信息',
      '⚡ 下班时间提示动态化：根据配置显示最早下班时间',
    ],
  },
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
