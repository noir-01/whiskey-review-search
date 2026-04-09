import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";

import { CustomDialogProps } from "@/types/review";

const CustomDialog = ({
  content,
  open,
  onClose,
  onClick,
}: CustomDialogProps) => (
  <Dialog
    open={open}
    onKeyDown={(e) => {
      if (e.key == "Escape") onClose();
      else if (e.key == "Enter") onClick();
    }}
    onClose={onClose}
  >
    <DialogContent sx={{ fontWeight: 700 }}>{content}</DialogContent>
    <DialogActions
      sx={{
        button: {
          color: "#755139",
          ":hover": { bgcolor: "transparent" },
        },
      }}
    >
      <Button onClick={onClose}>취소</Button>
      <Button onClick={onClick}>확인</Button>
    </DialogActions>
  </Dialog>
);

export default CustomDialog;
