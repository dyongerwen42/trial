// components/DeleteConfirmationDialog.jsx

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  taskGroupName,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-confirmation-dialog-title"
      aria-describedby="delete-confirmation-dialog-description"
    >
      <DialogTitle id="delete-confirmation-dialog-title">
        Bevestig Verwijdering
      </DialogTitle>
      <DialogContent>
        <Typography id="delete-confirmation-dialog-description">
          Weet je zeker dat je de taakgroep "{taskGroupName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          sx={{ textTransform: 'none' }}
          aria-label="Annuleren"
        >
          Annuleren
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          sx={{ textTransform: 'none' }}
          aria-label="Bevestig Verwijdering"
        >
          Verwijder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
