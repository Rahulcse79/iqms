import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
    borderRadius: theme.shape.borderRadius * 2,
    minWidth: 380,
    maxWidth: 450,
    textAlign: 'center',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(3, 3, 1),
  '& .MuiTypography-root': {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(1, 3, 2),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3),
  gap: theme.spacing(1.5),
  justifyContent: 'center',
}));

const FeedbackDialog = ({ open, onClose }) => {
  const handleFeedbackClick = () => {
    window.open("https://example.com/feedback", "_blank", "noopener,noreferrer");
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      aria-labelledby="feedback-dialog-title"
    >
      <StyledDialogTitle id="feedback-dialog-title">
        <Typography variant="h6">Thank You!</Typography>
      </StyledDialogTitle>
      
      <StyledDialogContent>
        <Typography variant="body1" color="text.secondary">
          Thank you for replying to this query. Please visit the link below to submit your feedback.
        </Typography>
      </StyledDialogContent>
      
      <StyledDialogActions>
        <Button 
          variant="contained" 
          onClick={handleFeedbackClick}
          sx={{ minWidth: 120 }}
        >
          Give Feedback
        </Button>
        <Button 
          variant="outlined" 
          onClick={onClose}
          sx={{ minWidth: 100 }}
        >
          Close
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

FeedbackDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FeedbackDialog;