/**
 * IndexedDB 数据库服务
 */

import Dexie from "dexie";
import type {
    SystemConfig,
    WeekRecord,
    WorkRecord,
} from "../types/attendance.types";
import {
    CONFIG_KEY,
    DB_NAME,
    DB_VERSION,
    DEFAULT_CONFIG,
} from "../utils/constants";

/**
 * 每日记录
 */
export interface DailyRecord {
  id: string;
  date: string;
  record: WorkRecord;
  createdAt: number;
  updatedAt: number;
}

/**
 * 考勤计算器数据库类
 */
class AttendanceDatabase extends Dexie {
  weeks!: Dexie.Table<WeekRecord, string>;
  configs!: Dexie.Table<{ key: string; value: SystemConfig }, string>;
  dailyRecords!: Dexie.Table<DailyRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      weeks: "weekId, startDate, endDate, createdAt",
      configs: "key",
      dailyRecords: "date, createdAt, updatedAt",
    });
  }
}

const db = new AttendanceDatabase();

/**
 * 保存周记录
 * @param weekRecord 周记录
 */
export async function saveWeekRecord(weekRecord: WeekRecord): Promise<void> {
  try {
    weekRecord.updatedAt = Date.now();
    await db.weeks.put(weekRecord);
  } catch (error) {
    console.error("保存周记录失败:", error);
    throw new Error("保存周记录失败");
  }
}

/**
 * 获取周记录
 * @param weekId 周ID
 * @returns 周记录或 null
 */
export async function getWeekRecord(
  weekId: string,
): Promise<WeekRecord | undefined> {
  try {
    return await db.weeks.get(weekId);
  } catch (error) {
    console.error("获取周记录失败:", error);
    throw new Error("获取周记录失败");
  }
}

/**
 * 获取所有周记录
 * @returns 周记录数组
 */
export async function getAllWeeks(): Promise<WeekRecord[]> {
  try {
    return await db.weeks.orderBy("createdAt").reverse().toArray();
  } catch (error) {
    console.error("获取所有周记录失败:", error);
    throw new Error("获取所有周记录失败");
  }
}

/**
 * 删除周记录
 * @param weekId 周ID
 */
export async function deleteWeekRecord(weekId: string): Promise<void> {
  try {
    await db.weeks.delete(weekId);
  } catch (error) {
    console.error("删除周记录失败:", error);
    throw new Error("删除周记录失败");
  }
}

/**
 * 获取系统配置
 * @returns 系统配置
 */
export async function getConfig(): Promise<SystemConfig> {
  try {
    const config = await db.configs.get(CONFIG_KEY);
    return config?.value || DEFAULT_CONFIG;
  } catch (error) {
    console.error("获取系统配置失败:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * 保存系统配置
 * @param config 系统配置
 */
export async function saveConfig(config: SystemConfig): Promise<void> {
  try {
    await db.configs.put({ key: CONFIG_KEY, value: config });
  } catch (error) {
    console.error("保存系统配置失败:", error);
    throw new Error("保存系统配置失败");
  }
}

/**
 * 导出所有数据为 JSON
 * @returns JSON Blob
 */
export async function exportAllData(): Promise<Blob> {
  try {
    const weeks = await getAllWeeks();
    const config = await getConfig();

    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      data: {
        weeks,
        config,
      },
    };

    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: "application/json" });
  } catch (error) {
    console.error("导出数据失败:", error);
    throw new Error("导出数据失败");
  }
}

/**
 * 从 JSON 导入数据
 * @param json JSON 字符串
 */
export async function importData(json: string): Promise<void> {
  try {
    const data = JSON.parse(json);

    if (!data.data || !Array.isArray(data.data.weeks)) {
      throw new Error("数据格式不正确");
    }

    // 清空现有数据
    await db.weeks.clear();

    // 导入周记录
    await db.weeks.bulkAdd(data.data.weeks);

    // 导入配置（如果有）
    if (data.data.config) {
      await saveConfig(data.data.config);
    }
  } catch (error) {
    console.error("导入数据失败:", error);
    throw new Error("导入数据失败");
  }
}

/**
 * 清空所有数据
 */
export async function clearAllData(): Promise<void> {
  try {
    await db.weeks.clear();
    await db.configs.clear();
    await db.dailyRecords.clear();
  } catch (error) {
    console.error("清空数据失败:", error);
    throw new Error("清空数据失败");
  }
}

/**
 * 保存每日记录
 * @param date 日期 YYYY-MM-DD
 * @param record 工作记录
 */
export async function saveDailyRecord(
  date: string,
  record: WorkRecord,
): Promise<void> {
  try {
    const dailyRecord: DailyRecord = {
      id: `daily-${date}`,
      date,
      record,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.dailyRecords.put(dailyRecord);
  } catch (error) {
    console.error("保存每日记录失败:", error);
    throw new Error("保存每日记录失败");
  }
}

/**
 * 批量保存每日记录
 * @param records 工作记录数组
 */
export async function saveDailyRecords(records: WorkRecord[]): Promise<void> {
  try {
    const dailyRecords: DailyRecord[] = records.map((record) => ({
      id: `daily-${record.date}`,
      date: record.date,
      record,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    await db.dailyRecords.bulkPut(dailyRecords);
  } catch (error) {
    console.error("批量保存每日记录失败:", error);
    throw new Error("批量保存每日记录失败");
  }
}

/**
 * 获取指定日期的记录
 * @param date 日期 YYYY-MM-DD
 * @returns 工作记录或 undefined
 */
export async function getDailyRecord(
  date: string,
): Promise<WorkRecord | undefined> {
  try {
    const dailyRecord = await db.dailyRecords.get(`daily-${date}`);
    return dailyRecord?.record;
  } catch (error) {
    console.error("获取每日记录失败:", error);
    throw new Error("获取每日记录失败");
  }
}

/**
 * 获取指定日期范围内的记录
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 * @returns 工作记录数组
 */
export async function getDailyRecordsInRange(
  startDate: string,
  endDate: string,
): Promise<WorkRecord[]> {
  try {
    const dailyRecords = await db.dailyRecords
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();

    return dailyRecords.map((dr) => dr.record);
  } catch (error) {
    console.error("获取日期范围内的记录失败:", error);
    throw new Error("获取日期范围内的记录失败");
  }
}

/**
 * 清理30天之前的数据
 */
export async function cleanupOldRecords(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

    await db.dailyRecords.where("date").below(cutoffDate).delete();
  } catch (error) {
    console.error("清理旧记录失败:", error);
    throw new Error("清理旧记录失败");
  }
}

/**
 * 获取所有每日记录（按日期倒序）
 * @returns 每日记录数组
 */
export async function getAllDailyRecords(): Promise<DailyRecord[]> {
  try {
    return await db.dailyRecords.orderBy("date").reverse().toArray();
  } catch (error) {
    console.error("获取所有每日记录失败:", error);
    throw new Error("获取所有每日记录失败");
  }
}

export default db;
