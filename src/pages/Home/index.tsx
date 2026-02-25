/**
 * 主页面
 */

import {
    FileImageOutlined,
    HistoryOutlined,
    QuestionCircleOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    ConfigProvider,
    DatePicker,
    message,
    Tooltip,
} from "antd";
import zhCN from "antd/es/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import html2canvas from "html2canvas";
import React, { useEffect, useRef, useState } from "react";
import VersionLogModal from "../../components/VersionLogModal";
import {
    isSyncedThisMonth,
    syncHolidays,
    type HolidayInfo,
} from "../../services/holiday.service";
import { useAttendanceStore } from "../../stores/attendance.store";
import type { WorkRecord } from "../../types/attendance.types";
import { createEmptyWorkRecord } from "../../utils/calculation.utils";
import { isCompleteTime, timeToMinutes } from "../../utils/time.utils";
import "./index.css";

const { RangePicker } = DatePicker;

const Home: React.FC = () => {
  const {
    currentWeek,
    calculationResult,
    createNewWeek,
    updateRecord,
    setDateRange: setStoreDateRange,
    autoSave,
    manualSave,
    cleanupOldData,
    clearAutoSaveTimer,
  } = useAttendanceStore();

  const exportRef = useRef<HTMLDivElement>(null);
  const [pickerDateRange, setPickerDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const [holidays, setHolidays] = useState<HolidayInfo[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncedThisMonth, setSyncedThisMonth] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showVersionLog, setShowVersionLog] = useState<boolean>(false);
  const [manualFocus, setManualFocus] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // 为每个输入框创建 ref
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // 跟踪每个输入框的跳转定时器
  const jumpTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 设置 dayjs 中文语言
  useEffect(() => {
    dayjs.locale("zh-cn");
  }, []);

  // 组件挂载时清理旧数据
  useEffect(() => {
    cleanupOldData();
  }, [cleanupOldData]);

  // 数据变化时触发自动保存
  useEffect(() => {
    if (currentWeek && currentWeek.records.length > 0) {
      autoSave();
    }
  }, [currentWeek, autoSave]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      clearAutoSaveTimer();
    };
  }, [clearAutoSaveTimer]);

  // 检查是否需要显示引导页
  useEffect(() => {
    if (!currentWeek) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
  }, [currentWeek]);

  // 处理引导页的日期选择
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWelcomeDateSelect = (dates: any) => {
    if (dates && dates.length === 2) {
      const startDate = dates[0].format("YYYY-MM-DD");

      const daysDiff = dates[1].diff(dates[0], "days") + 1;
      if (daysDiff > 7) {
        message.warning("⚠️ 日期范围不能超过7天");
        return;
      }

      // 设置日期选择器的值
      setPickerDateRange(dates);

      // 创建新周记录，传入开始日期
      createNewWeek(daysDiff, startDate);
      setShowWelcome(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      const startDate = dates[0].format("YYYY-MM-DD");
      const endDate = dates[1].format("YYYY-MM-DD");

      const daysDiff = dates[1].diff(dates[0], "days");
      if (daysDiff > 7) {
        message.warning("⚠️ 日期范围不能超过7天");
        return;
      }

      setPickerDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
      setStoreDateRange(startDate, endDate);

      // 更新打卡记录以匹配新的日期范围
      updateRecordsForDateRange(startDate, endDate);
    } else {
      setPickerDateRange(null);
      setStoreDateRange(null, null);
    }
  };

  // 更新打卡记录以匹配新的日期范围
  const updateRecordsForDateRange = (startDate: string, endDate: string) => {
    if (!currentWeek) return;

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const daysDiff = end.diff(start, "days") + 1;

    // 生成新的日期列表
    const newDates: string[] = [];
    for (let i = 0; i < daysDiff; i++) {
      newDates.push(start.add(i, "day").format("YYYY-MM-DD"));
    }

    // 获取现有记录的日期
    const existingDates = currentWeek.records.map((r) => r.date);

    // 找出需要添加的日期
    const datesToAdd = newDates.filter((d) => !existingDates.includes(d));

    // 找出需要删除的记录
    const recordsToDelete = currentWeek.records.filter(
      (r) => !newDates.includes(r.date),
    );

    // 添加新记录
    datesToAdd.forEach((date) => {
      const newRecord = createEmptyWorkRecord(date);
      currentWeek.records.push(newRecord);
    });

    // 删除不需要的记录
    const updatedRecords = currentWeek.records.filter(
      (r) => !recordsToDelete.find((del) => del.id === r.id),
    );

    // 按日期排序
    updatedRecords.sort((a, b) => a.date.localeCompare(b.date));

    // 更新当前周记录
    const updatedWeek = {
      ...currentWeek,
      records: updatedRecords,
      startDate,
      endDate,
      requiredHours: daysDiff * 8,
    };

    // 更新store
    const { setCurrentWeek } = useAttendanceStore.getState();
    setCurrentWeek(updatedWeek);
  };

  const handleSyncHolidays = async () => {
    const currentYear = new Date().getFullYear();

    if (syncedThisMonth || isSyncedThisMonth(currentYear)) {
      message.warning("⚠️ 本月已同步过假期数据，每月只能同步一次");
      return;
    }

    setSyncing(true);

    try {
      const syncedHolidays = await syncHolidays(currentYear);
      setHolidays(syncedHolidays);
      setSyncedThisMonth(true);

      message.success("✅ 假期数据同步成功");
    } catch {
      message.error("❌ 同步失败，请稍后重试");
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!currentWeek || !currentWeek.records.length) {
      message.warning("⚠️ 没有数据可保存");
      return;
    }

    try {
      await manualSave();
      message.success("✅ 已保存");
    } catch {
      message.error("❌ 保存失败");
    }
  };

  const handleExportImage = async () => {
    if (!currentWeek || !calculationResult) {
      message.error("没有数据可导出");
      return;
    }

    if (!exportRef.current) {
      message.error("导出失败，请刷新页面重试");
      return;
    }

    setExporting(true);

    try {
      const element = exportRef.current;
      const canvas = await html2canvas(element!, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          message.error("导出失败");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `考勤记录_${currentWeek.startDate}_${dayjs().format("YYYYMMDDHHmmss")}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        message.success("✅ 已导出为图片");
      }, "image/png");
    } catch (error) {
      message.error("❌ 导出失败");
      console.error("导出错误:", error);
    } finally {
      setExporting(false);
    }
  };

  const dateRender = (current: dayjs.Dayjs) => {
    const dayOfWeek = current.day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dateStr = current.format("MM-DD");
    const holidayInfo = holidays.find((h) => h.date === dateStr);

    let className = "ant-picker-cell-inner";

    if (holidayInfo?.isHoliday) {
      className += " holiday";
    } else if (isWeekend) {
      className += " weekend";
    }

    const content = <div className={className}>{current.date()}</div>;

    if (holidayInfo?.isHoliday) {
      return (
        <Tooltip title={holidayInfo.name} placement="top">
          {content}
        </Tooltip>
      );
    }

    return content;
  };

  const handleRecordChange = (
    record: WorkRecord,
    field: keyof WorkRecord,
    value: string | number | undefined,
  ) => {
    let newValue = value;

    if (field === "checkInTime") {
      if (
        newValue &&
        timeToMinutes(String(newValue)) < timeToMinutes("08:00")
      ) {
        newValue = "08:00";
        message.info("🕘 上班时间已调整为 8:00（不能早于8点）");
      }
    }

    if (field === "checkOutTime" && newValue) {
      const checkOutMinutes = timeToMinutes(String(newValue));
      const minOffTime = timeToMinutes("18:00");

      if (checkOutMinutes < minOffTime) {
        // 检查今天是否需要工作满8小时
        if (calculationResult) {
          const todayRequired = Math.max(calculationResult.remainingHours, 0);
          // 如果今天需要工作满8小时，则不允许早于18:00
          if (todayRequired >= 8) {
            message.warning("⚠️ 下班时间不能早于 18:00");
            return;
          }
        } else {
          message.warning("⚠️ 下班时间不能早于 18:00");
          return;
        }
      }
    }

    if (field === "checkOutTime" && newValue && record.checkInTime) {
      if (
        timeToMinutes(String(newValue)) <= timeToMinutes(record.checkInTime)
      ) {
        message.warning("⚠️ 下班时间必须晚于上班时间");
        return;
      }
    }

    if (field === "appliedOvertime") {
      if (newValue !== undefined) {
        const overtimeValue = Number(newValue);

        if (overtimeValue < 0) {
          message.warning("⚠️ 加班时长不能为负数");
          return;
        }

        if (overtimeValue > 8) {
          message.warning("⚠️ 加班时长不能超过8小时");
          return;
        }

        if (overtimeValue > 0 && Math.round(overtimeValue * 10) % 5 !== 0) {
          message.warning("⚠️ 加班时长必须以0.5小时为单位");
          return;
        }

        if (record.checkInTime && record.checkOutTime) {
          const checkInMinutes = timeToMinutes(record.checkInTime);
          const checkOutMinutes = timeToMinutes(record.checkOutTime);

          let workMinutes = checkOutMinutes - checkInMinutes;

          const lunchStart = timeToMinutes("12:00");
          const lunchEnd = timeToMinutes("14:00");

          if (checkInMinutes < lunchEnd && checkOutMinutes > lunchStart) {
            workMinutes -= lunchEnd - lunchStart;
          }

          const workHours = workMinutes / 60;

          if (workHours <= 8) {
            message.warning("⚠️ 工作时长不足8小时，不能填写加班时长");
            return;
          }

          const maxOvertime = Math.round((workHours - 8) * 10) / 10;

          if (overtimeValue > maxOvertime + 0.01) {
            message.warning(
              `⚠️ 加班时长不能超过超出8小时的部分（最多${maxOvertime.toFixed(1)}小时）`,
            );
            return;
          }
        }
      }
    }

    updateRecord(record.id, { [field]: newValue });

    // 智能跳转光标（带延迟，避免在输入过程中跳转）
    if (!manualFocus) {
      const fieldKey = `${record.id}-${field}`;

      // 清除之前的定时器
      const existingTimer = jumpTimersRef.current.get(fieldKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // 设置新的定时器，800ms后跳转
      const timer = setTimeout(() => {
        // 延迟执行以确保 state 已更新
        scheduleJump(record.id, field);
      }, 800);

      jumpTimersRef.current.set(fieldKey, timer);
    }

    // 重置手动标记
    setManualFocus(false);
  };

  // 执行跳转逻辑
  const scheduleJump = (recordId: string, field: keyof WorkRecord) => {
    if (!currentWeek) return;

    const record = currentWeek.records.find(r => r.id === recordId);
    if (!record) return;

    const recordIndex = currentWeek.records.findIndex(
      (r) => r.id === recordId,
    );
    const value = record[field];

    if (field === "checkInTime") {
      if (value && isCompleteTime(String(value))) {
        const nextKey = `${recordId}-checkOutTime`;
        const nextInput = inputRefs.current.get(nextKey);
        nextInput?.focus();
      }
    } else if (field === "checkOutTime") {
      if (value && isCompleteTime(String(value))) {
        const nextRecord = currentWeek.records[recordIndex + 1];
        if (nextRecord) {
          const nextKey = `${nextRecord.id}-checkInTime`;
          const nextInput = inputRefs.current.get(nextKey);
          nextInput?.focus();
        }
      }
    } else if (field === "appliedOvertime") {
      if (value !== undefined && value !== null && value !== "") {
        const nextRecord = currentWeek.records[recordIndex + 1];
        if (nextRecord) {
          const nextKey = `${nextRecord.id}-checkInTime`;
          const nextInput = inputRefs.current.get(nextKey);
          nextInput?.focus();
        }
      }
    }
  };

  if (showWelcome) {
    return (
      <ConfigProvider locale={zhCN}>
        <div className="welcome-page">
          <div className="welcome-card">
            <div className="welcome-icon">📅</div>
            <h1 className="welcome-title">欢迎使用考勤计算器</h1>
            <p className="welcome-desc">请选择您要记录的日期范围（最多7天）</p>

            <div className="welcome-picker">
              <RangePicker
                size="large"
                format="YYYY-MM-DD"
                placeholder={["开始日期", "结束日期"]}
                onChange={handleWelcomeDateSelect}
                dateRender={dateRender}
                style={{ width: 400 }}
              />
            </div>

            <div className="welcome-tips">
              <p>💡 选择的日期范围将自动创建对应天数的打卡记录</p>
              <p>💡 之后可以再次使用日期筛选器来筛选统计范围</p>
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  if (!currentWeek || !calculationResult) {
    return <div className="loading">加载中...</div>;
  }

  // 根据实际日期判断"今天"
  const todayDate = dayjs().format("YYYY-MM-DD");
  const todayIndex = currentWeek.records.findIndex((r) => r.date === todayDate);

  // 计算进度条宽度（基于工时完成度）
  const progressWidth = Math.min(
    100,
    (calculationResult.totalEffectiveHours / calculationResult.requiredHours) *
      100,
  );

  // 进度显示：已完成天数/总天数
  const totalDays = currentWeek.records.length;
  const progressText = `${calculationResult.workDays}/${totalDays}`;

  return (
    <ConfigProvider locale={zhCN}>
      <div className="home-page" ref={exportRef}>
        <div className="header">
          <h1 className="app-title">考勤计算器</h1>
        </div>

        <div className="main-layout">
          <div className="left-sidebar">
            <Card className="stats-card" bodyStyle={{ padding: 16 }}>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">已完成</div>
                  <div className="stat-value">
                    {calculationResult.workDays}{" "}
                    <span className="unit">天</span>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-label">总工时</div>
                  <div className="stat-value">
                    {Math.floor(calculationResult.totalEffectiveHours)}
                    <span className="unit">h</span>
                    {Math.round(
                      (calculationResult.totalEffectiveHours % 1) * 60,
                    )}
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-label">要求工时</div>
                  <div className="stat-value">
                    {calculationResult.requiredHours}{" "}
                    <span className="unit">h</span>
                  </div>
                </div>

                <div className="stat-box highlight">
                  <div className="stat-label">还需工时</div>
                  <div className="stat-value highlight">
                    {Math.max(0, Math.floor(calculationResult.remainingHours))}
                    <span className="unit">h</span>
                    {Math.max(
                      0,
                      Math.round((calculationResult.remainingHours % 1) * 60),
                    )}
                  </div>
                </div>

                {calculationResult.todayOffTime && (
                  <div className="stat-box today-result">
                    <div className="stat-label">🚀 今天下班</div>
                    <div className="stat-value time-result">
                      {calculationResult.todayOffTime}
                    </div>
                    {calculationResult.todayOvertime &&
                      calculationResult.todayOvertime > 0.1 && (
                        <div className="stat-overtime">
                          +{calculationResult.todayOvertime.toFixed(2)}h
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="progress-section">
                <div className="progress-label">
                  本周进度
                  <Tooltip title="本周已完成工时 / 本周要求工时">
                    <QuestionCircleOutlined
                      style={{ marginLeft: 4, color: "#999", fontSize: 14 }}
                    />
                  </Tooltip>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: progressWidth + "%" }}
                  />
                </div>
                <div className="progress-text">{progressText}</div>
              </div>
            </Card>

            <Card className="tips-card" size="small">
              <div className="tips">
                💡 点击输入框可选择时间，或直接手动输入
                <br />
                💡 可通过日期筛选器选择统计范围（最多7天）
                <br />
                💡 点击"保存"可保存数据，"导出图片"可生成图片
              </div>
            </Card>
          </div>

          <div className="center-content">
            <Card
              className="records-card"
              title={
                <div className="records-card-title">
                  <span>打卡记录</span>
                  <div className="records-actions">
                    <RangePicker
                      size="small"
                      value={pickerDateRange}
                      format="YYYY-MM-DD"
                      placeholder={["开始日期", "结束日期"]}
                      style={{ width: 280 }}
                      onChange={handleDateRangeChange}
                      dateRender={dateRender}
                    />
                    <Tooltip title="同步本月假期数据">
                      <Button
                        type="default"
                        size="small"
                        icon={<SyncOutlined />}
                        onClick={handleSyncHolidays}
                        loading={syncing}
                        disabled={syncedThisMonth}
                        style={{ marginLeft: 8 }}
                      />
                    </Tooltip>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleSave}
                      style={{ marginLeft: 8 }}
                    >
                      💾 保存
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<FileImageOutlined />}
                      onClick={handleExportImage}
                      loading={exporting}
                      style={{ marginLeft: 8 }}
                    >
                      导出图片
                    </Button>
                  </div>
                </div>
              }
              bodyStyle={{ padding: 12 }}
            >
              <div className="records-list">
                {currentWeek.records.map((record, index) => {
                  const isToday = index === todayIndex;
                  const dayNum = index + 1;

                  // 解析日期获取星期和月日
                  const recordDate = dayjs(record.date);
                  const weekDay = [
                    "周一",
                    "周二",
                    "周三",
                    "周四",
                    "周五",
                    "周六",
                    "周日",
                  ][recordDate.day() === 0 ? 6 : recordDate.day() - 1];
                  const monthDay = recordDate.format("MM-DD");

                  return (
                    <div
                      key={record.id}
                      className={"record-row" + (isToday ? " today" : "")}
                    >
                      <div className="record-day">
                        <span className="day-number">{dayNum}</span>
                        <span className="day-date">{monthDay}</span>
                        <span className="day-name">{weekDay}</span>
                        {isToday && <span className="today-badge">今天</span>}
                      </div>

                      <div className="record-inputs">
                        <div className="time-inputs">
                          <input
                            ref={(el) => {
                              if (el)
                                inputRefs.current.set(
                                  `${record.id}-checkInTime`,
                                  el,
                                );
                            }}
                            type="time"
                            className="time-input"
                            value={record.checkInTime}
                            onChange={(e) =>
                              handleRecordChange(
                                record,
                                "checkInTime",
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Delete" || e.key === "Backspace") {
                                setManualFocus(true);
                              }
                            }}
                          />
                          <span className="time-separator">→</span>
                          <input
                            ref={(el) => {
                              if (el)
                                inputRefs.current.set(
                                  `${record.id}-checkOutTime`,
                                  el,
                                );
                            }}
                            type="time"
                            className="time-input"
                            value={record.checkOutTime || ""}
                            onChange={(e) =>
                              handleRecordChange(
                                record,
                                "checkOutTime",
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Delete" || e.key === "Backspace") {
                                setManualFocus(true);
                              }
                            }}
                          />
                          {record.checkInTime && record.checkOutTime && record.effectiveHours !== undefined && (
                            <div className="record-hours-inline">
                              {(() => {
                                const hours = Math.floor(record.effectiveHours);
                                const mins = Math.round(
                                  (record.effectiveHours % 1) * 60,
                                );
                                const totalDiffMins = Math.round(
                                  (record.effectiveHours - 8) * 60,
                                );

                                const timeStr =
                                  hours > 0 ? `${hours}h${mins}m` : `${mins}m`;
                                const diffStr =
                                  totalDiffMins > 0
                                    ? `(+${totalDiffMins}m)`
                                    : totalDiffMins < 0
                                      ? `(${totalDiffMins}m)`
                                      : "";

                                return (
                                  <span
                                    className={
                                      totalDiffMins > 0
                                        ? "hours-positive"
                                        : totalDiffMins < 0
                                          ? "hours-negative"
                                          : ""
                                    }
                                  >
                                    {timeStr}
                                    {diffStr}
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="overtime-input">
                          <input
                            ref={(el) => {
                              if (el)
                                inputRefs.current.set(
                                  `${record.id}-appliedOvertime`,
                                  el,
                                );
                            }}
                            type="number"
                            className="overtime-number"
                            min={0}
                            max={8}
                            step={0.5}
                            value={record.appliedOvertime || ""}
                            onChange={(e) =>
                              handleRecordChange(
                                record,
                                "appliedOvertime",
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value) || 0,
                              )
                            }
                            onClick={(e) => {
                              setManualFocus(true);
                              (e.target as HTMLInputElement).select();
                            }}
                            placeholder=""
                          />
                          <span className="overtime-label">h 加班</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="right-sidebar">
            <Card className="logs-card">
              <div className="logs-header">
                <div className="logs-title">更新日志</div>
                <Button
                  type="default"
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => setShowVersionLog(true)}
                >
                  查看
                </Button>
              </div>
              <div className="logs-content">
                <div className="log-item">
                  <div className="log-version">v1.0.0</div>
                  <div className="log-date">2024-01-01</div>
                  <div className="log-desc">初始版本发布</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <VersionLogModal
          visible={showVersionLog}
          onClose={() => setShowVersionLog(false)}
        />
      </div>
    </ConfigProvider>
  );
};

export default Home;
