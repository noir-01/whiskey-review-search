export interface NoticeData {
  active: boolean;
  message: string;
  createdAt: number; // 타임스탬프 (ms)
  expiresAt: number; // 만료 타임스탬프 (ms)
  durationHours?: number; // 설정된 노출 시간 (시간 단위)
}
