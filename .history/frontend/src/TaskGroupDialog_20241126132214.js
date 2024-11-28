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

// Sub-component voor individuele elementvelden
const ElementFields = React.memo(({
  elementId,
  elementName,
  elementSpace,
  assignPricesIndividually,
  individualCost,
  onCostChange,
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
              inputProps={{ min: 0, step: '0.01' }}
              aria-label={`Kostprijs voor ${elementName}`}
              variant="outlined"
            />
          </Grid>
        )}
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
  onCostChange: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    cost: PropTypes.string,
  }),
};

// Hoofdcomponent TaskGroupDialog
const TaskGroupDialog = ({
  open,
  mode, // 'add' of 'edit'
  onClose,
  taskProperties,
  setTaskProperties,
  onSubmit,
  onDelete, // Alleen voor 'edit' modus
}) => {
  // Functie om inputvelden te wijzigen
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
            {/* Taakinformatie Sectie */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Taakinformatie
              </Typography>
            </Grid>
            {/* Taaknaam */}
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
            {/* Groepsdatum */}
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
            {/* Kostprijs */}
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
            {/* Duur van Tijd */}
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
            {/* Totale Vierkante Meter */}
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
            {/* Urgentie */}
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
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Periodiek */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={taskProperties.periodic}
                    onChange={(e) =>
                      handleInputChange('periodic', e.target.checked)
                    }
                    color="primary"
                    aria-label="Periodiek"
                  />
                }
                label="Periodiek"
              />
            </Grid>
            {/* Indexatie en Periodiciteit (in Maanden) */}
            {taskProperties.periodic && (
              <>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Periodiciteit (maanden)"
                    type="number"
                    fullWidth
                    value={taskProperties.periodicityMonths}
                    onChange={(e) => handleInputChange('periodicityMonths', e.target.value)}
                    required
                    inputProps={{ min: 1, step: '1' }}
                    aria-label="Periodiciteit in maanden"
                    variant="outlined"
                  />
                </Grid>
              </>
            )}
            {/* Offerte Aanvragen Button */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={() => {
                    // Implement logic om een offerte aan te vragen bij THA
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
            {/* Prijzen per Element Toewijzen */}
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
            {/* Geselecteerde Elementen Sectie */}
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
                    onCostChange={handleCostChange}
                    errors={{
                      cost: taskProperties.individualCosts[elementId] < 0 ? 'Kostprijs moet positief zijn' : '',
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
    urgency: PropTypes.oneOf([1,2,3,4,5,6]).isRequired,
    periodic: PropTypes.bool.isRequired,
    periodicityMonths: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    indexation: PropTypes.bool.isRequired,
    assignPricesIndividually: PropTypes.bool.isRequired,
    individualCosts: PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ).isRequired,
    selectedElementIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    elementNames: PropTypes.objectOf(PropTypes.string).isRequired,
    elementSpaces: PropTypes.objectOf(PropTypes.string).isRequired,
  }).isRequired,
  setTaskProperties: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func, // Alleen vereist voor 'edit' modus
};

export default TaskGroupDialog;
