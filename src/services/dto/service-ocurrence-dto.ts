import { format } from 'date-fns';

export class ServiceOccurrenceDto {
  readonly enrollmentId: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly date: string;
  readonly startTime?: string;
  readonly endTime?: string;

  constructor(data: {
    enrollmentId: string;
    clientId: string;
    clientName: string;
    date: Date;
    startTime?: string | null;
    endTime?: string | null;
  }) {
    this.enrollmentId = data.enrollmentId;
    this.clientId = data.clientId;
    this.clientName = data.clientName;
    this.date = format(data.date, 'yyyy-MM-dd');
    this.startTime = data.startTime?.substring(0, 5) || undefined;
    this.endTime = data.endTime?.substring(0, 5) || undefined;
  }
}
