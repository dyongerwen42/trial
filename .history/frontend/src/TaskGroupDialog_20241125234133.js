// components/TaskGroupDialog.jsx

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
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
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Sub-component for individual element fields
const ElementFields = ({
  elementId,
  elementName,
  elementSpace,
  assignPricesIndividually,
  individualCost,
  individualDate,
  onCostChange,
  onDateChange,
  errors,
}) => (
  <Box
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
      {elementName} ({elementSpace})
    </Typography>
    {assignPricesIndividually && (
      <TextField
        label="Kostprijs (€)"
        type="number"
        fullWidth
        margin="dense"
        value={individualCost}
        onChange={(e) => onCostChange(elementId, e.target.value)}
        required
        inputProps={{ min: 0, step: '0.01' }}
        aria-label={`Kostprijs voor ${elementName}`}
        error={!!errors.cost}
        helperText={errors.cost}
      />
    )}
    <TextField
      label="Individuele Datum"
      type="date"
      fullWidth
      margin="dense"
      value={individualDate ? individualDate.toISOString().substr(0, 10) : ''}
      onChange={(e) => onDateChange(elementId, new Date(e.target.value))}
      InputLabelProps={{
        shrink: true,
      }}
      required
      aria-label={`Individuele datum voor ${elementName}`}
      error={!!errors.date}
      helperText={errors.date}
    />
  </Box>
);

ElementFields.propTypes = {
  elementId: PropTypes.string.isRequired,
  elementName: PropTypes.string.isRequired,
  elementSpace: PropTypes.string.isRequired,
  assignPricesIndividually: PropTypes.bool.isRequired,
  individualCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  individualDate: PropTypes.instanceOf(Date),
  onCostChange: PropTypes.func.isRequired,
  onDateChange: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    cost: PropTypes.string,
    date: PropTypes.string,
  }),
};

const TaskGroupDialog = ({
  open,
  mode, // 'add' or 'edit'
  onClose,
  taskProperties,
  setTaskProperties,
  onSubmit,
  onDelete, // Only for 'edit' mode
}) => {
  // Local state for form validation
  const [errors, setErrors] = useState({});

  // Reset errors when dialog opens/closes or taskProperties change
  useEffect(() => {
    setErrors({});
  }, [open, taskProperties]);

  const handleInputChange = useCallback((field, value) => {
    setTaskProperties((prev) => ({ ...prev, [field]: value }));
  }, [setTaskProperties]);

  const handleCostChange = useCallback(
    (elementId, value) => {
      setTaskProperties((prev) => ({
        ...prev,
        individualCosts: {
          ...prev.individualCosts,
          [elementId]: value,
        },
      }));
    },
    [setTaskProperties]
  );

  const handleDateChange = useCallback(
    (elementId, value) => {
      setTaskProperties((prev) => ({
        ...prev,
        individualDates: {
          ...prev.individualDates,
          [elementId]: value,
        },
      }));
    },
    [setTaskProperties]
  );

  // Validate form fields
  const validate = () => {
    const newErrors = {};

    if (!taskProperties.name.trim()) {
      newErrors.name = 'Taaknaam is verplicht';
    }

    if (!taskProperties.groupDate || isNaN(taskProperties.groupDate)) {
      newErrors.groupDate = 'Een geldige datum is verplicht';
    }

    if (taskProperties.cost === '' || isNaN(taskProperties.cost) || Number(taskProperties.cost) < 0) {
      newErrors.cost = 'Kostprijs moet een positief getal zijn';
    }

    // Validate individual costs and dates
    taskProperties.selectedElementIds.forEach((elementId) => {
      if (taskProperties.assignPricesIndividually) {
        const cost = taskProperties.individualCosts[elementId];
        if (cost === '' || isNaN(cost) || Number(cost) < 0) {
          newErrors[`cost_${elementId}`] = 'Kostprijs moet een positief getal zijn';
        }
      }

      const date = taskProperties.individualDates[elementId];
      if (!date || isNaN(date)) {
        newErrors[`date_${elementId}`] = 'Een geldige datum is verplicht';
      }
    });

    setErrors(newErrors);

    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    } else {
      // Optionally, you can focus the first error field here
    }
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
          {/* Task Name */}
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
            error={!!errors.name}
            helperText={errors.name}
          />
          {/* Group Date */}
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
            error={!!errors.groupDate}
            helperText={errors.groupDate}
          />
          {/* Cost */}
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
            error={!!errors.cost}
            helperText={errors.cost}
          />
          {/* Assign Prices Individually */}
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
              <ElementFields
                key={elementId}
                elementId={elementId}
                elementName={taskProperties.elementNames[elementId]}
                elementSpace={taskProperties.elementSpaces[elementId]}
                assignPricesIndividually={taskProperties.assignPricesIndividually}
                individualCost={taskProperties.individualCosts[elementId] || ''}
                individualDate={taskProperties.individualDates[elementId] || null}
                onCostChange={handleCostChange}
                onDateChange={handleDateChange}
                errors={{
                  cost: errors[`cost_${elementId}`],
                  date: errors[`date_${elementId}`],
                }}
              />
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
          onClick={handleSubmit}
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

TaskGroupDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
  onClose: PropTypes.func.isRequired,
  taskProperties: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    groupDate: PropTypes.instanceOf(Date).isRequired,
    cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    assignPricesIndividually: PropTypes.bool.isRequired,
    individualCosts: PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ).isRequired,
    individualDates: PropTypes.objectOf(PropTypes.instanceOf(Date)).isRequired,
    selectedElementIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    elementNames: PropTypes.objectOf(PropTypes.string).isRequired,
    elementSpaces: PropTypes.objectOf(PropTypes.string).isRequired,
  }).isRequired,
  setTaskProperties: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func, // Only required for 'edit' mode
};

export default TaskGroupDialog;
