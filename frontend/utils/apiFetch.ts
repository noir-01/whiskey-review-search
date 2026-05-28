export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const apiFetch = async <T>(url: string): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    // fetch 자체가 throw = 네트워크 단절/서버 무응답 (상태 코드 없음)
    throw new ApiError("서버에 연결할 수 없습니다.");
  }
  if (!res.ok) {
    throw new ApiError(res.statusText || "요청에 실패했습니다.", res.status);
  }
  return res.json();
};

export const getApiErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    return err.status
      ? `서버 오류가 발생했습니다. (코드: ${err.status} ${err.message})`
      : `서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.`;
  }
  return `에러가 발생했습니다. 다시 시도해주세요. (${err})`;
};

export default apiFetch;
