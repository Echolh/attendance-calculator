/**
 * 考勤状态管理
 */

import { create } from "zustand";
import {
    cleanupOldRecords,
    getDailyRecordsInRange,
    saveDailyRecords,
} from "../services/db.service";
import type {
    CalculationResult,
    SystemConfig,
    WeekRecord,
    WorkRecord,
} from "../types/attendance.types";
import {
    calculateWeekResult,
    createEmptyWorkRecord,
    updateWorkRecordHours,
} from "../utils/calculation.utils";
import { DEFAULT_CONFIG } from "../utils/constants";
import { getCurrentDate } from "../utils/time.utils";

interface AttendanceState {
  // 当前周记录
  currentWeek: WeekRecord | null;
  // 计算结果
  calculationResult: CalculationResult | null;
  // 系统配置
  config: SystemConfig;
  // 加载状态
  isLoading: boolean;
  // 日期范围筛选
  filterStartDate: string | null;
  filterEndDate: string | null;
  // 自动保存定时器
  autoSaveTimer: number | null;

  // Actions
  setCurrentWeek: (week: WeekRecord) => void;
  createNewWeek: (workDays: number, startDate?: string) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<WorkRecord>) => void;
  addRecord: (date: string) => void;
  deleteRecord: (recordId: string) => void;
  setWorkDays: (workDays: number) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  recalculate: () => void;
  setConfig: (config: SystemConfig) => void;
  reset: () => void;
  loadHistoricalData: (startDate: string, endDate: string) => Promise<void>;
  autoSave: () => void;
  manualSave: () => Promise<void>;
  cleanupOldData: () => Promise<void>;
  clearAutoSaveTimer: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  // Initial state
  currentWeek: null,
  calculationResult: null,
  config: DEFAULT_CONFIG,
  isLoading: false,
  filterStartDate: null,
  filterEndDate: null,
  autoSaveTimer: null,

  // 设置当前周
  setCurrentWeek: (week) => {
    set({ currentWeek: week });
    get().recalculate();
  },

  // 创建新周
  createNewWeek: async (workDays, startDate?: string) => {
    const start = startDate || getCurrentDate();
    const startDateObj = new Date(start);

    // 创建工作日记录
    const records: WorkRecord[] = [];

    for (let i = 0; i < workDays; i++) {
      const date = new Date(startDateObj);
      date.setDate(startDateObj.getDate() + i);

      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      records.push(createEmptyWorkRecord(dateStr));
    }

    // 计算结束日期
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + workDays - 1);
    const endDateStr = endDateObj.toISOString().split("T")[0];

    const newWeek: WeekRecord = {
      weekId: `week-${Date.now()}`,
      startDate: start,
      endDate: endDateStr,
      records,
      requiredHours: workDays * 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set({ currentWeek: newWeek });

    // 尝试加载历史数据
    try {
      const historicalRecords = await getDailyRecordsInRange(start, endDateStr);
      if (historicalRecords.length > 0) {
        const updatedRecords = newWeek.records.map((record) => {
          const historicalRecord = historicalRecords.find(
            (hr: WorkRecord) => hr.date === record.date,
          );
          if (historicalRecord) {
            return historicalRecord;
          }
          return record;
        });

        set({
          currentWeek: {
            ...newWeek,
            records: updatedRecords,
          },
        });
      }
    } catch (error) {
      console.error("加载历史数据失败:", error);
    }

    get().recalculate();
  },

  // 更新记录
  updateRecord: (recordId, updates) => {
    const state = get();
    if (!state.currentWeek) return;

    const updatedRecords = state.currentWeek.records.map((record) => {
      if (record.id === recordId) {
        const updated = { ...record, ...updates };
        // 如果有上下班时间，计算有效工时
        if (updated.checkInTime && updated.checkOutTime) {
          return updateWorkRecordHours(updated, state.config);
        }
        // 如果上下班时间不完整，清除计算字段
        return {
          ...updated,
          effectiveHours: undefined,
          overtime: undefined,
        };
      }
      return record;
    });

    const updatedWeek = {
      ...state.currentWeek,
      records: updatedRecords,
    };

    set({ currentWeek: updatedWeek });
    get().recalculate();
  },

  // 添加记录
  addRecord: (date) => {
    const state = get();
    if (!state.currentWeek) return;

    const newRecord = createEmptyWorkRecord(date);
    const updatedWeek = {
      ...state.currentWeek,
      records: [...state.currentWeek.records, newRecord],
    };

    set({ currentWeek: updatedWeek });
  },

  // 删除记录
  deleteRecord: (recordId) => {
    const state = get();
    if (!state.currentWeek) return;

    const updatedRecords = state.currentWeek.records.filter(
      (r) => r.id !== recordId,
    );
    const updatedWeek = {
      ...state.currentWeek,
      records: updatedRecords,
    };

    set({ currentWeek: updatedWeek });
    get().recalculate();
  },

  // 设置工作天数
  setWorkDays: (workDays) => {
    const state = get();
    if (!state.currentWeek) return;

    const updatedWeek = {
      ...state.currentWeek,
      requiredHours: workDays * 8,
    };

    set({ currentWeek: updatedWeek });
    get().recalculate();
  },

  // 设置日期范围筛选
  setDateRange: (startDate, endDate) => {
    set({ filterStartDate: startDate, filterEndDate: endDate });
    get().recalculate();
  },

  // 重新计算
  recalculate: () => {
    const state = get();
    if (!state.currentWeek || !state.config) return;

    // 根据日期范围筛选记录
    let filteredRecords = state.currentWeek.records;
    if (state.filterStartDate && state.filterEndDate) {
      filteredRecords = state.currentWeek.records.filter((record) => {
        return (
          record.date >= state.filterStartDate! &&
          record.date <= state.filterEndDate!
        );
      });
    }

    // 计算筛选后的工作天数
    const filteredWorkDays = filteredRecords.length;

    const result = calculateWeekResult(
      filteredRecords,
      filteredWorkDays, // 使用筛选后的工作天数
      state.config,
    );

    // 更新计算结果中的日期范围信息
    result.filterStartDate = state.filterStartDate || undefined;
    result.filterEndDate = state.filterEndDate || undefined;

    set({ calculationResult: result });
  },

  // 设置配置
  setConfig: (config) => {
    set({ config });
    get().recalculate();
  },

  // 重置
  reset: () => {
    const state = get();
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
    }
    set({
      currentWeek: null,
      calculationResult: null,
      config: DEFAULT_CONFIG,
      isLoading: false,
      filterStartDate: null,
      filterEndDate: null,
      autoSaveTimer: null,
    });
  },

  // 加载历史数据
  loadHistoricalData: async (startDate, endDate) => {
    try {
      const historicalRecords = await getDailyRecordsInRange(
        startDate,
        endDate,
      );

      if (historicalRecords.length === 0) {
        return;
      }

      const state = get();

      const updatedRecords =
        state.currentWeek?.records.map((record) => {
          const historicalRecord = historicalRecords.find(
            (hr: WorkRecord) => hr.date === record.date,
          );
          if (historicalRecord) {
            return historicalRecord;
          }
          return record;
        }) || [];

      if (state.currentWeek) {
        set({
          currentWeek: {
            ...state.currentWeek,
            records: updatedRecords,
          },
        });
        get().recalculate();
      }
    } catch (error) {
      console.error("加载历史数据失败:", error);
    }
  },

  // 自动保存（每20秒）
  autoSave: () => {
    const state = get();
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
    }

    const timer = setTimeout(async () => {
      await get().manualSave();
    }, 20000);

    set({ autoSaveTimer: timer });
  },

  // 手动保存
  manualSave: async () => {
    const state = get();
    if (!state.currentWeek || !state.currentWeek.records.length) {
      return;
    }

    try {
      await saveDailyRecords(state.currentWeek.records);
    } catch (error) {
      console.error("保存失败:", error);
    }
  },

  // 清理旧数据
  cleanupOldData: async () => {
    try {
      await cleanupOldRecords();
    } catch (error) {
      console.error("清理旧数据失败:", error);
    }
  },

  // 清除自动保存定时器
  clearAutoSaveTimer: () => {
    const state = get();
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
      set({ autoSaveTimer: null });
    }
  },
}));
