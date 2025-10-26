import { ENROLLMENT_STATUS } from 'src/enrollments/enum/enrollment-status.enum';

interface ClientInfo {
  id: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface ServiceOccurrence {
  scheduleId: string;
  enrollmentId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  client?: ClientInfo | null;
  enrollmentStatus?: ENROLLMENT_STATUS;
}
