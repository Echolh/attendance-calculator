/**
 * 考勤计算核心类型定义
 */

/**
 * 系统配置
 */
export interface SystemConfig {
  standardWorkHours: number;      // 标准工时/天 (默认8)
  flexibleStartEarly: string;     // 弹性上班最早 (默认"08:00")
  flexibleStartLate: string;      // 弹性上班最晚 (默认"09:30")
  flexibleEndEarly: string;       // 弹性下班最早 (默认"18:00")
  flexibleEndLate: string;        // 弹性下班最晚 (默认"19:30")
  lunchStart: string;             // 午休开始 (默认"12:00")
  lunchEnd: string;               // 午休结束 (默认"14:00")
  lunchDuration: number;          // 午休时长 (小时, 默认2)
}

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
 * 工作记录
 */
export interface WorkRecord {
  id: string;                    // 唯一标识
  date: string;                  // 日期 YYYY-MM-DD
  checkInTime: string;           // 上班时间 HH:mm
  checkOutTime?: string;         // 下班时间 HH:mm (可空)
  appliedOvertime?: number;     // 已申请的加班时长（小时，需要从工时中扣除）
  effectiveHours?: number;       // 有效工时（小时，自动计算）
  overtime?: number;            // 实际加班工时（小时，自动计算）
  notes?: string;               // 备注
}

/**
 * 周记录
 */
export interface WeekRecord {
  weekId: string;                // 周标识 YYYY-Www
  startDate: string;             // 周开始日期 YYYY-MM-DD
  endDate: string;               // 周结束日期 YYYY-MM-DD
  records: WorkRecord[];         // 工作记录数组
  workDays?: number;             // 已工作天数（自动计算）
  totalHours?: number;           // 总工时（自动计算）
  requiredHours: number;         // 要求工时（workDays × 8）
  remainingHours?: number;        // 剩余工时（自动计算）
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
}

/**
 * 计算结果
 */
export interface CalculationResult {
  weekId: string;
  workDays: number;              // 已工作天数（已下班的天数）
  totalEffectiveHours: number;   // 总有效工时
  requiredHours: number;         // 本周要求工时
  remainingHours: number;        // 还需工时（可以为负，表示已超出）
  todayOffTime?: string;         // 今天最早下班时间
  todayOvertime?: number;        // 今天实际加班时长（小时）
  filterStartDate?: string;      // 筛选开始日期 YYYY-MM-DD
  filterEndDate?: string;        // 筛选结束日期 YYYY-MM-DD
}

/**
 * 周摘要（用于历史记录列表）
 */
export interface WeekSummary {
  weekId: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  requiredHours: number;
  workDays: number;
}

/**
 * 版本更新日志
 */
export interface VersionLog {
  version: string;           // 版本号，如 '1.0.0'
  releaseDate: string;        // 发布日期，如 '2025-02-14'
  type: 'major' | 'minor' | 'patch';  // 更新类型
  features: string[];        // 新增功能
  fixes: string[];           // 修复的问题
  improvements: string[];    // 改进项
}
