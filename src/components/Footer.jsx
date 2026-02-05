import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const FooterRoot = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.25),
  textAlign: 'center',
  marginLeft: theme.spacing(0.625),
  marginBottom: theme.spacing(0.625),
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.text.secondary,
  marginTop: 'auto',
}));

const Footer = () => {
  return (
    <FooterRoot component="footer">
      <Typography variant="body2" color="text.secondary">
        &copy; 2025 Coral Telecom Ltd. All rights reserved.
      </Typography>
    </FooterRoot>
  );
};

export default Footer;
