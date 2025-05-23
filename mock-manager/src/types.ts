/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Mock {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  headers?: Record<string, string>;
  body?: any;
  transactionId?: string;
  transactionTime?: string;
  active: boolean;
}
