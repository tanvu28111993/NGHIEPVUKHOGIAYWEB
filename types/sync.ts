
export type CommandType = 'IMPORT' | 'EXPORT' | 'UPDATE' | 'DELETE' | 'IMPORT_BATCH' | 'EXPORT_BATCH' | 'RE_IMPORT_BATCH';

export interface QueueCommand {
  id: string;
  type: CommandType;
  payload: any;
  timestamp: number;
  status?: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount?: number;
}