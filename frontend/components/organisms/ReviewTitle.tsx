import Autocomplete from "@mui/material/Autocomplete";
import Divider from "@mui/material/Divider";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { useQuery } from "@tanstack/react-query";

import { useWhiskeyStore } from "@/store/MemoWhiskey";
import snackbar from "@/utils/snackbar";
import apiFetch, { getApiErrorMessage } from "@/utils/apiFetch";

const ReviewTitle = () => {
  const { whiskey, updateWhiskey } = useWhiskeyStore();

  const getNameList = async (input: string): Promise<{ result: string[] }> =>
    apiFetch<{ result: string[] }>(
      `https://whiskeygallery-review.com:444/autocomplete?word=${encodeURIComponent(input)}`
    );

  const { data: nameList } = useQuery(
    ["review", whiskey.name],
    async () => await getNameList(whiskey.name).then((res) => res.result),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60,
      onError: (err) => snackbar(getApiErrorMessage(err)),
    }
  );

  return (
    <Paper
      component="form"
      sx={{
        p: "0 4px 0 0",
        display: "flex",
        alignItems: "center",
        my: 1.5,
        flex: 1,
        height: "36px",
      }}
    >
      <Autocomplete
        freeSolo
        value={whiskey.name}
        onChange={(e) => {
          updateWhiskey("name", (e.target as HTMLInputElement).outerText);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Whiskey name"
            value={whiskey.name}
            onChange={(e) => updateWhiskey("name", e.target.value)}
            autoFocus={true}
            fullWidth
            inputProps={{
              style: { padding: "0px" },
              ...params.inputProps,
            }}
            sx={{
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          />
        )}
        sx={{
          flex: 2,
          "> .MuiInputBase-root": {
            py: 0,
            px: 3,
            height: "44px",
            borderRadius: "21px 0 0 21px",
          },
        }}
        options={nameList || []}
      />
      <Divider sx={{ height: 28, mr: 0.5 }} orientation="vertical" />
      <InputBase
        placeholder="WB code"
        type="number"
        value={whiskey.wbCode}
        onChange={(e) => updateWhiskey("wbCode", e.target.value)}
        sx={{
          ml: 1,
          flex: 1,
          fontSize: "14px",

          "input[type=number]::-webkit-inner-spin-button, \
      input[type=number]::-webkit-outer-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
        }}
      />
      <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
      <InputBase
        type="number"
        placeholder="ABV (1~100)"
        value={whiskey.abv}
        onBlur={(e) => {
          if (e.target.value !== "")
            updateWhiskey(
              "abv",
              Number(Number(e.target.value).toFixed(3)).toString()
            );
        }}
        onChange={(e) => {
          if (Number(e.target.value) > 99) updateWhiskey("abv", "100");
          else if (Number(e.target.value) < 1) {
            if (e.target.value === "") updateWhiskey("abv", "");
            else updateWhiskey("abv", "1");
          } else updateWhiskey("abv", e.target.value);
        }}
        sx={{
          ml: 1,
          flex: 1,
          fontSize: "14px",

          "input[type=number]::-webkit-inner-spin-button, \
        input[type=number]::-webkit-outer-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
        }}
      />
    </Paper>
  );
};

export default ReviewTitle;
