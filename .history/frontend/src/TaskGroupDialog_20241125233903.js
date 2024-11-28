// components/TaskGroupDialog.jsx

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  DeleteIcon as Delete
} from '@mui/icons-material';

const TaskGroupDialog = ({
  open,
  mode, // 'add' or 'edit'
  onClose,
  taskProperties,
  setTaskProperties,
  onSubmit,
  onDelete, // Only for 'edit' mode
}) => {
  const handleInputChange = (field, value) => {
    setTaskProperties((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="task-group-dialog-title"
    >
      <DialogTitle id="task-group-dialog-title">
        {mode === 'edit' ? 'Taakgroep Bewerken' : 'Taakgroep Toevoegen'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" noValidate autoComplete="off">
          <TextField
            label="Taaknaam"
            fullWidth
            margin="dense"
            value={taskProperties.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            InputLabelProps={{
              shrink: true,
            }}
            aria-label="Taaknaam"
          />
          <TextField
            label="Datum Taakgroep"
            type="date"
            fullWidth
            margin="dense"
            value={taskProperties.groupDate.toISOString().substr(0, 10)}
            onChange={(e) =>
              handleInputChange('groupDate', new Date(e.target.value))
            }
            InputLabelProps={{
              shrink: true,
            }}
            required
            aria-label="Datum Taakgroep"
          />
          <TextField
            label="Kostprijs (€)"
            fullWidth
            margin="dense"
            type="number"
            value={taskProperties.cost}
            onChange={(e) => handleInputChange('cost', e.target.value)}
            required
            inputProps={{ min: 0, step: '0.01' }}
            aria-label="Kostprijs"
          />
          <FormControlLabel
            control={
              <Switch
                checked={taskProperties.assignPricesIndividually}
                onChange={(e) =>
                  handleInputChange('assignPricesIndividually', e.target.checked)
                }
                color="primary"
                aria-label="Prijzen per element toewijzen"
              />
            }
            label="Prijzen per element toewijzen"
            sx={{ mt: 2 }}
          />
          {/* Display selected elements */}
          <Box sx={{ mt: 3 }}>
            {taskProperties.selectedElementIds.map((elementId) => (
              <Box
                key={elementId}
                sx={{
                  mb: 2,
                  borderBottom: '1px solid #e0e0e0',
                  pb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {taskProperties.elementNames[elementId]} ({taskProperties.elementSpaces[elementId]})
                </Typography>
                {taskProperties.assignPricesIndividually && (
                  <TextField
                    label="Kostprijs (€)"
                    type="number"
                    fullWidth
                    margin="dense"
                    value={taskProperties.individualCosts[elementId] || ''}
                    onChange={(e) =>
                      setTaskProperties((prev) => ({
                        ...prev,
                        individualCosts: {
                          ...prev.individualCosts,
                          [elementId]: e.target.value,
                        },
                      }))
                    }
                    required
                    inputProps={{ min: 0, step: '0.01' }}
                    aria-label={`Kostprijs voor ${taskProperties.elementNames[elementId]}`}
                  />
                )}
                {/* Individual Date */}
                <TextField
                  label="Individuele Datum"
                  type="date"
                  fullWidth
                  margin="dense"
                  value={
                    taskProperties.individualDates[elementId]
                      ? taskProperties.individualDates[elementId].toISOString().substr(0, 10)
                      : ''
                  }
                  onChange={(e) =>
                    setTaskProperties((prev) => ({
                      ...prev,
                      individualDates: {
                        ...prev.individualDates,
                        [elementId]: new Date(e.target.value),
                      },
                    }))
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                  aria-label={`Individuele datum voor ${taskProperties.elementNames[elementId]}`}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        {mode === 'edit' && (
          <Tooltip title="Verwijder Taakgroep" arrow>
            <Button
              onClick={onDelete}
              color="error"
              variant="outlined"
              sx={{ textTransform: 'none' }}
              startIcon={<DeleteIcon fontSize="small" />}
              aria-label="Verwijder Taakgroep"
            >
              Verwijder
            </Button>
          </Tooltip>
        )}
        <Button
          onClick={onClose}
          color="secondary"
          sx={{ textTransform: 'none' }}
          startIcon={<CloseIcon fontSize="small" />}
          aria-label="Annuleren"
        >
          Annuleren
        </Button>
        <Button
          onClick={onSubmit}
          color="primary"
          variant="contained"
          sx={{ textTransform: 'none' }}
          startIcon={mode === 'edit' ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
          aria-label={mode === 'edit' ? 'Taakgroep bijwerken' : 'Taakgroep toevoegen'}
        >
          {mode === 'edit' ? 'Bijwerken' : 'Toevoegen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskGroupDialog;
