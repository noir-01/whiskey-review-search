import { useEffect, useState } from "react";
import router from "next/router";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import Grid from "@mui/material/Grid";

import ReviewBox from "@/components/templates/ReviewBox";
import SearchBox from "@/components/templates/SearchBox";

import BorderColorIcon from "@mui/icons-material/BorderColor";
import SearchIcon from "@mui/icons-material/Search";

export default function Home() {
  const [isSearchBox, setIsSearchBox] = useState(true);

  useEffect(() => {
    window.onbeforeunload = async (event) => {
      event.preventDefault();
      return "";
    };

    return () => {
      window.onbeforeunload = null;
    };
  }, [router]);

  return (
    <Grid
      container
      sx={{
        display: "flex",
        backgroundColor: "#F2EDD7",
        width: "100%",
        height: "100vh",
        justifyContent: "space-evenly",
        overflow: "auto",
      }}
    >
      <Grid
        item
        xs={0}
        md={5.5}
        sx={{
          display: { xs: !isSearchBox ? "none" : "flex", md: "flex" },
          justifyContent: "center",
        }}
      >
        <SearchBox />
      </Grid>
      <Grid
        item
        xs={11}
        md={5.5}
        sx={{
          display: { xs: isSearchBox ? "none" : "flex", md: "flex" },
          justifyContent: "center",
        }}
      >
        <ReviewBox />
      </Grid>

      <Fab
        size="small"
        variant="extended"
        onClick={() => setIsSearchBox(!isSearchBox)}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          top: "16px",
          right: "20px",
          backgroundColor: "#F2EDD7",

          ":hover": { backgroundColor: "#F2EDD7" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            fontSize: "12px",
            fontWeight: 700,
            alignItems: "center",
            color: "#755139",
            svg: { fontSize: "16px", color: "#755139" },
          }}
        >
          {isSearchBox ? <BorderColorIcon /> : <SearchIcon />}
          {isSearchBox ? "리뷰 작성하기" : "리뷰 검색하기"}
        </Box>
      </Fab>
    </Grid>
  );
}
