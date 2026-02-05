import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { application } from "../utils/endpoints";

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
    borderRadius: theme.shape.borderRadius * 2,
    minWidth: 400,
    maxWidth: 500,
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  gap: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
}));

const FormGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
}));

const ChangePasswordDialog = ({ onClose, onPasswordChanged }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await application.post("/user/changePassword", {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      if (response.status <= 399) {
        setSuccessMessage(response.message || "Password changed successfully!");
        setTimeout(() => {
          onPasswordChanged();
        }, 2000);
      } else {
        setError(
          response.messageDetail ||
            response.message ||
            "An unknown error occurred."
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.messageDetail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to change password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledDialog open onClose={onClose}>
      <StyledDialogTitle>
        <Typography variant="h6" fontWeight={600}>
          Change Password
        </Typography>
        <IconButton onClick={onClose} size="small" title="Close">
          <Typography>✕</Typography>
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Updating password...</Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            <FormGroup>
              <TextField
                fullWidth
                type="password"
                label="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={loading || !!successMessage}
                required
                size="small"
              />
            </FormGroup>

            <FormGroup>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading || !!successMessage}
                required
                size="small"
              />
            </FormGroup>

            <FormGroup>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !!successMessage}
                required
                size="small"
              />
            </FormGroup>

            <StyledDialogActions sx={{ px: 0, borderTop: 'none', bgcolor: 'transparent' }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !!successMessage}
              >
                Change Password
              </Button>
            </StyledDialogActions>
          </Box>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default ChangePasswordDialog;
