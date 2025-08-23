import React from 'react';
import { Alert, Box, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const ErrorMessage = ({ 
  error, 
  onRetry, 
  variant = 'standard',
  severity = 'error'
}) => {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity={severity}
        variant={variant}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              再試行
            </Button>
          )
        }
      >
        {error || 'エラーが発生しました'}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;