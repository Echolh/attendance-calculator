/**
 * 考勤计算核心逻辑
 */

import type {
    CalculationResult,
    SystemConfig,
    WorkRecord,
} from "../types/attendance.types";
import { getWeekInfo, minutesToTime, timeToMinutes } from "./time.utils";

/**
 * 计算单日有效工时
 * @param checkIn 上班时间 "HH:mm"
 * @param checkOut 下班时间 "HH:mm"
 * @param appliedOvertime 已申请的加班时长（小时）
 * @param config 系统配置
 * @returns 有效工时（小时）
 */
export function calculateDailyHours(
  checkIn: string,
  checkOut: string,
  appliedOvertime: number = 0,
  config: SystemConfig,
): number {
  // 1. 转换为分钟数
  const inMinutes = timeToMinutes(checkIn);
  const outMinutes = timeToMinutes(checkOut);

  // 2. 确定有效开始时间
  // - 如果上班时间早于弹性最早时间（8:00），按弹性最早时间计算
  // - 否则按实际时间计算
  const flexibleStartEarly = timeToMinutes(config.flexibleStartEarly);
  const effectiveStart = Math.max(inMinutes, flexibleStartEarly);

  // 3. 计算工作时长（分钟）
  let workMinutes = outMinutes - effectiveStart;

  // 4. 扣除午休（如果跨越午休时间）
  const lunchStart = timeToMinutes(config.lunchStart);
  const lunchEnd = timeToMinutes(config.lunchEnd);

  if (inMinutes < lunchEnd && outMinutes > lunchStart) {
    // 工作时间跨越午休，需要扣除
    const overlapStart = Math.max(inMinutes, lunchStart);
    const overlapEnd = Math.min(outMinutes, lunchEnd);
    workMinutes -= overlapEnd - overlapStart;
  }

  // 5. 扣除已申请的加班时长
  const appliedOvertimeMinutes = appliedOvertime * 60;
  workMinutes -= appliedOvertimeMinutes;

  // 6. 转换为小时（保留两位小数）
  return Math.round((workMinutes / 60) * 100) / 100;
}

/**
 * 计算实际加班时长
 * @param effectiveHours 有效工时
 * @param standardHours 标准工时（默认8小时）
 * @returns 实际加班时长（小时），如果未超过标准工时返回 0
 */
export function calculateActualOvertime(
  effectiveHours: number,
  standardHours: number = 8,
): number {
  const overtime = effectiveHours - standardHours;
  return overtime > 0 ? Math.round(overtime * 100) / 100 : 0;
}

/**
 * 计算本周累计工时
 * @param records 工作记录数组
 * @returns 总有效工时（小时）
 */
export function calculateWeeklyHours(records: WorkRecord[]): number {
  return records.reduce((total, record) => {
    // 未下班的日期不计入
    if (!record.checkOutTime || !record.effectiveHours) {
      return total;
    }
    return total + record.effectiveHours;
  }, 0);
}

/**
 * 计算本周统计结果
 * @param records 本周工作记录
 * @param workDays 本周工作天数
 * @param config 系统配置
 * @returns 计算结果
 */
export function calculateWeekResult(
  records: WorkRecord[],
  workDays: number,
  config: SystemConfig,
): CalculationResult {
  // 1. 计算已下班的日期
  const completedRecords = records.filter((r) => r.checkOutTime);
  const actualWorkDays = completedRecords.length;

  // 2. 计算总有效工时
  const totalEffectiveHours = calculateWeeklyHours(records);

  // 3. 计算本周要求工时
  const requiredHours = workDays * config.standardWorkHours;

  // 4. 计算剩余工时
  const remainingHours = requiredHours - totalEffectiveHours;

  // 5. 查找今天的记录（最后一个未下班的记录）
  const todayRecord = records.find((r) => !r.checkOutTime);

  const result: CalculationResult = {
    weekId: getWeekInfo(records[0]?.date).weekId,
    workDays: actualWorkDays,
    totalEffectiveHours: Math.round(totalEffectiveHours * 100) / 100,
    requiredHours,
    remainingHours: Math.round(remainingHours * 100) / 100,
  };

  // 6. 如果有今天的记录，计算最早下班时间
  if (todayRecord && todayRecord.checkInTime) {
    // 计算"相对于今天8小时"的剩余需求
    // 比如：今天是第2天，前1天应完成8h，实际完成8.067h，超额0.067h
    // 所以今天只需要工作 8 - 0.067 = 7.933h
    const expectedHoursBeforeToday = actualWorkDays * config.standardWorkHours;
    const todayRemaining = expectedHoursBeforeToday - totalEffectiveHours + config.standardWorkHours;

    const todayResult = calculateTodayOffTime(
      todayRecord.checkInTime,
      todayRemaining,
      config,
    );
    result.todayOffTime = todayResult.offTime;
    result.todayOvertime = todayResult.overtime;
  }

  return result;
}

