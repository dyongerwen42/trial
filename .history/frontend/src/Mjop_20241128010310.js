// FullTaskManager.jsx

import React from 'react';
import { Box, Grid, Typography, Button, CircularProgress } from '@mui/material';
import { useMjopContext } from './MjopContext';
import { format } from 'date-fns';

// Import custom components
import Sidebar from './Sidebar';
import TaskGroupManager from './TaskGroupManager';
import SnackbarManager from './SnackbarManager';
import TaskGroupDialog from './TaskGroupDialog';
import ElementInfoDialog from './ElementInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const FullTaskManager = () => {
  return (
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#f4f6f8', p: 3 }}>
      <Grid container spacing={4} sx={{ height: '100%' }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Sidebar />
        </Grid>

        {/* Main Panel */}
        <Grid item xs={12} md={8}>
          <TaskGroupManager />
        </Grid>
      </Grid>

      {/* Dialogs */}
      <TaskGroupDialog />
      <ElementInfoDialog />
      <DeleteConfirmationDialog />

      {/* Snackbar */}
      <SnackbarManager />
    </Box>
  );
};

export default FullTaskManager;
