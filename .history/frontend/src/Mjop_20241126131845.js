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
import { format, parseISO } from 'date-fns';

// Sub-component for individual element fields
const ElementFields = React.memo(({
  elementId,
  elementName,
  elementSpace,
  assignPricesIndividually,
  individualCost,
  individualDate,
  onCostChange,
  onDateChange,
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
              inputProps={{ min: 0, step: '0.01' }}
              aria-label={`Kostprijs voor ${elementName}`}
              variant="outlined"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={assignPricesIndividually ? 6 : 12}>
          <TextField
            label="Individuele Datum"
            type="date"
            fullWidth
            value={individualDate ? format(individualDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => onDateChange(elementId, parseISO(e.target.value))}
            InputLabelProps={{
              shrink: true,
            }}
            aria-label={`Individuele datum voor ${elementName}`}
            variant="outlined"
          />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
));

ElementFields.propTypes = {
  elementId: PropTypes.string.isRequired,
  elementName: PropTypes.string.isRequired,
  elementSpace: PropTypes.string.isRequired,
  assignPricesIndividually: PropTypes.bool.isRequired,
  individualCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  individualDate: PropTypes.instanceOf(Date),
  onCostChange: PropTypes.func.isRequired,
  onDateChange: PropTypes.func.isRequired,
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
  // Removed validation state and logic

  // Handle input changes
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

  const handleSubmit = () => {
    onSubmit();
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
                variant="outlined"
              />
            </Grid>
            {/* Group Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Datum Taakgroep"
                type="date"
                fullWidth
                value={taskProperties.groupDate ? format(taskProperties.groupDate, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  handleInputChange('groupDate', parseISO(e.target.value))
                }
                InputLabelProps={{
                  shrink: true,
                }}
                required
                aria-label="Datum Taakgroep"
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
                variant="outlined"
              />
            </Grid>
            {/* Duration */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
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
                variant="outlined"
              />
            </Grid>
            {/* Urgency */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
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
              </FormControl>
            </Grid>
            {/* Periodicity */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
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
