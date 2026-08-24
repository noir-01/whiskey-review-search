import Grid from "@mui/material/Grid";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";

import type { SearchType } from "@/types/search";
import convertMilliToDay from "@/utils/convertMilliToDay";

const SearchResultItem = ({
  searchResultData,
  visitedPostList,
  recentlyVisitedPost,
  addVisitedList,
  handleChangeLastVisitPost,
}: {
  recentlyVisitedPost: number;
  visitedPostList: number[];
  searchResultData: SearchType;
  addVisitedList: (newId: number) => void;
  handleChangeLastVisitPost: (visitPostId: number) => void;
}) => {
  return (
    <ListItemButton
      title={searchResultData.title}
      sx={{
        p: 0.5,
        backgroundColor: visitedPostList.includes(searchResultData.id)
          ? "#755139"
          : "white",
        color: visitedPostList.includes(searchResultData.id)
          ? "white"
          : "black",
        opacity: visitedPostList.includes(searchResultData.id)
          ? recentlyVisitedPost === searchResultData.id
            ? 1
            : 0.7
          : 1,

        ":hover": {
          backgroundColor: visitedPostList.includes(searchResultData.id)
            ? "#755139"
            : "white",
        },
      }}
      onClick={() => {
        window.open("https://gall.dcinside.com/mgallery/board/view/?id="+searchResultData.gallId + "&no=" + searchResultData.id, "_blank");
        addVisitedList(searchResultData.id);
        handleChangeLastVisitPost(searchResultData.id);
      }}
    >
      <Grid container>
        <Grid
          item
          xs={8.5}
          sx={{
            display: "-webkit-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflowWrap: "anywhere",
          }}
        >
          <Typography variant="subtitle2">{`${searchResultData.title} ${
            searchResultData.reply !== 0 ? `(${searchResultData.reply})` : ""
          }`}</Typography>
        </Grid>
        <Grid item xs={1.5}>
          <Typography variant="subtitle2" sx={{ px: 1, textAlign: "center" }}>
            {searchResultData.recommend}
          </Typography>
        </Grid>
        <Grid item xs={2} sx={{ whiteSpace: "nowrap", textAlign: "center" }}>
          <Typography variant="subtitle2">
            {convertMilliToDay(searchResultData.postDate)}
          </Typography>
        </Grid>
      </Grid>
    </ListItemButton>
  );
};

export default SearchResultItem;
