/**
 * 常量定义
 */

import type { SystemConfig } from '../types/attendance.types';

/**
 * IndexedDB 数据库名称
 */
export const DB_NAME = 'AttendanceCalculatorDB';

/**
 * IndexedDB 版本
 */
export const DB_VERSION = 2;

/**
 * 周记录存储表名
 */
export const STORE_WEEKS = 'weeks';

/**
 * 配置存储表名
 */
export const STORE_CONFIGS = 'configs';

/**
 * 默认系统配置
 */
export const DEFAULT_CONFIG: SystemConfig = {
  standardWorkHours: 8,
  flexibleStartEarly: '08:00',
  flexibleStartLate: '09:30',
  flexibleEndEarly: '18:00',
  flexibleEndLate: '19:30',
  lunchStart: '12:00',
  lunchEnd: '14:00',
  lunchDuration: 2,
};

/**
 * 应用配置键名
 */
export const CONFIG_KEY = 'default';

/**
 * 时间格式
 */
export const TIME_FORMAT = 'HH:mm';

/**
 * 日期格式
 */
export const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * 每页显示的记录数
 */
export const PAGE_SIZE = 10;

/**
 * 最大工作天数（一周）
 */
export const MAX_WORK_DAYS = 7;

/**
 * 最小工作小时数（用于验证）
 */
export const MIN_WORK_HOURS = 0;

/**
 * 最大工作小时数（用于验证）
 */
export const MAX_WORK_HOURS = 16;

/**
 * 提示消息
 */
export const MESSAGES = {
  INVALID_TIME_RANGE: '下班时间不能早于上班时间',
  MISSING_TIME: '请填写完整的上下班时间',
  INVALID_OVERTIME: '已申请加班时长不能超过工作时间',
  VERY_SHORT_WORKDAY: '警告：工作时长少于 4 小时',
  VERY_LONG_WORKDAY: '警告：工作时长超过 12 小时',
  WEEKLY_HOURS_EXCEEDED: '警告：本周累计工时超出要求太多',
  DATA_SAVED: '数据已保存',
  DATA_ERROR: '数据保存失败',
  IMPORT_SUCCESS: '数据导入成功',
  IMPORT_ERROR: '数据导入失败',
  EXPORT_SUCCESS: '数据导出成功',
  EXPORT_ERROR: '数据导出失败',
};

/**
 * 错误类型
 */
export const ErrorType = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  IMPORT_ERROR: 'IMPORT_ERROR',
  EXPORT_ERROR: 'EXPORT_ERROR',
} as const;
