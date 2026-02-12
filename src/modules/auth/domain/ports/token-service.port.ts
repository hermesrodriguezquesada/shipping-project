export interface TokenServicePort {
  signAccess(payload: Record<string, any>): Promise<string>;
  signRefresh(payload: Record<string, any>): Promise<string>;

  verifyAccess<T extends object = any>(token: string): Promise<T>;
  verifyRefresh<T extends object = any>(token: string): Promise<T>;
}
