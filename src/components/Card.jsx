import React from 'react';
import { Card as MuiCard, CardContent, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(MuiCard)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: theme.shadows[2],
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1.5),
  color: theme.palette.text.primary,
}));

const Card = ({ title, children }) => {
  return (
    <StyledCard>
      <CardContent>
        {title && <CardTitle variant="h6">{title}</CardTitle>}
        {children}
      </CardContent>
    </StyledCard>
  );
};

export default Card;
