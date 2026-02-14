/**
 * 假期数据同步服务
 */

import dayjs from 'dayjs';

export interface HolidayData {
  date: string;        // MM-DD
  name: string;        // 假期名称
  year: number;        // 年份
  type: 'holiday' | 'weekend';
  isHoliday: boolean;   // 是否为法定假日
}

export interface HolidayInfo {
  date: string;        // MM-DD
  name: string;        // 假期名称
  isHoliday: boolean;   // 是否为法定假日
}

/**
 * 静态假期数据（备选，2026年法定节假日）
 */
const STATIC_HOLIDAYS_2026: HolidayInfo[] = [
  // 元旦：1月1日-3日
  { date: '01-01', name: '元旦', isHoliday: true },
  { date: '01-02', name: '元旦', isHoliday: true },
  { date: '01-03', name: '元旦', isHoliday: true },
  // 春节：2月15日-23日（9天）
  { date: '02-15', name: '春节', isHoliday: true },
  { date: '02-16', name: '春节', isHoliday: true },
  { date: '02-17', name: '春节', isHoliday: true },
  { date: '02-18', name: '春节', isHoliday: true },
  { date: '02-19', name: '春节', isHoliday: true },
  { date: '02-20', name: '春节', isHoliday: true },
  { date: '02-21', name: '春节', isHoliday: true },
  { date: '02-22', name: '春节', isHoliday: true },
  { date: '02-23', name: '春节', isHoliday: true },
  // 清明节：4月4日-6日
  { date: '04-04', name: '清明节', isHoliday: true },
  { date: '04-05', name: '清明节', isHoliday: true },
  { date: '04-06', name: '清明节', isHoliday: true },
  // 劳动节：5月1日-5日
  { date: '05-01', name: '劳动节', isHoliday: true },
  { date: '05-02', name: '劳动节', isHoliday: true },
  { date: '05-03', name: '劳动节', isHoliday: true },
  { date: '05-04', name: '劳动节', isHoliday: true },
  { date: '05-05', name: '劳动节', isHoliday: true },
  // 端午节：5月31日-6月2日
  { date: '05-31', name: '端午节', isHoliday: true },
  { date: '06-01', name: '端午节', isHoliday: true },
  { date: '06-02', name: '端午节', isHoliday: true },
  // 中秋节：9月25日-27日
  { date: '09-25', name: '中秋节', isHoliday: true },
  { date: '09-26', name: '中秋节', isHoliday: true },
  { date: '09-27', name: '中秋节', isHoliday: true },
  // 国庆节：10月1日-8日
  { date: '10-01', name: '国庆节', isHoliday: true },
  { date: '10-02', name: '国庆节', isHoliday: true },
  { date: '10-03', name: '国庆节', isHoliday: true },
  { date: '10-04', name: '国庆节', isHoliday: true },
  { date: '10-05', name: '国庆节', isHoliday: true },
  { date: '10-06', name: '国庆节', isHoliday: true },
  { date: '10-07', name: '国庆节', isHoliday: true },
  { date: '10-08', name: '国庆节', isHoliday: true },
];

/**
 * 从免费API获取假期数据
 * 使用 timor.tech 的免费 API
 */
export async function fetchHolidaysFromAPI(year: number): Promise<HolidayInfo[]> {
  try {
    // 使用 timor.tech 的免费假期 API
    const response = await fetch(`https://timor.tech/api/holiday/year/${year}`);

    if (!response.ok) {
      throw new Error('获取假期数据失败');
    }

    const data = await response.json();

    // 将返回的假期数据转换为 HolidayInfo 数组
    const holidays: HolidayInfo[] = [];
    data.holiday.forEach((item: { date: string; holiday: boolean; name?: string }) => {
      if (item.holiday) {
        const date = dayjs(item.date);
        holidays.push({
          date: date.format('MM-DD'),
          name: item.name || '假期',
          isHoliday: true,
        });
      }
    });

    return holidays.length > 0 ? holidays : STATIC_HOLIDAYS_2026;
  } catch (error) {
    console.error('获取假期数据失败:', error);
    // 失败时返回静态数据
    return STATIC_HOLIDAYS_2026;
  }
}

/**
 * 从本地缓存获取假期数据
 */
export function getHolidaysFromCache(year: number): HolidayInfo[] | null {
  const cacheKey = `holidays_${year}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const data = JSON.parse(cachedData);
    // 检查是否是当月缓存
    const cacheMonth = data.month;
    const currentMonth = new Date().getMonth() + 1;

    if (cacheMonth === currentMonth) {
      return data.holidays;
    }
  }

  return null;
}

/**
 * 保存假期数据到本地缓存
 */
export function saveHolidaysToCache(year: number, holidays: HolidayInfo[]): void {
  const currentMonth = new Date().getMonth() + 1;
  const cacheKey = `holidays_${year}`;

  const data = {
    holidays,
    month: currentMonth,
    timestamp: Date.now(),
  };

  localStorage.setItem(cacheKey, JSON.stringify(data));
}

/**
 * 检查本月是否已同步
 */
export function isSyncedThisMonth(year: number): boolean {
  const cachedData = localStorage.getItem(`holidays_${year}`);

  if (!cachedData) {
    return false;
  }

  const data = JSON.parse(cachedData);
  const cacheMonth = data.month;
  const currentMonth = new Date().getMonth() + 1;

  return cacheMonth === currentMonth;
}

/**
 * 获取上次同步时间
 */
export function getLastSyncTime(year: number): Date | null {
  const cachedData = localStorage.getItem(`holidays_${year}`);

  if (!cachedData) {
    return null;
  }

  const data = JSON.parse(cachedData);
  return new Date(data.timestamp);
}

/**
 * 同步假期数据（优先使用缓存，没有缓存则从API获取）
 */
export async function syncHolidays(year: number): Promise<HolidayInfo[]> {
  // 先尝试从缓存获取
  const cached = getHolidaysFromCache(year);

  if (cached) {
    return cached;
  }

  // 缓存不存在，从API获取
  const holidays = await fetchHolidaysFromAPI(year);

  if (holidays.length > 0) {
    saveHolidaysToCache(year, holidays);
  }

  return holidays;
}
