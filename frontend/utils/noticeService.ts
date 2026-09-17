import { NoticeData } from "@/types/notice";

const GIST_FILE_NAME = "w-notice.json";
const CACHE_KEY = "whiskey_notice_cache";
const CACHE_TTL_MS = 60 * 1000; // 1분 캐시로 API 요청 제한 방지

export const getStoredGistId = (): string => {
  if (process.env.NEXT_PUBLIC_GIST_ID) {
    return process.env.NEXT_PUBLIC_GIST_ID.trim();
  }
  if (typeof window !== "undefined") {
    return localStorage.getItem("whiskey_gist_id")?.trim() || "";
  }
  return "";
};

export const setStoredGistId = (gistId: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("whiskey_gist_id", gistId.trim());
  }
};

export const getStoredToken = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("whiskey_admin_token")?.trim() || "";
  }
  return "";
};

export const setStoredToken = (token: string): void => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("whiskey_admin_token", token.trim());
    } else {
      localStorage.removeItem("whiskey_admin_token");
    }
  }
};

export const clearNoticeCache = (): void => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CACHE_KEY);
  }
};

export const fetchNotice = async (
  customGistId?: string,
  bypassCache = false
): Promise<NoticeData | null> => {
  const gistId = customGistId?.trim() || getStoredGistId();
  if (!gistId) {
    return null;
  }

  // 1. 캐시 확인 (새로고침 시 불필요한 API 소진 방지)
  if (!bypassCache && typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data as NoticeData;
        }
      }
    } catch {
      // 캐시 파싱 에러 시 무시하고 새로 요청
    }
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      // 404나 403(Rate limit) 등의 경우 null 반환
      return null;
    }

    const gist = await res.json();
    const files = gist.files || {};

    // w-notice.json 우선 탐색, 없으면 첫 번째 .json 파일 탐색
    let targetFile = files[GIST_FILE_NAME];
    if (!targetFile) {
      const jsonFileName = Object.keys(files).find((k) => k.endsWith(".json"));
      if (jsonFileName) {
        targetFile = files[jsonFileName];
      }
    }

    if (!targetFile || !targetFile.content) {
      return null;
    }

    const noticeData = JSON.parse(targetFile.content) as NoticeData;

    // 캐시 저장
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: noticeData, timestamp: Date.now() })
        );
      } catch {}
    }

    return noticeData;
  } catch (err) {
    console.error("공지사항 조회 실패:", err);
    return null;
  }
};

export const updateNotice = async (
  data: NoticeData,
  token: string,
  customGistId?: string
): Promise<{ success: boolean; error?: string }> => {
  const gistId = customGistId?.trim() || getStoredGistId();
  if (!gistId) {
    return { success: false, error: "Gist ID가 설정되지 않았습니다." };
  }
  if (!token) {
    return { success: false, error: "GitHub 토큰(암호)을 입력해주세요." };
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: {
          [GIST_FILE_NAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (res.status === 200) {
      clearNoticeCache();
      return { success: true };
    }

    if (res.status === 401) {
      return {
        success: false,
        error: "토큰이 올바르지 않습니다. Personal Access Token을 확인해주세요.",
      };
    }
    if (res.status === 404) {
      return {
        success: false,
        error: "Gist를 찾을 수 없습니다. Gist ID를 확인해주세요.",
      };
    }
    if (res.status === 403) {
      return {
        success: false,
        error: "토큰의 권한이 부족합니다. 'gist' 권한이 부여된 토큰인지 확인해주세요.",
      };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.message || `오류가 발생했습니다 (코드: ${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "네트워크 오류가 발생했습니다.",
    };
  }
};
