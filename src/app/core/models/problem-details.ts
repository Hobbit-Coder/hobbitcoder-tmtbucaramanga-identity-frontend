export interface ProblemDetails {
  instance: string;
  detail: string;
  title: string;
  type: string;
  status: number;
  errors: Record<string, string[]>;
}
