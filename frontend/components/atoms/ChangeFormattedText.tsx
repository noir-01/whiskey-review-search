import { Typography } from "@mui/material";

const ChangeFormattedText = ({ multiLineText }: { multiLineText: string }) => (
  <Typography
    variant="body2"
    sx={{
      fontSize: { xs: "11px", sm: "12px" },
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    }}
  >
    {multiLineText}
  </Typography>
);

export default ChangeFormattedText;
