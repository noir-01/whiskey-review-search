import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CampaignIcon from "@mui/icons-material/Campaign";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { NoticeData } from "@/types/notice";
import {
  fetchNotice,
  updateNotice,
  getStoredGistId,
  setStoredGistId,
  getStoredToken,
  setStoredToken,
} from "@/utils/noticeService";
import snackbar from "@/utils/snackbar";

const PRESET_HOURS = [1, 2, 3, 6, 12, 24];

export default function NoticeAdmin() {
  const [gistId, setGistId] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [rememberToken, setRememberToken] = useState(true);

  const [message, setMessage] = useState("");
  const [selectedHours, setSelectedHours] = useState<number>(2);
  const [customHours, setCustomHours] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  const [currentNotice, setCurrentNotice] = useState<NoticeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  useEffect(() => {
    const savedGistId = getStoredGistId();
    const savedToken = getStoredToken();
    if (savedGistId) setGistId(savedGistId);
    if (savedToken) {
      setToken(savedToken);
      setRememberToken(true);
    }
  }, []);

  const loadCurrentStatus = async (targetGistId?: string) => {
    const id = targetGistId || gistId || getStoredGistId();
    if (!id) return;

    setIsFetchingStatus(true);
    try {
      const data = await fetchNotice(id, true);
      setCurrentNotice(data);
    } catch {
      setCurrentNotice(null);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  useEffect(() => {
    if (gistId) {
      loadCurrentStatus(gistId);
    }
  }, [gistId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gistId.trim()) {
      snackbar("Gist ID를 입력해주세요.");
      return;
    }
    if (!token.trim()) {
      snackbar("GitHub 토큰(암호)을 입력해주세요.");
      return;
    }
    if (!message.trim()) {
      snackbar("공지 내용을 입력해주세요.");
      return;
    }

    const duration = isCustom ? parseFloat(customHours) : selectedHours;
    if (isNaN(duration) || duration <= 0) {
      snackbar("유효한 노출 시간을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const now = Date.now();
    const expiresAt = now + Math.round(duration * 60 * 60 * 1000);

    const newNotice: NoticeData = {
      active: true,
      message: message.trim(),
      createdAt: now,
      expiresAt: expiresAt,
      durationHours: duration,
    };

    const res = await updateNotice(newNotice, token, gistId);
    setIsLoading(false);

    if (res.success) {
      setStoredGistId(gistId);
      if (rememberToken) {
        setStoredToken(token);
      } else {
        setStoredToken("");
      }
      snackbar("공지가 성공적으로 등록되었습니다!");
      setMessage("");
      loadCurrentStatus();
    } else {
      snackbar(res.error || "공지 등록에 실패했습니다.");
    }
  };

  const handleDeactivate = async () => {
    if (!gistId.trim() || !token.trim()) {
      snackbar("Gist ID와 토큰을 확인해주세요.");
      return;
    }

    if (!window.confirm("현재 활성화된 공지를 즉시 내리시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    const deactivatedNotice: NoticeData = {
      active: false,
      message: "",
      createdAt: Date.now(),
      expiresAt: 0,
      durationHours: 0,
    };

    const res = await updateNotice(deactivatedNotice, token, gistId);
    setIsLoading(false);

    if (res.success) {
      snackbar("공지가 비활성화되었습니다.");
      loadCurrentStatus();
    } else {
      snackbar(res.error || "공지 해제에 실패했습니다.");
    }
  };

  const isNoticeCurrentlyActive =
    currentNotice &&
    currentNotice.active &&
    currentNotice.expiresAt &&
    Date.now() < currentNotice.expiresAt;

  const getRemainingTimeText = (expiresAt: number) => {
    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) return "만료됨";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    }
    return `${minutes}분 남음`;
  };

  return (
    <>
      <Head>
        <title>공지사항 관리 - 위스키 리뷰</title>
      </Head>

      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#F2EDD7",
          py: 4,
          px: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 640 }}>
          {/* 상단 네비게이션 */}
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: "#755139",
                  fontWeight: 700,
                  "&:hover": { backgroundColor: "rgba(117, 81, 57, 0.08)" },
                }}
              >
                메인으로 돌아가기
              </Button>
            </Link>
          </Box>

          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#755139",
                color: "#FFFFFF",
                py: 2.5,
                px: 3,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CampaignIcon sx={{ fontSize: 28, color: "#F2EDD7" }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  상단 공지사항 간편 등록
                </Typography>
                <Typography variant="caption" sx={{ color: "#F2EDD7", opacity: 0.9 }}>
                  서버 접속 없이 웹에서 바로 메인 상단 바 공지를 관리합니다.
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* 현재 등록된 공지 상태 카드 */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: isNoticeCurrentlyActive ? "#F9F6F0" : "#F8F9FA",
                  border: isNoticeCurrentlyActive
                    ? "1px solid #755139"
                    : "1px solid #E0E0E0",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#333" }}>
                    현재 공지 상태
                  </Typography>
                  {isNoticeCurrentlyActive ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="노출 중"
                      size="small"
                      sx={{
                        backgroundColor: "#755139",
                        color: "#FFF",
                        fontWeight: 700,
                        "& .MuiChip-icon": { color: "#FFF" },
                      }}
                    />
                  ) : (
                    <Chip
                      icon={<CancelIcon />}
                      label="공지 없음 (비활성)"
                      size="small"
                      variant="outlined"
                      sx={{ color: "#888", borderColor: "#CCC" }}
                    />
                  )}
                </Box>

                {isNoticeCurrentlyActive && currentNotice && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#755139" }}>
                      &quot;{currentNotice.message}&quot;
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                        mt: 1,
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      <span>
                        종료 시각:{" "}
                        {new Date(currentNotice.expiresAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        남은 시간:{" "}
                        <b>{getRemainingTimeText(currentNotice.expiresAt)}</b>
                      </span>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={handleDeactivate}
                      disabled={isLoading}
                      sx={{ mt: 1.5 }}
                    >
                      공지 즉시 내리기
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* 등록 폼 */}
              <Box component="form" onSubmit={handleRegister}>
                {/* Gist ID 입력 */}
                <TextField
                  fullWidth
                  label="Gist ID"
                  placeholder="Gist URL 끝의 해시값 (예: a1b2c3d4e5f6...)"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                  helperText="공지 데이터가 저장된 Gist의 ID입니다."
                />

                {/* 암호(GitHub 토큰) 입력 */}
                <TextField
                  fullWidth
                  label="관리자 암호 (GitHub Token)"
                  placeholder="ghp_... (gist 권한 토큰)"
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowToken(!showToken)}
                          edge="end"
                          size="small"
                        >
                          {showToken ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="공지 등록 권한이 있는 Personal Access Token입니다."
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberToken}
                      onChange={(e) => setRememberToken(e.target.checked)}
                      size="small"
                      sx={{ color: "#755139", "&.Mui-checked": { color: "#755139" } }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: "#555" }}>
                      이 브라우저에 토큰 저장 (다음 접속 시 자동 입력)
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                {/* 공지 문구 입력 */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="공지 내용"
                  placeholder="예: 서버 DB 점검 중입니다. (예상 소요 시간: 약 1시간)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  sx={{ mb: 2.5 }}
                />

                {/* 노출 시간 선택 */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#444" }}>
                  노출 시간 설정 (지정한 시간 후 자동 종료)
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {PRESET_HOURS.map((h) => (
                    <Chip
                      key={h}
                      label={`${h}시간`}
                      clickable
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedHours(h);
                      }}
                      sx={{
                        backgroundColor:
                          !isCustom && selectedHours === h ? "#755139" : "#EAEAEA",
                        color: !isCustom && selectedHours === h ? "#FFF" : "#333",
                        fontWeight: 600,
                        "&:hover": {
                          backgroundColor:
                            !isCustom && selectedHours === h ? "#5c3f2c" : "#DDD",
                        },
                      }}
                    />
                  ))}
                  <Chip
                    label="직접 입력"
                    clickable
                    onClick={() => setIsCustom(true)}
                    sx={{
                      backgroundColor: isCustom ? "#755139" : "#EAEAEA",
                      color: isCustom ? "#FFF" : "#333",
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {isCustom && (
                  <TextField
                    type="number"
                    size="small"
                    label="직접 입력 (시간 단위)"
                    placeholder="예: 0.5 (30분) 또는 4 (4시간)"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    sx={{ mb: 2, width: 220 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">시간</InputAdornment>,
                    }}
                  />
                )}

                {/* 제출 버튼 */}
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    mt: 1,
                    py: 1.2,
                    backgroundColor: "#755139",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "15px",
                    "&:hover": { backgroundColor: "#5c3f2c" },
                  }}
                >
                  {isLoading ? "등록 중..." : "상단 공지 등록하기"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
}
