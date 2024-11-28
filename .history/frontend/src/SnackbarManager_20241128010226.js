// SnackbarManager.jsx

import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useMjopContext } from './MjopContext';

const SnackbarManager = () => {
  const { state, setSnackbarMessage, setSnackbarOpen } = useMjopContext();

  const handleClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Snackbar
      open={state.snackbarOpen}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity={state.errors.general ? 'error' : state.success ? 'success' : 'info'}
        sx={{ width: '100%', borderRadius: 2 }}
      >
        {state.snackbarMessage}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarManager;
