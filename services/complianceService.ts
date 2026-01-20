import { Unit, MeetingSchedule, ComplianceStatus } from '../types';
import { firebaseService } from './firebaseService';
import { gasService } from './gasService';

export const complianceService = {
  /**
   * Check if a unit has attendance record for a specific week
   */
  checkAttendanceCompliance: async (unitName: string, weekNumber: number, year: number): Promise<boolean> => {
    try {
      const attendanceRecords = await firebaseService.getAttendanceByUnit(unitName);

      // Check if there's any attendance record with matching week
      const hasRecord = attendanceRecords.some(record => {
        // Extract week number from record.week (e.g., "Minggu 1" -> 1)
        const recordWeek = parseInt(record.week.replace(/\D/g, ''));
        return recordWeek === weekNumber && record.date.startsWith(year.toString());
      });

      return hasRecord;
    } catch (e) {
      console.error('Error checking attendance compliance:', e);
      return false;
    }
  },

  /**
   * Check if a unit has weekly report for a specific week
   */
  checkReportCompliance: async (unitName: string, weekNumber: number, year: number): Promise<boolean> => {
    try {
      const reports = await gasService.getWeeklyReports(unitName, year);

      // Check if there's any report with matching week number
      const hasReport = reports.some(report => {
        // Check if report activity contains week number
        const reportActivity = report.activity.toLowerCase();
        return reportActivity.includes(`minggu ${weekNumber}`) ||
               reportActivity.includes(`m${weekNumber}`) ||
               reportActivity.includes(`week ${weekNumber}`);
      });

      return hasReport;
    } catch (e) {
      console.error('Error checking report compliance:', e);
      return false;
    }
  },

  /**
   * Get compliance status for a unit based on meeting schedule
   */
  getUnitCompliance: async (unit: Unit, schedule: MeetingSchedule): Promise<ComplianceStatus> => {
    const hasAttendance = await complianceService.checkAttendanceCompliance(
      unit.name,
      schedule.weekNumber,
      schedule.year
    );

    const hasReport = await complianceService.checkReportCompliance(
      unit.name,
      schedule.weekNumber,
      schedule.year
    );

    const isCompliant = hasAttendance && hasReport;

    return {
      unitId: unit.id,
      unitName: unit.name,
      weekNumber: schedule.weekNumber,
      hasAttendance,
      hasReport,
      isCompliant,
      deadline: schedule.deadline
    };
  },

  /**
   * Check if deadline has passed
   */
  isDeadlinePassed: (deadline: string): boolean => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > deadlineDate;
  },

  /**
   * Get all non-compliant units for a category
   */
  getNonCompliantUnits: async (
    units: Unit[],
    schedules: MeetingSchedule[]
  ): Promise<Map<string, ComplianceStatus[]>> => {
    const nonCompliantMap = new Map<string, ComplianceStatus[]>();

    for (const unit of units) {
      const nonCompliantStatuses: ComplianceStatus[] = [];

      // Check each schedule for this unit's category
      const unitSchedules = schedules.filter(s => s.category === unit.category);

      for (const schedule of unitSchedules) {
        // Only check if deadline has passed
        if (complianceService.isDeadlinePassed(schedule.deadline)) {
          const status = await complianceService.getUnitCompliance(unit, schedule);

          if (!status.isCompliant) {
            nonCompliantStatuses.push(status);
          }
        }
      }

      if (nonCompliantStatuses.length > 0) {
        nonCompliantMap.set(unit.id, nonCompliantStatuses);
      }
    }

    return nonCompliantMap;
  },

  /**
   * Count total non-compliant weeks for a unit
   */
  countNonCompliantWeeks: (complianceStatuses: ComplianceStatus[]): number => {
    return complianceStatuses.length;
  }
};
