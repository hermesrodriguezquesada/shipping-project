export interface AdminReportExportStoragePort {
  store(input: { exportId: string; fileName: string; buffer: Buffer }): Promise<{ storagePath: string }>;
  read(input: { storagePath: string }): Promise<Buffer>;
}
