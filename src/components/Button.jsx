import React from 'react';
import { Button as MuiButton } from '@mui/material';

const Button = ({ children, onClick, variant = 'primary', ...props }) => {
  // Map custom variant names to MUI variants
  const muiVariant = variant === 'secondary' ? 'outlined' : 'contained';
  const color = variant === 'secondary' ? 'inherit' : 'primary';

  return (
    <MuiButton
      variant={muiVariant}
      color={color}
      onClick={onClick}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