/**
 * 计算今天最早下班时间
 * @param checkInTime 今天上班时间
 * @param remainingHours 本周剩余需要的工时
 * @param config 系统配置
 * @returns { offTime: 下班时间, overtime: 实际加班时长 }
 */
function calculateTodayOffTime(
  checkInTime: string,
  remainingHours: number,
  config: SystemConfig,
): { offTime: string; overtime: number } {
  // 1. 计算今天需要的工时
  // remainingHours 是相对于总要求工时的剩余（如31.933小时）
  // 我们需要转换为相对于今天8小时工时的需求
  // 如果 remainingHours > 8，说明今天需要工作满8小时
  // 如果 remainingHours < 8，说明今天可以少工作一些（用之前的加班抵扣）
  // 比如 remainingHours = 7.933，说明今天只需要工作7小时56分钟
  const todayRequired = Math.max(Math.min(remainingHours, config.standardWorkHours), 0);

  // 2. 转换为分钟（使用 Math.round 避免浮点数精度问题）
  const todayRequiredMinutes = Math.round(todayRequired * 60);

  // 3. 从上班时间开始计算
  const checkInMinutes = timeToMinutes(checkInTime);
  let offMinutes = checkInMinutes + todayRequiredMinutes;

  // 4. 加上午休时间（如果跨越午休）
  const lunchStart = timeToMinutes(config.lunchStart);
  const lunchEnd = timeToMinutes(config.lunchEnd);

  if (checkInMinutes < lunchEnd && offMinutes > lunchStart) {
    offMinutes += lunchEnd - lunchStart;
  }

  // 5. 只有在需要工作时长大于等于8小时时，才强制下班时间不早于18:00
  const flexibleEndEarly = timeToMinutes(config.flexibleEndEarly);
  let actualOffMinutes = offMinutes;

  // 如果今天需要工作时长大于等于8小时，才强制要求不早于18:00
  if (todayRequired >= config.standardWorkHours) {
    actualOffMinutes = Math.max(offMinutes, flexibleEndEarly);
  }

  // 6. 计算实际加班时长
  // 如果实际下班时间晚于计算出的下班时间，说明超出了工时要求
  const overtimeMinutes = actualOffMinutes - offMinutes;
  const overtime = Math.max(0, Math.round((overtimeMinutes / 60) * 100) / 100);

  // 如果加班时长小于等于0.1小时（6分钟），则视为0
  if (overtime <= 0.1) {
    return { offTime: minutesToTime(actualOffMinutes), overtime: 0 };
  }

  // 7. 转换为时间字符串
  const offTime = minutesToTime(actualOffMinutes);

  return { offTime, overtime };
}

/**
 * 创建空的工作记录
 * @param date 日期 YYYY-MM-DD
 * @returns 工作记录
 */
export function createEmptyWorkRecord(date: string): WorkRecord {
  return {
    id: `${date}-${Date.now()}`,
    date,
    checkInTime: "",
    checkOutTime: undefined,
    appliedOvertime: undefined,
    effectiveHours: undefined,
    overtime: undefined,
    notes: "",
  };
}

/**
 * 计算并更新工作记录的有效工时
 * @param record 工作记录
 * @param config 系统配置
 * @returns 更新后的工作记录
 */
export function updateWorkRecordHours(
  record: WorkRecord,
  config: SystemConfig,
): WorkRecord {
  if (!record.checkInTime || !record.checkOutTime) {
    return {
      ...record,
      effectiveHours: undefined,
      overtime: undefined,
    };
  }

  const effectiveHours = calculateDailyHours(
    record.checkInTime,
    record.checkOutTime,
    record.appliedOvertime || 0,
    config,
  );

  const overtime = calculateActualOvertime(
    effectiveHours,
    config.standardWorkHours,
  );

  return {
    ...record,
    effectiveHours: Math.round(effectiveHours * 100) / 100,
    overtime: Math.round(overtime * 100) / 100,
  };
}
