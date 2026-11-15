export type ApplicationStatus = "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED";

export interface ApplicationBase {
  company_name: string;
  job_title: string;
  job_url?: string | null;
  notes?: string | null;
  status?: ApplicationStatus;
  interview_date?: string | null;
}

export interface ApplicationCreate extends ApplicationBase {}

export interface ApplicationUpdate {
  company_name?: string | null;
  job_title?: string | null;
  job_url?: string | null;
  notes?: string | null;
  status?: ApplicationStatus | null;
  interview_date?: string | null;
}

export interface ApplicationResponse extends ApplicationBase {
  id: number;
  user_id: number;
  status: ApplicationStatus;
  created_at: string;
  updated_at?: string | null;
  url?: string | null;
}

export interface ListApplicationsParams {
  status?: ApplicationStatus;
  q?: string;
}
