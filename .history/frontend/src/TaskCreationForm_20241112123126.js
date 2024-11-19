// TaskCreationForm.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  Save as SaveIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { useMjopContext } from './MjopContext';
import tasksData from './taken.json';
import TaskSelectionDrawer from './TaskSelectionDrawer';
import TaskTable from './TaskTable';

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [customTask, setCustomTask] = useState({
    ultimateDate: new Date(),
    durationDays: 0,
    offerteNeeded: true,
  });
  const [multiAssign, setMultiAssign] = useState(false);
  const [estimatedPrices, setEstimatedPrices] = useState({});
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedElement, setSelectedElement] = useState('');
  const [selectedElements, setSelectedElements] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [existingTasks, setExistingTasks] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Selecteer Taak Type en Toewijzing',
    'Vul Taakdetails In',
    'Controleer en Bevestig',
  ];

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedTaskType || (!multiAssign && !selectedSpace) || !selectedElement) {
        alert('Alle velden moeten ingevuld zijn');
        return;
      }
    } else if (activeStep === 1 && selectedTasks.length === 0) {
      alert('Selecteer minimaal één taak');
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <CardContent>
            <Typography variant="h6">Stap 1: Selecteer Taak Type en Toewijzing</Typography>
            <TextField
              fullWidth
              select
              label="Taak Type"
              value={selectedTaskType}
              onChange={(e) => setSelectedTaskType(e.target.value)}
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
            >
              <MenuItem value="Onderhoud">Onderhoud</MenuItem>
              <MenuItem value="Reparatie">Reparatie</MenuItem>
              <MenuItem value="Inspectie">Inspectie</MenuItem>
            </TextField>
            <FormControlLabel
              control={<Checkbox checked={multiAssign} onChange={(e) => setMultiAssign(e.target.checked)} />}
              label="Multi-Assign (alle elementen in alle ruimtes)"
            />
            {!multiAssign && (
              <TextField
                fullWidth
                select
                label="Selecteer ruimte"
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}
                variant="outlined"
                size="medium"
                sx={{ mb: 3 }}
              >
                {globalSpaces.map((space) => (
                  <MenuItem key={space.id} value={space.id}>
                    {space.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              fullWidth
              select
              label="Selecteer element"
              value={selectedElement}
              onChange={(e) => setSelectedElement(e.target.value)}
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
              disabled={!multiAssign && !selectedSpace}
            >
              {[...new Set(globalElements.map((el) => el.name))].map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
            {existingTasks.length > 0 && (
              <TaskTable tasks={existingTasks} title="Al Geplande Taken voor Geselecteerde Elementen" />
            )}
          </CardContent>
        );
      case 1:
        return (
          <CardContent>
            <Typography variant="h6">Stap 2: Selecteer en Pas Taken Aan</Typography>
            <Button variant="outlined" onClick={() => setIsDrawerOpen(true)} sx={{ mb: 3 }}>
              Kies Taken uit de Lijst
            </Button>
            {selectedTasks.length > 0 ? (
              selectedTasks.map((task, index) => (
                <Accordion key={index} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{task.adjustments.name || task.beschrijving}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Render task adjustment fields */}
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography>Geen taken geselecteerd.</Typography>
            )}
          </CardContent>
        );
      case 2:
        return (
          <CardContent>
            <Typography variant="h6">Stap 3: Controleer en Bevestig</Typography>
            {selectedElements.length > 0 && selectedTasks.length > 0 && (
              <TaskTable tasks={selectedTasks} title="Overzicht van Toe Te Voegen Taken" />
            )}
          </CardContent>
        );
      default:
        return 'Onbekende stap';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Nieuwe Taken Aanmaken</Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Card sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Card>

      <TaskSelectionDrawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        taskSearchQuery={taskSearchQuery}
        handleTaskSearch={(e) => setTaskSearchQuery(e.target.value.toLowerCase())}
        filteredTasks={tasksData.onderhoudstaken || []}
        selectedTasks={selectedTasks}
        handleTaskSelect={(task) =>
          setSelectedTasks((prev) =>
            prev.some((t) => t.beschrijving === task.beschrijving)
              ? prev.filter((t) => t.beschrijving !== task.beschrijving)
              : [...prev, task]
          )
        }
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
          Vorige
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleAddTask} variant="contained" color="primary" startIcon={<SaveIcon />}>
            Taken Toevoegen
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="primary">
            Volgende
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TaskCreationForm;
