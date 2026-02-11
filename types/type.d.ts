export interface ClockInDetail {
  inOutType: "IN" | "OUT";
  clockTime: string;
  deviceName: string;
  latitude: string;
  longitude: string;
  officeName: string;
  sourceName: string;
}

export interface AttendanceData {
  attendanceDate: string;
  policyName: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  clockInDetails: ClockInDetail[];
  originalClockInDetails: any[];
  regularizationType: string | null;
  regularizationReason: string | null;
}

export interface AttendanceResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: AttendanceData;
  paginationResponse: any;
}

export interface LookupResponse {
    isSuccess: boolean;
    statusCode: number;
    message: string;
    data: {
        userName: string;
        tenantDetails: {
            tenantId: number;
            tenantName: string;
            // ... other fields not strictly needed
        }[];
    };
}

export interface LoginResponse {
    isSuccess: boolean;
    statusCode: number;
    message: string;
    data: {
        token: string;
        refreshToken: string;
        userModel: {
            employeeCode: number | string;
            firstName: string;
            lastName: string;
            email: string;
            // ... other fields
        }
    }
}

export interface CardDetailsResponse {
    isSuccess: boolean;
    statusCode: number;
    message: string;
    data: {
        employeeCode: number;
        cardDetails: {
            present: { type: string; totalPresent: number };
            offDays: { type: string; totalHoliday: number; totalWeekoff: number; totalLeave: number };
            absent: { type: string; totalAbsent: number; irRegularity: number };
            regularization: { type: string; applied: number; approved: number; pending: number };
            gracePeriod: { type: string; lateIn: number; earlyOut: number };
            penalty: any;
            overTime: any;
            workingHours: { type: string; total: number; dayAvg: number };
        };
    };
    paginationResponse: any;
}