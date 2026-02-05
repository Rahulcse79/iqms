// ConfirmDialog.jsx - MUI Theme Compatible

import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Alert,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
    borderRadius: theme.shape.borderRadius * 2,
    color: theme.palette.text.primary,
    minWidth: 420,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2.5, 3, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& .MuiTypography-root': {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: 80,
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3),
  gap: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
}));

const ProgressSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.default, 0.3),
}));

const ConfirmDialog = ({ 
  open, 
  onConfirm, 
  onCancel,
  loading = false,
  error = null,
  title = "Confirm Submission",
  children,
  disabled = false,
  hideActions = false
}) => {
  const handleClose = (event, reason) => {
    // Don't close on backdrop click when loading
    if (loading && reason === 'backdropClick') return;
    onCancel?.();
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Header */}
      <StyledDialogTitle id="confirm-dialog-title">
        {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
        <Typography component="span">{title}</Typography>
      </StyledDialogTitle>
      
      {/* Content */}
      <StyledDialogContent>
        {error ? (
          <Alert 
            severity="error" 
            icon={<span style={{ fontSize: '1.25rem' }}>⚠️</span>}
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        ) : (
          <Typography 
            id="confirm-dialog-description"
            variant="body1" 
            sx={{ width: '100%', lineHeight: 1.5 }}
          >
            {children || "Do you want to submit the query?"}
          </Typography>
        )}
      </StyledDialogContent>
      
      {/* Actions */}
      {!hideActions && (
        <StyledDialogActions>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            {loading ? "Please wait..." : "Cancel"}
          </Button>
          
          {!error && onConfirm && (
            <Button
              variant="contained"
              onClick={onConfirm}
              disabled={loading || disabled}
              sx={{ minWidth: 100 }}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? "Submitting..." : "Confirm"}
            </Button>
          )}
        </StyledDialogActions>
      )}
      
      {/* Progress indicator when loading */}
      {loading && (
        <ProgressSection>
          <LinearProgress 
            sx={{ 
              mb: 1,
              height: 4,
              borderRadius: 1,
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            Processing your request...
          </Typography>
        </ProgressSection>
      )}
    </StyledDialog>
  );
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  hideActions: PropTypes.bool
};

export default ConfirmDialog;