/**
 * 时间处理工具函数
 */

/**
 * 判断时间字符串是否完整（格式为 HH:mm）
 * @param timeStr 时间字符串
 * @returns 是否为完整的时间格式
 */
export function isCompleteTime(timeStr: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeStr);
}

/**
 * 将时间字符串 (HH:mm) 转换为分钟数
 * @param timeStr 时间字符串，格式 "HH:mm"
 * @returns 分钟数（从 00:00 开始）
 * @example
 * timeToMinutes("08:30") // 510
 * timeToMinutes("18:00") // 1080
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 将分钟数转换为时间字符串 (HH:mm)
 * @param minutes 分钟数
 * @returns 时间字符串，格式 "HH:mm"
 * @example
 * minutesToTime(510) // "08:30"
 * minutesToTime(1080) // "18:00"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * 将小时数转换为时间字符串 (HH:mm)
 * @param hours 小时数（可以是小数）
 * @returns 时间字符串，格式 "HH:mm"
 * @example
 * hoursToTime(8.5) // "08:30"
 * hoursToTime(18.25) // "18:15"
 */
export function hoursToTime(hours: number): string {
  const totalMinutes = hours * 60;
  return minutesToTime(totalMinutes);
}

/**
 * 计算两个时间之间的时长（小时）
 * @param startTime 开始时间 "HH:mm"
 * @param endTime 结束时间 "HH:mm"
 * @returns 时长（小时）
 * @example
 * calculateDuration("08:00", "18:00") // 10
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return (endMinutes - startMinutes) / 60;
}

/**
 * 格式化小时数为可读字符串
 * @param hours 小时数（可以是小数）
 * @returns 格式化字符串，如 "8h 30m" 或 "8.5h"
 * @example
 * formatHours(8.5) // "8h 30m"
 * formatHours(8) // "8h"
 */
export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
}

/**
 * 格式化小时数为 "Xh Ym" 格式
 * @param hours 小时数
 * @returns 格式化字符串
 */
export function formatHoursDetailed(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours} 小时`;
  }

  return `${wholeHours} 小时 ${minutes} 分钟`;
}

/**
 * 获取当前日期的字符串表示
 * @returns 日期字符串 YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取当前时间的字符串表示
 * @returns 时间字符串 HH:mm
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 获取周 ID 和起止日期
 * @param date 日期字符串 YYYY-MM-DD，默认为今天
 * @returns { weekId, startDate, endDate }
 */
export function getWeekInfo(date?: string): {
  weekId: string;
  startDate: string;
  endDate: string;
} {
  const targetDate = date ? new Date(date) : new Date();

  // 获取本周一
  const day = targetDate.getDay();
  const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(targetDate.setDate(diff));

  // 获取本周日
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 计算周数
  const weekNumber = getWeekNumber(monday);
  const year = monday.getFullYear();
  const weekId = `${year}-W${String(weekNumber).padStart(2, '0')}`;

  return {
    weekId,
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

/**
 * 获取 ISO 周数
 * @param date 日期对象
 * @returns 周数（1-53）
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * 判断时间是否在午休期间
 * @param timeStr 时间字符串 HH:mm
 * @param config 系统配置
 * @returns 是否在午休期间
 */
export function isDuringLunchTime(
  timeStr: string,
  config: { lunchStart: string; lunchEnd: string }
): boolean {
  const minutes = timeToMinutes(timeStr);
  const startMinutes = timeToMinutes(config.lunchStart);
  const endMinutes = timeToMinutes(config.lunchEnd);
  return minutes >= startMinutes && minutes <= endMinutes;
}
