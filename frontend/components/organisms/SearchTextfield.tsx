import { useState, KeyboardEvent } from "react";
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Paper,
  Typography,
} from "@mui/material";

import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";

import snackbar from "@/utils/snackbar";

const SearchTextfield = ({
  isLoading,
  isOpenSearchTools,
  isOtherSearch,
  handleMoreActionOnSearch,
  handleChangeSearchParam,
  handleOpenSearchTool,
  handleChangeOtherSearch,
}: {
  isLoading: boolean;
  isOpenSearchTools: boolean;
  isOtherSearch: boolean;
  handleMoreActionOnSearch: (searchInput: string) => void;
  handleChangeSearchParam: (
    searchInput: string,
    searchOptionA2: string,
    searchOptionA3: string,
    searchOptionO1: string,
    searchOptionO2: string,
    searchOptionO3: string,
    age: string
  ) => void;
  handleOpenSearchTool: () => void;
  handleChangeOtherSearch: () => void;
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchOptionA2, setSearchOptionA2] = useState("");
  const [searchOptionA3, setSearchOptionA3] = useState("");
  const [searchOptionO1, setSearchOptionO1] = useState("");
  const [searchOptionO2, setSearchOptionO2] = useState("");
  const [searchOptionO3, setSearchOptionO3] = useState("");
  const [age, setAge] = useState("");

  const checkIsEmptyInput = () =>
    searchInput === "" &&
    searchOptionA2 === "" &&
    searchOptionA3 === "" &&
    searchOptionO1 === "" &&
    searchOptionO2 === "" &&
    searchOptionO3 === "" &&
    age === "";

  const handleDeleteAllInput = () => {
    setSearchInput("");
    setSearchOptionA2("");
    setSearchOptionA3("");
    setSearchOptionO1("");
    setSearchOptionO2("");
    setSearchOptionO3("");
    setAge("");
  };

  const handleClickSearchIcon = () => {
    if (isOpenSearchTools) {
      if (checkIsEmptyInput()) {
        snackbar("검색어를 입력하세요.");
        return;
      }
    } else {
      if (searchInput.trim() === "") {
        snackbar("검색어를 입력하세요.");
        return;
      }
    }
    setSearchInput(searchInput.trim());
    handleMoreActionOnSearch(searchInput.trim());
  };

  const enterKeyEventOnSearch = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleChangeSearchParam(
        searchInput,
        searchOptionA2,
        searchOptionA3,
        searchOptionO1,
        searchOptionO2,
        searchOptionO3,
        age
      );
      handleClickSearchIcon();

      e.preventDefault();
      const target = e.target as HTMLInputElement;
      target.blur();
    }
  };

  return (
    <Paper
      component="form"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 1,
        width: { xs: "90vw", sm: "95vw", md: "auto" },
        maxWidth: "680px",
        position: "relative",
        overflow: "hidden",
        mb: 2,
      }}
    >
      <Box sx={{ width: "100%", display: "flex" }}>
        <InputBase
          disabled={isOpenSearchTools || isLoading}
          type="search"
          placeholder="리뷰를 검색하세요."
          sx={{
            flex: 1,
            opacity: isOpenSearchTools ? 0 : 1,
            height: isOpenSearchTools ? 0 : "40px",
            transition: ".5s",
            mr: { xs: "15vw", sm: "10vw", md: "8vw", lg: "6vw" },

            "input::-webkit-search-cancel-button": { display: "none" },
          }}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={enterKeyEventOnSearch}
        />
        <IconButton
          type="button"
          disabled={isLoading}
          aria-label="search filter button"
          sx={{
            p: "8px",
            position: "absolute",
            top: isOpenSearchTools ? "-4px" : 0,
            right: isOpenSearchTools ? "-4px" : "40px",
            transition: ".5s",
          }}
          onClick={handleOpenSearchTool}
        >
          {isOpenSearchTools ? (
            <ArrowDropUpIcon fontSize="medium" />
          ) : (
            <TuneIcon />
          )}
        </IconButton>
        <Button
          size="small"
          disabled={isLoading}
          aria-label="search"
          onClick={handleClickSearchIcon}
          sx={{
            position: "absolute",
            top: isOpenSearchTools ? "132px" : "4px",
            right: isOpenSearchTools ? "8px" : "12px",
            minWidth: 0,
            bgcolor: isOpenSearchTools ? "#755139" : "transparent",
            color: isOpenSearchTools ? "white" : "gray",
            transition: ".5s",
            px: isOpenSearchTools ? 11 : 1,
            height: isOpenSearchTools ? "36px" : "32px",
            width: isOpenSearchTools ? "97%" : 0,

            ":active": {
              bgcolor: isOpenSearchTools ? "#755139" : "transparent",
            },
            ":hover": {
              bgcolor: isOpenSearchTools ? "#755139" : "transparent",
            },
            ":disabled": {
              opacity: 0.8,
            },
          }}
        >
          <Typography
            variant="body1"
            sx={{
              transition: ".5s",
              overflow: "hidden",
              whiteSpace: "nowrap",
              fontWeight: 700,
              color: "white",
              px: isOpenSearchTools ? 1 : 0,
            }}
          >
            상세 검색하기
          </Typography>
          <SearchIcon />
        </Button>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: isOpenSearchTools ? "175px" : 0,
          overflow: "hidden",
          transition: ".5s",
        }}
      >
        <Box sx={{ display: "flex", width: "100%", my: 1, gap: 0.5 }}>
          <Box
            sx={{
              backgroundColor: "#755139",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: 700,
              borderRadius: 2,
              width: "44px",
              p: 0.5,
              mr: 0.5,
            }}
          >
            AND
          </Box>
          <InputBase
            type="search"
            disabled={isLoading}
            placeholder="option1"
            sx={{ flexBasis: "25%" }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={enterKeyEventOnSearch}
          />
          <InputBase
            type="search"
            disabled={isLoading}
            placeholder="option2"
            sx={{ flexBasis: "25%" }}
            value={searchOptionA2}
            onChange={(e) => setSearchOptionA2(e.target.value)}
            onKeyDown={enterKeyEventOnSearch}
          />
          <InputBase
            type="search"
            disabled={isLoading}
            placeholder="option3"
            sx={{ flexBasis: "25%" }}
            value={searchOptionA3}
            onChange={(e) => setSearchOptionA3(e.target.value)}
            onKeyDown={enterKeyEventOnSearch}
          />
        </Box>
        <Box sx={{ display: "flex", width: "100%", my: 1, gap: 0.5 }}>
          <Box
            sx={{
              backgroundColor: "#755139",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: 700,
              borderRadius: 2,
              p: 0.5,
              width: "44px",
              mr: 0.5,
            }}
          >
            OR
          </Box>
          <InputBase
            type="search"
            disabled={isLoading}
            placeholder="option1"
            sx={{ flexBasis: "25%" }}
            value={searchOptionO1}
            onChange={(e) => setSearchOptionO1(e.target.value)}
            onKeyDown={enterKeyEventOnSearch}
          />
          <InputBase
            type="search"
            disabled={isLoading}
            placeholder="option2"
            sx={{ flexBasis: "25%" }}
            value={searchOptionO2}
            onChange={(e) => setSearchOptionO2(e.target.value)}
            onKeyDown={enterKeyEventOnSearch}
          />
          <InputBase
            type="search"
            disabled={isLoading}
            placeholder="option3"
            sx={{ flexBasis: "25%" }}
            value={searchOptionO3}
            onChange={(e) => setSearchOptionO3(e.target.value)}
            onKeyDown={enterKeyEventOnSearch}
          />
        </Box>
        <Box sx={{ display: "flex", width: "100%", my: 1, gap: 1 }}>
          <Box
            sx={{
              backgroundColor: "#755139",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: 700,
              borderRadius: 2,
              p: 0.5,
              width: "44px",
            }}
          >
            Age
          </Box>
          <InputBase
            type="search"
            disabled={isLoading}
            placeholder="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            onKeyDown={enterKeyEventOnSearch}
            sx={{ flex: 1 }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              disabled={checkIsEmptyInput() || isLoading}
              onClick={handleDeleteAllInput}
              sx={{
                bgcolor: "#755139",
                ":active": { bgcolor: "#755139" },
                ":hover": { bgcolor: "#755139" },
              }}
            >
              입력 지우기
            </Button>
            <Button
              variant="contained"
              disabled={isLoading}
              sx={{
                flex: 1,
                bgcolor: "#755139",

                ":active": { bgcolor: "#755139" },
                ":hover": { bgcolor: "#755139" },
              }}
              onClick={handleChangeOtherSearch}
            >
              {isOtherSearch ? "리뷰 검색기" : "기타 리뷰 검색기"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default SearchTextfield;
