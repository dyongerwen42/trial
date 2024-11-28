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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
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
  <Card variant="outlined" sx={{ mb: 2, padding: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {elementName} <Typography variant="body2" color="textSecondary">({elementSpace})</Typography>
      </Typography>
      <Grid container spacing={2}>
        {assignPricesIndividually && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Kostprijs (€)"
              type="number"
              fullWidth
              value={individualCost}
              onChange={(e) => onCostChange(elementId, e.target.value)}
              required
              inputProps={{ min: 0, step: '0.01' }}
              aria-label={`Kostprijs voor ${elementName}`}
              error={!!errors.cost}
              helperText={errors.cost}
              variant="outlined"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={assignPricesIndividually ? 6 : 12}>
          <TextField
            label="Individuele Datum"
            type="date"
            fullWidth
            value={individualDate ? individualDate.toISOString().substr(0, 10) : ''}
            onChange={(e) => onDateChange(elementId, new Date(e.target.value))}
            InputLabelProps={{
              shrink: true,
            }}
            required
            aria-label={`Individuele datum voor ${elementName}`}
            error={!!errors.date}
            helperText={errors.date}
            variant="outlined"
          />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
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

// Main TaskGroupDialog Component
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

    if (taskProperties.amount === '' || isNaN(taskProperties.amount) || Number(taskProperties.amount) < 0) {
      newErrors.amount = 'Bedrag moet een positief getal zijn';
    }

    if (!taskProperties.duration) {
      newErrors.duration = 'Duur is verplicht';
    }

    if (taskProperties.totalSquareMeters === '' || isNaN(taskProperties.totalSquareMeters) || Number(taskProperties.totalSquareMeters) < 0) {
      newErrors.totalSquareMeters = 'Totale vierkante meter moet een positief getal zijn';
    }

    if (!taskProperties.urgency) {
      newErrors.urgency = 'Urgentie is verplicht';
    }

    if (taskProperties.indexation) {
      if (taskProperties.indexationRate === '' || isNaN(taskProperties.indexationRate) || Number(taskProperties.indexationRate) < 0) {
        newErrors.indexationRate = 'Indexatieratio moet een positief getal zijn';
      }
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
      maxWidth="md"
      fullWidth
      aria-labelledby="task-group-dialog-title"
    >
      <DialogTitle id="task-group-dialog-title" sx={{ position: 'relative', paddingBottom: 0 }}>
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
          <Grid container spacing={3}>
            {/* Task Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Taakinformatie
              </Typography>
            </Grid>
            {/* Task Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Taaknaam"
                fullWidth
                value={taskProperties.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                InputLabelProps={{
                  shrink: true,
                }}
                aria-label="Taaknaam"
                error={!!errors.name}
                helperText={errors.name}
                variant="outlined"
              />
            </Grid>
            {/* Group Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Datum Taakgroep"
                type="date"
                fullWidth
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
                variant="outlined"
              />
            </Grid>
            {/* Cost */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Kostprijs (€)"
                type="number"
                fullWidth
                value={taskProperties.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                required
                inputProps={{ min: 0, step: '0.01' }}
                aria-label="Kostprijs"
                error={!!errors.cost}
                helperText={errors.cost}
                variant="outlined"
              />
            </Grid>
            {/* Bedrag */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bedrag (€)"
                type="number"
                fullWidth
                value={taskProperties.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
                inputProps={{ min: 0, step: '0.01' }}
                aria-label="Bedrag"
                error={!!errors.amount}
                helperText={errors.amount}
                variant="outlined"
              />
            </Grid>
            {/* Duration */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
                error={!!errors.duration}
                variant="outlined"
              >
                <InputLabel id="duration-label">Duur van Tijd</InputLabel>
                <Select
                  labelId="duration-label"
                  id="duration-select"
                  value={taskProperties.duration}
                  label="Duur van Tijd"
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  aria-label="Duur van Tijd"
                >
                  <MenuItem value="days">Dagen</MenuItem>
                  <MenuItem value="weeks">Weken</MenuItem>
                  <MenuItem value="months">Maanden</MenuItem>
                </Select>
                <FormHelperText>{errors.duration}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Total Square Meters */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Totale Vierkante Meter"
                type="number"
                fullWidth
                value={taskProperties.totalSquareMeters}
                onChange={(e) => handleInputChange('totalSquareMeters', e.target.value)}
                required
                inputProps={{ min: 0, step: '0.1' }}
                aria-label="Totale Vierkante Meter"
                error={!!errors.totalSquareMeters}
                helperText={errors.totalSquareMeters}
                variant="outlined"
              />
            </Grid>
            {/* Urgency */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
                error={!!errors.urgency}
                variant="outlined"
              >
                <InputLabel id="urgency-label">Urgentie</InputLabel>
                <Select
                  labelId="urgency-label"
                  id="urgency-select"
                  value={taskProperties.urgency}
                  label="Urgentie"
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                  aria-label="Urgentie"
                >
                  <MenuItem value="Low">Laag</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">Hoog</MenuItem>
                </Select>
                <FormHelperText>{errors.urgency}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Periodicity */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
                error={!!errors.periodic}
                variant="outlined"
              >
                <InputLabel id="periodic-label">Periodiek</InputLabel>
                <Select
                  labelId="periodic-label"
                  id="periodic-select"
                  value={taskProperties.periodic}
                  label="Periodiek"
                  onChange={(e) => handleInputChange('periodic', e.target.value)}
                  aria-label="Periodiek"
                >
                  <MenuItem value="None">Geen</MenuItem>
                  <MenuItem value="Monthly">Maandelijks</MenuItem>
                  <MenuItem value="Quarterly">Kwartaal</MenuItem>
                  <MenuItem value="Yearly">Jaarlijks</MenuItem>
                </Select>
                <FormHelperText>{errors.periodic}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Indexation */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={taskProperties.indexation}
                    onChange={(e) =>
                      handleInputChange('indexation', e.target.checked)
                    }
                    color="primary"
                    aria-label="Indexatie"
                  />
                }
                label="Indexatie"
              />
            </Grid>
            {/* Indexation Rate */}
            {taskProperties.indexation && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Indexatieratio (%)"
                  type="number"
                  fullWidth
                  value={taskProperties.indexationRate}
                  onChange={(e) => handleInputChange('indexationRate', e.target.value)}
                  required
                  inputProps={{ min: 0, step: '0.1' }}
                  aria-label="Indexatieratio"
                  error={!!errors.indexationRate}
                  helperText={errors.indexationRate}
                  variant="outlined"
                />
              </Grid>
            )}
            {/* Request a Quote Button */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={() => {
                    // Implement the logic to request a quote from THA
                    // For example, open a new dialog or trigger an API call
                    alert('Offerte aangevraagd bij THA!');
                  }}
                  aria-label="Vraag een offerte aan bij THA"
                >
                  Offerte Aanvragen bij THA
                </Button>
                <Typography variant="body2" color="textSecondary">
                  Hiermee vraag je een offerte aan bij THA voor deze taakgroep.
                </Typography>
              </Box>
            </Grid>
            {/* Assign Prices Individually */}
            <Grid item xs={12}>
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
              />
            </Grid>
            {/* Selected Elements Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Geselecteerde Elementen
              </Typography>
              {taskProperties.selectedElementIds.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  Geen elementen geselecteerd.
                </Typography>
              ) : (
                taskProperties.selectedElementIds.map((elementId) => (
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
                ))
              )}
            </Grid>
          </Grid>
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
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    duration: PropTypes.string.isRequired,
    totalSquareMeters: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    urgency: PropTypes.string.isRequired,
    assignPricesIndividually: PropTypes.bool.isRequired,
    periodic: PropTypes.string.isRequired,
    indexation: PropTypes.bool.isRequired,
    indexationRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
