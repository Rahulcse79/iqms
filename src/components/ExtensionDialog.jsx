// src/components/ExtensionDialog.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
    borderRadius: theme.shape.borderRadius * 2,
    minWidth: 380,
    maxWidth: 450,
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(3, 3, 1),
  textAlign: 'center',
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3),
}));

const ExtensionDialog = ({ onSubmit }) => {
  const [extension, setExtension] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = extension.trim();

    if (!trimmed) {
      setError("Extension number cannot be empty");
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setError("Extension number must be numeric only");
      return;
    }

    setError("");
    onSubmit(trimmed);
  };

  return (
    <StyledDialog open aria-modal="true">
      <StyledDialogTitle>
        <Typography variant="h6" fontWeight={600}>
          Enter Your Extension Number
        </Typography>
      </StyledDialogTitle>
      
      <StyledDialogContent>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          textAlign="center"
          sx={{ mb: 3 }}
        >
          Please enter the extension number you are currently working on.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            value={extension}
            onChange={(e) => setExtension(e.target.value)}
            placeholder="e.g. 1023"
            inputMode="numeric"
            required
            size="small"
            sx={{ mb: 2 }}
            inputProps={{
              pattern: "[0-9]*"
            }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth
            size="large"
          >
            Continue
          </Button>
        </Box>
      </StyledDialogContent>
    </StyledDialog>
  );
};

ExtensionDialog.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default ExtensionDialog;
