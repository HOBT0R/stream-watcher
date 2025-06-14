import React from 'react';
import { Button, ButtonProps } from '@mui/material';

export interface NavButtonProps extends Omit<ButtonProps, 'variant'> {
  isActive: boolean;
  label: string;
}

export const NavButton: React.FC<NavButtonProps> = ({ 
  isActive, 
  label, 
  onClick,
  ...buttonProps 
}) => {
  return (
    <Button
      variant={isActive ? 'outlined' : 'contained'}
      onClick={onClick}
      sx={{
        backgroundColor: isActive ? 'primary.main' : 'action.disabled',
        borderColor: 'secondary.main',
        color: isActive ? 'common.white' : 'secondary.main',
        '&:hover': {
          backgroundColor: isActive ? 'secondary.dark' : 'secondary.main',
          borderColor: 'secondary.main',
          color: 'common.white',
        },
      }}
      {...buttonProps}
    >
      {label}
    </Button>
  );
};

export default NavButton; 