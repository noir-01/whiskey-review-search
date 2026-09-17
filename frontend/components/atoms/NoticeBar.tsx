import React, { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CampaignIcon from "@mui/icons-material/Campaign";
import { NoticeData } from "@/types/notice";
import { fetchNotice } from "@/utils/noticeService";

interface NoticeBarProps {
  onVisibilityChange?: (visible: boolean) => void;
}

const NoticeBar: React.FC<NoticeBarProps> = ({ onVisibilityChange }) => {
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateVisibility = useCallback(
    (visible: boolean) => {
      setIsVisible(visible);
      if (onVisibilityChange) {
        onVisibilityChange(visible);
      }
    },
    [onVisibilityChange]
  );

  const checkAndSetNotice = useCallback(async () => {
    try {
      const data = await fetchNotice();
      if (!data || !data.active) {
        updateVisibility(false);
        return;
      }

      const now = Date.now();
      // 만료 시간 체크
      if (data.expiresAt && now >= data.expiresAt) {
        updateVisibility(false);
        return;
      }

      // 사용자가 이전에 X로 닫은 공지인지 확인
      if (typeof window !== "undefined") {
        const dismissedTime = localStorage.getItem("dismissed_notice_time");
        if (dismissedTime && Number(dismissedTime) === data.createdAt) {
          updateVisibility(false);
          return;
        }
      }

      setNotice(data);
      updateVisibility(true);
    } catch {
      updateVisibility(false);
    }
  }, [updateVisibility]);

  useEffect(() => {
    checkAndSetNotice();

    // 1분마다 만료 여부 및 최신 공지 체크
    const timer = setInterval(() => {
      checkAndSetNotice();
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [checkAndSetNotice]);

  const handleClose = () => {
    if (notice && typeof window !== "undefined") {
      localStorage.setItem("dismissed_notice_time", String(notice.createdAt));
    }
    updateVisibility(false);
  };

  if (!isVisible || !notice) {
    return null;
  }

  // 만료 예정 시각 포맷 (예: "19:30")
  const formatEndTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "#755139",
        color: "#FFFFFF",
        py: { xs: 0.8, sm: 1 },
        px: { xs: 1.5, sm: 2 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1100,
        position: "relative",
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          overflow: "hidden",
          flex: 1,
          mr: 1,
        }}
      >
        <CampaignIcon
          sx={{
            fontSize: { xs: 20, sm: 22 },
            color: "#F2EDD7",
            flexShrink: 0,
          }}
        />
        <Typography
          component="div"
          sx={{
            fontSize: { xs: "12.5px", sm: "14px" },
            fontWeight: 500,
            lineHeight: 1.4,
            wordBreak: "break-word",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.8,
          }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              color: "#F2EDD7",
              backgroundColor: "rgba(255,255,255,0.15)",
              px: 0.8,
              py: 0.2,
              borderRadius: "4px",
              fontSize: { xs: "11px", sm: "12px" },
              flexShrink: 0,
            }}
          >
            공지
          </Box>
          <Box component="span">{notice.message}</Box>
          {notice.expiresAt && (
            <Box
              component="span"
              sx={{
                fontSize: { xs: "11px", sm: "12px" },
                color: "rgba(242, 237, 215, 0.8)",
                whiteSpace: "nowrap",
              }}
            >
              (~{formatEndTime(notice.expiresAt)} 종료 예정)
            </Box>
          )}
        </Typography>
      </Box>

      <IconButton
        size="small"
        aria-label="공지 닫기"
        onClick={handleClose}
        sx={{
          color: "#F2EDD7",
          p: 0.5,
          flexShrink: 0,
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.15)",
          },
        }}
      >
        <CloseIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
      </IconButton>
    </Box>
  );
};

export default NoticeBar;
