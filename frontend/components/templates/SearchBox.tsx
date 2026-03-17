import React,{ useState,useEffect, KeyboardEvent, useRef,useCallback} from "react";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useQuery,useQueryClient } from "@tanstack/react-query";

import CustomLoading from "@/components/atoms/CustomLoading";
import DropDownOption from "@/components/atoms/DropDownOption";
import type { SearchType, SortOptionType,Page } from "@/types/search";
import convertMilliToDay from "@/utils/convertMilliToDay";
import snackbar from "@/utils/snackbar";

import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";

const SearchBox = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchOptionA2, setSearchOptionA2] = useState("");
  const [searchOptionA3, setSearchOptionA3] = useState("");
  const [searchOptionO1, setSearchOptionO1] = useState("");
  const [searchOptionO2, setSearchOptionO2] = useState("");
  const [searchOptionO3, setSearchOptionO3] = useState("");
  const [age, setAge] = useState("");
  const [nickname, setNickname] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [displayedPost, setDisplayedPost] = useState(20);
  const [displayedPage, setDisplayedPage] = useState(0);

  const [data,setData] = useState<SearchType[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [isOpenSearchTools, setIsOpenSearchTools] = useState(true);
  const [isOtherSearch, setIsOtherSearch] = useState(false);
  const [sortOption, setSortOption] = useState<SortOptionType>("최신순");

  const [visitedPostList, setVisitedPostList] = useState<number[]>([]);
  const [recentlyVisitedPost, setRecentlyVisitedPost] = useState<number>(0);
  const [totalElements,setTotalElements] = useState(0);
  const boxRef = useRef(null);

  const [isSearchButtonClicked,setIsSearchButtonClicked] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const BASE_URL = "https://gall.dcinside.com/mgallery/board/view/?id="
  const checkIsEmptyInput = () =>
    searchInput.trim() === "" &&
    searchOptionA2.trim() === "" &&
    searchOptionA3.trim() === "" &&
    searchOptionO1.trim() === "" &&
    searchOptionO2.trim() === "" &&
    searchOptionO3.trim() === "" &&
    age.trim() === ""&&
    nickname.trim()==="";

  // URL 업데이트 함수
  const updateURLParams = () => {
    const query: any = {};

    // AND 검색어들
    const andWords = [searchInput.trim(), searchOptionA2.trim(), searchOptionA3.trim()].filter(Boolean);
    if (andWords.length > 0) {
      query.andWords = andWords;
    }

    // OR 검색어들
    const orWords = [searchOptionO1.trim(), searchOptionO2.trim(), searchOptionO3.trim()].filter(Boolean);
    if (orWords.length > 0) {
      query.orWords = orWords;
    }

    // 나머지 파라미터들
    if (age.trim()) query.age = age.trim();
    if (nickname.trim()) query.nickname = nickname.trim();
    if (isOtherSearch) query.type = "other";

    // URL 업데이트 (shallow routing으로 페이지 리로드 없이 URL만 변경)
    router.push({
      pathname: router.pathname,
      query: query,
    }, undefined, { shallow: true });
  };

  const onSearch = () => {
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
      setSearchInput(searchInput.trim());
      setSearchQuery(searchInput.trim());
    }
    setIsSearchButtonClicked(true);
    setDisplayedPage(0);
    setDisplayedPost(20);
    setData([]);
    setHasMoreData(false);

    // URL 업데이트
    updateURLParams();

    refetch();
  };

  const enterKeyEventOnSearch = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      onSearch();

      e.preventDefault();
      const target = e.target as HTMLInputElement;
      target.blur();
    }
  };

  const getData = async (page = 0): Promise<Page<SearchType>> => {
    const value = await fetch(
      `/api/review/${ 
        isOtherSearch ? "other?" : "whiskey?"
      }${searchInput.trim() ? `andWords=${encodeURIComponent(searchInput.trim())}&` : ""}`
      + (searchOptionA2 ? `andWords=${encodeURIComponent(searchOptionA2)}&` : "")
      + (searchOptionA3 ? `andWords=${encodeURIComponent(searchOptionA3)}&` : "")
      + (searchOptionO1 ? `orWords=${encodeURIComponent(searchOptionO1)}&` : "")
      + (searchOptionO2 ? `orWords=${encodeURIComponent(searchOptionO2)}&` : "")
      + (searchOptionO3 ? `orWords=${encodeURIComponent(searchOptionO3)}&` : "")
      + (age ? `age=${encodeURIComponent(age)}&` : "")
      + (nickname ? `nickname=${encodeURIComponent(nickname)}&` : "")
      + `page=${page}&size=20&sortField=postDate&direction=DESC`
    );
    return value.json();
  };
  const queryClient = useQueryClient();

  //로딩 적용하지 않기 위해 별도 함수 작성
  const searchWithPage = async (page: number) => {
    const result = await queryClient.fetchQuery(
      ["search",page],
      () => getData(page)
    );
    // 수동으로 onSuccess 로직 처리
    setHasMoreData(result.page.totalPages != result.page.number+1);
    setTotalElements(result.page.totalElements);
    setIsSearchButtonClicked(true);
    if (result.content){
      if (page === 0) {
        setData(result.content);
      }
      else{
        setData((prevData) => [...prevData, ...result.content]); // 기존 데이터에 이어붙이기
      }
    }else{
      setData([]);
    }
  };

  const { isFetching, isInitialLoading, refetch } = useQuery(
    ["search"],
    () => getData(0),
    {
      enabled: searchInput.trim()!=="" && isSearchButtonClicked,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60,
      onSuccess: (data) => {
        setHasMoreData(data.page.totalPages != data.page.number+1);
        setTotalElements(data.page.totalElements);

        if (data.content){  //검색 결과 존재
          if (displayedPage === 0) {  //첫 페이지면 데이터 교체
            setData(data.content);
          }
          else{ //페이지 1 이상이면 '다음', 데이터 이어붙이기
            setData((prevData) => [...prevData, ...data.content]);
          }
        }else{  //검색결과 없음
          setData([]);
        }
      },
      onError: (err) =>
        snackbar(`에러가 발생했습니다. 다시 시도해주세요. (error:${err})`),
      //onSettled: ()=>{console.log("refetch!")} //테스트용
    }
  );

  const handleLoadMore = () => {
    const nextPage = displayedPage + 1;
    searchWithPage(nextPage);
    setDisplayedPost((prev) => prev + 20);
    setDisplayedPage(nextPage);
  };

  const isLoading = isInitialLoading;

  const addVisitedList = (visitedPostId: number) => {
    if (!visitedPostList.includes(visitedPostId))
      setVisitedPostList([...visitedPostList, visitedPostId]);
  };

  const handleDeleteAllInput = () => {
    setSearchInput("");
    setSearchOptionA2("");
    setSearchOptionA3("");
    setSearchOptionO1("");
    setSearchOptionO2("");
    setSearchOptionO3("");
    setAge("");
    setNickname("");
  };

  // 초기 로드 시 URL 파라미터에서 검색 조건 읽어오기
  useEffect(() => {
    if (!router.isReady || !isInitialLoad) return;

    const { andWords, orWords, age: urlAge, nickname: urlNickname, type } = router.query;

    // URL에 검색 파라미터가 있는 경우
    if (andWords || orWords || urlAge || urlNickname) {
      // AND 검색어 설정
      if (andWords) {
        const andWordsArray = Array.isArray(andWords) ? andWords : [andWords];
        if (andWordsArray[0]) setSearchInput(andWordsArray[0]);
        if (andWordsArray[1]) setSearchOptionA2(andWordsArray[1]);
        if (andWordsArray[2]) setSearchOptionA3(andWordsArray[2]);
      }

      // OR 검색어 설정
      if (orWords) {
        const orWordsArray = Array.isArray(orWords) ? orWords : [orWords];
        if (orWordsArray[0]) setSearchOptionO1(orWordsArray[0]);
        if (orWordsArray[1]) setSearchOptionO2(orWordsArray[1]);
        if (orWordsArray[2]) setSearchOptionO3(orWordsArray[2]);
      }

      // 나머지 파라미터 설정
      if (urlAge) setAge(Array.isArray(urlAge) ? urlAge[0] : urlAge);
      if (urlNickname) setNickname(Array.isArray(urlNickname) ? urlNickname[0] : urlNickname);
      if (type === "other") setIsOtherSearch(true);

      // 검색 실행
      setIsSearchButtonClicked(true);
      setIsInitialLoad(false);

      // 검색 실행 (약간의 지연을 두어 상태가 업데이트된 후 실행)
      setTimeout(() => {
        refetch();
      }, 100);
    } else {
      setIsInitialLoad(false);
    }
  }, [router.isReady, router.query]);

  return (
    <Box
      sx={{
        backgroundColor: "#F2EDD7",
        mt: isLoading || isSearchButtonClicked  ? 0 : isOpenSearchTools ? "30vh" : "35vh",
        mb: isSearchButtonClicked  ? 0 : isOpenSearchTools ? "30vh" : "50vh",
        transition: ".5s",
        maxWidth: "680px",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          my: 2,
          color: "#755139",
          textAlign: isSearchButtonClicked || isLoading ? "left" : "center",
        }}
      >
        {isOtherSearch ? "기타 리뷰 검색하기" : "리뷰 검색하기"}
      </Typography>
      <Box sx={{ mb: 2 }}>
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
              onKeyPress={enterKeyEventOnSearch}
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
              onClick={() => setIsOpenSearchTools(!isOpenSearchTools)}
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
              onClick={onSearch}
              sx={{
                position: "absolute",
                top: isOpenSearchTools ? "176px" : "4px",
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
              height: isOpenSearchTools ? "220px" : 0,
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
                  width: "57px",
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
                onKeyPress={enterKeyEventOnSearch}
              />
              <InputBase
                type="search"
                disabled={isLoading}
                placeholder="option2"
                sx={{ flexBasis: "25%" }}
                value={searchOptionA2}
                onChange={(e) => setSearchOptionA2(e.target.value)}
                onKeyPress={enterKeyEventOnSearch}
              />
              <InputBase
                type="search"
                disabled={isLoading}
                placeholder="option3"
                sx={{ flexBasis: "25%" }}
                value={searchOptionA3}
                onChange={(e) => setSearchOptionA3(e.target.value)}
                onKeyPress={enterKeyEventOnSearch}
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
                  width: "57px",
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
                onKeyPress={enterKeyEventOnSearch}
              />
              <InputBase
                type="search"
                disabled={isLoading}
                placeholder="option2"
                sx={{ flexBasis: "25%" }}
                value={searchOptionO2}
                onChange={(e) => setSearchOptionO2(e.target.value)}
                onKeyPress={enterKeyEventOnSearch}
              />
              <InputBase
                type="search"
                disabled={isLoading}
                placeholder="option3"
                sx={{ flexBasis: "25%" }}
                value={searchOptionO3}
                onChange={(e) => setSearchOptionO3(e.target.value)}
                onKeyPress={enterKeyEventOnSearch}
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
                  width: "57px",
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
                onKeyPress={enterKeyEventOnSearch}
                sx={{ flex: 1 }}
              />
              <Button
                  variant="contained"
                  disabled={checkIsEmptyInput()}
                  onClick={handleDeleteAllInput}
                  sx={{
                    display: "flex",
                    bgcolor: "#755139",
                    ":active": { bgcolor: "#755139" },
                    ":hover": { bgcolor: "#755139" },
                  }}
                >
                  입력 지우기
                </Button>
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
                  width: "58px",
                }}
              >
                글쓴이
              </Box>
              <InputBase
                type="search"
                disabled={isLoading}
                placeholder="writer"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyPress={enterKeyEventOnSearch}
                sx={{ flex: 1 }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    flex: 1,
                    bgcolor: "#755139",

                    ":active": { bgcolor: "#755139" },
                    ":hover": { bgcolor: "#755139" },
                  }}
                  onClick={() => setIsOtherSearch(!isOtherSearch)}
                >
                  {isOtherSearch ? "리뷰 검색기" : "기타 리뷰 검색기"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      {displayedPage===0 && isFetching && (
      <Box sx={{ display: isFetching ? "block" : "none", mt: "5vh" }}>
          <CustomLoading isLoading={isFetching} />
        </Box>)  }
        

      {!isInitialLoading && isSearchButtonClicked?  (

        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mx: { xs: 0.5, sm: 2 },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {`검색 결과 [총 ${totalElements}개]`}
            </Typography>
            <DropDownOption
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOptionType)}
              optionList={[
                { value: "최신순", content: "최신순" },
                { value: "추천순", content: "추천순" },
                { value: "댓글순", content: "댓글순" },
              ]}
            />
          </Box>
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 1.5,
              width: { xs: "90vw", sm: "95vw", md: "46vw" },
              maxWidth: "680px",
              pb: 1,
            }}
          >
            <Grid
              container
              id="list label"
              sx={{
                display: "flex",
                fontSize: "15px",
                fontWeight: 700,
                width: "100%",
                textAlign: "center",
                py: 1,
                borderBottom: "1px solid lightgray",
              }}
            >
              <Grid item xs={8.5}>
                제목
              </Grid>
              <Grid item xs={1}>
                추천
              </Grid>
              <Grid item xs={2.5} sx={{ whiteSpace: "nowrap" }}>
                작성일
              </Grid>
            </Grid>
            <Box ref={boxRef}
              sx={{
                height: isOpenSearchTools
                  ? "calc(100vh - 380px)"
                  : "calc(100vh - 240px)",
                transition: ".5s",
                overflow: "auto",
                p: "6px",

                "&::-webkit-scrollbar": {
                  width: "6px",
                  backgroundColor: "lightgray",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "gray",
                  borderRadius: "20px",
                },
              }}
            >
              {data?.length !== 0 &&
                data
                  .sort((a, b) => {
                    let A, B;
                    switch (sortOption) {
                      case "최신순":
                        A = a.postDate;
                        B = b.postDate;
                        break;
                      case "댓글순":
                        A = a.reply;
                        B = b.reply;
                        break;
                      case "추천순":
                        A = a.recommend;
                        B = b.recommend;
                        break;
                    }

                    return A > B ? -1 : 1;
                  })
                  .slice(0, displayedPost)
                  .map((item: SearchType) => (
                    <Box key={item.id}>
                      <ListItemButton
                        title={item.title}
                        sx={{
                          p: 0.5,
                          backgroundColor: visitedPostList.includes(item.id)
                            ? "#755139"
                            : "white",
                          color: visitedPostList.includes(item.id)
                            ? "white"
                            : "black",
                          opacity: visitedPostList.includes(item.id)
                            ? recentlyVisitedPost === item.id
                              ? 1
                              : 0.7
                            : 1,

                          ":hover": {
                            backgroundColor: visitedPostList.includes(item.id)
                              ? "#755139"
                              : "white",
                          },
                        }}
                        onClick={() => {
                          window.open(BASE_URL + item.gallId + "&no=" + item.id, "_blank");
                          addVisitedList(item.id);
                          setRecentlyVisitedPost(item.id);
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
                            <Typography variant="subtitle2">{`${item.title} ${
                              item.reply !== 0 ? `(${item.reply})` : ""
                            }`}</Typography>
                          </Grid>
                          <Grid item xs={1.5}>
                            <Typography
                              variant="subtitle2"
                              sx={{ px: 1, textAlign: "center" }}
                            >
                              {item.recommend}
                            </Typography>
                          </Grid>
                          <Grid
                            item
                            xs={2}
                            sx={{ whiteSpace: "nowrap", textAlign: "center" }}
                          >
                            <Typography variant="subtitle2">
                              {convertMilliToDay(item.postDate)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </ListItemButton>
                      <Divider />
                    </Box>
                  ))}
                {totalElements>0 && hasMoreData && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      height: "30px",
                      ":hover": { opacity: 0.5 },
                    }}
                    onClick={handleLoadMore} // 다음 페이지 요청}
                  >
                    {`더보기 (${data.length}/${totalElements})`}
                  </Box>
                )
              }

            {!isFetching && data.length === 0 && (<Box>검색결과가 없습니다.</Box>)}
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  );
};

export default SearchBox;
