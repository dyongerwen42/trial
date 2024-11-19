import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Drawer,
} from '@mui/material';
import {
  Save as SaveIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';
import tasksData from './taken.json'; // Ensure the path is correct

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedElement, setSelectedElement] = useState('');
  const [selectedElements, setSelectedElements] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [schedulableTasks, setSchedulableTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [multiAssign, setMultiAssign] = useState(false);

  const steps = [
    'Selecteer Taak Type en Toewijzing',
    'Vul Taakdetails In',
    'Bevestig en Voeg Taken Toe',
  ];
  const [activeStep, setActiveStep] = useState(0);

  // Load initial unscheduled tasks on component mount
  useEffect(() => {
    const ensureAlgemeenOptions = () => {
      let updatedSpaces = [...globalSpaces];
      let updatedElements = [...globalElements];

      let algemeenSpace = updatedSpaces.find((space) => space.name === 'Algemeen');
      if (!algemeenSpace) {
        algemeenSpace = { id: uuidv4(), name: 'Algemeen' };
        updatedSpaces.push(algemeenSpace);
        setGlobalSpaces(updatedSpaces);
      }

      let algemeenElement = updatedElements.find(
        (element) => element.name === 'Algemeen' && element.spaceId === algemeenSpace.id
      );
      if (!algemeenElement) {
        algemeenElement = {
          id: uuidv4(),
          name: 'Algemeen',
          spaceId: algemeenSpace.id,
          tasks: [],
        };
        updatedElements.push(algemeenElement);
        setGlobalElements(updatedElements);
      }

      // Populate unscheduled tasks by filtering tasks that are not assigned to any element
      const assignedTaskNames = updatedElements.flatMap((el) => el.tasks || []).map(task => task.name);
      const allTasks = Object.values(tasksData.onderhoudstaken).flatMap((categoryTasks) => 
        [...(categoryTasks.onderhoud || []), ...(categoryTasks.reparaties || [])]
      );
      const unscheduled = allTasks.filter(task => !assignedTaskNames.includes(task.beschrijving));
      setUnscheduledTasks(unscheduled);
    };

    ensureAlgemeenOptions();
  }, [globalSpaces, globalElements, setGlobalSpaces, setGlobalElements]);

  const handleSpaceChange = useCallback((event) => {
    const spaceId = event.target.value;
    setSelectedSpace(spaceId);
    setSelectedElement('');
    setSelectedElements([]);
    setSchedulableTasks([]);
    setSelectedTasks([]);
  }, []);

  const handleElementChange = useCallback(
    (event) => {
      const elementName = event.target.value;
      setSelectedElement(elementName);

      let elements;
      if (multiAssign) {
        elements = globalElements.filter((el) => el.name === elementName);
      } else {
        elements = globalElements.filter(
          (el) => el.name === elementName && el.spaceId === selectedSpace
        );
      }
      setSelectedElements(elements);

      if (elements.length > 0) {
        const categories = elements[0].categories || [];
        const schedulable = [];

        categories.forEach((category) => {
          const categoryTasks = tasksData.onderhoudstaken[category];
          if (categoryTasks) {
            const tasksOfType = selectedTaskType.toLowerCase() === 'onderhoud'
              ? categoryTasks.onderhoud
              : categoryTasks.reparaties;
            if (tasksOfType) {
              schedulable.push(...tasksOfType.map((task) => ({ ...task, category })));
            }
          }
        });

        setSchedulableTasks(schedulable);
        setIsDrawerOpen(true);
      } else {
        setSchedulableTasks([]);
      }

      setSelectedTasks([]);
    },
    [globalElements, multiAssign, selectedSpace, selectedTaskType]
  );

  const handleTaskSelect = (task) => {
    setSelectedTasks((prevSelected) => {
      const isSelected = prevSelected.some(
        (t) => t.beschrijving === task.beschrijving && t.category === task.category
      );
      if (isSelected) {
        return prevSelected.filter(
          (t) => !(t.beschrijving === task.beschrijving && t.category === task.category)
        );
      } else {
        return [...prevSelected, { ...task }];
      }
    });
  };

  const handleTaskSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setTaskSearchQuery(query);
    const filtered = schedulableTasks.filter(
      (task) =>
        task.beschrijving.toLowerCase().includes(query) ||
        (task.toelichting && task.toelichting.toLowerCase().includes(query))
    );
    setSchedulableTasks(filtered);
  };

  const handleAddTask = useCallback(() => {
    if (selectedElements.length === 0) {
      alert('Geen elementen geselecteerd om taken aan toe te voegen.');
      return;
    }

    if (selectedTasks.length === 0) {
      alert('Selecteer minimaal één taak om door te gaan.');
      return;
    }

    selectedElements.forEach((element) => {
      selectedTasks.forEach((task) => {
        const newTask = {
          id: uuidv4(),
          name: task.beschrijving,
          description: task.toelichting,
          urgency: task.prioriteit?.toString() || '',
          spaceName: globalSpaces.find((space) => space.id === element.spaceId)?.name || 'Onbekende ruimte',
          elementName: element.name,
          ultimateDate: new Date().toISOString(),
        };

        dispatch({
          type: 'ADD_TASK',
          payload: { elementId: element.id, tasks: [newTask] },
        });
      });
    });

    saveData();
    resetForm();
  }, [selectedElements, selectedTasks, globalSpaces, dispatch, saveData]);

  const resetForm = useCallback(() => {
    setSelectedTaskType('');
    setSelectedSpace('');
    setSelectedElement('');
    setSelectedElements([]);
    setSchedulableTasks([]);
    setSelectedTasks([]);
    setActiveStep(0);
  }, []);

  const handleNext = () => {
    if (activeStep === 0 && !selectedTaskType) {
      alert('Selecteer een taaktype om door te gaan.');
      return;
    }

    if (activeStep === 1 && selectedTasks.length === 0) {
      alert('Selecteer minimaal één taak om door te gaan.');
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
        // Step 1: Select Task Type and Assignment
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 1: Selecteer Taak Type en Toewijzing
            </Typography>
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
              <MenuItem value="" disabled>
                Selecteer taaktype
              </MenuItem>
              <MenuItem value="Onderhoud">Onderhoud</MenuItem>
              <MenuItem value="Reparatie">Reparatie</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={multiAssign}
                  onChange={(e) => {
                    setMultiAssign(e.target.checked);
                    setSelectedSpace('');
                    setSelectedElement('');
                    setSelectedElements([]);
                    setSchedulableTasks([]);
                    setSelectedTasks([]);
                  }}
                />
              }
              label="Multi-Assign (alle elementen in alle ruimtes)"
            />
            {!multiAssign && (
              <TextField
                fullWidth
                select
                label="Selecteer ruimte"
                value={selectedSpace}
                onChange={handleSpaceChange}
                variant="outlined"
                size="medium"
                sx={{ mb: 3 }}
              >
                <MenuItem value="" disabled>
                  Selecteer een ruimte
                </MenuItem>
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
              onChange={handleElementChange}
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
              disabled={!multiAssign && !selectedSpace}
            >
              <MenuItem value="" disabled>
                Selecteer een element
              </MenuItem>
              {[...new Set(globalElements.map((el) => el.name))].map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          </CardContent>
        );
      case 1:
        // Step 2: Fill in Task Details
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 2: Selecteer en Pas Taken Aan
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setIsDrawerOpen(true)}
              sx={{ mb: 3 }}
              startIcon={<SearchIcon />}
            >
              Kies Taken uit de Lijst
            </Button>
            {selectedTasks.length > 0 ? (
              selectedTasks.map((task, index) => (
                <Accordion key={index} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      {task.beschrijving}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">{task.toelichting}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography variant="body1">Geen taken geselecteerd.</Typography>
            )}
          </CardContent>
        );
      case 2:
        // Step 3: Confirm and Add Tasks
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 3: Bevestig en Voeg Taken Toe
            </Typography>
            <Typography variant="body1">
              Controleer de details en klik op "Taken Toevoegen" om de taken toe te voegen.
            </Typography>
          </CardContent>
        );
      default:
        return 'Onbekende stap';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Nieuwe Taken Aanmaken
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Card>

      {/* Sidebar for available tasks */}
      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <Box sx={{ width: 400, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Beschikbare Taken
            </Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Zoek taken..."
            value={taskSearchQuery}
            onChange={handleTaskSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          {schedulableTasks.length > 0 ? (
            <List>
              {schedulableTasks.map((task, index) => (
                <ListItem
                  button
                  key={index}
                  onClick={() => handleTaskSelect(task)}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: selectedTasks.some(
                      (t) => t.beschrijving === task.beschrijving && t.category === task.category
                    )
                      ? '#e0f7fa'
                      : 'inherit',
                  }}
                >
                  <Checkbox
                    checked={selectedTasks.some(
                      (t) => t.beschrijving === task.beschrijving && t.category === task.category
                    )}
                  />
                  <ListItemText
                    primary={task.beschrijving}
                    secondary={`Categorie: ${task.category}`}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1">Geen taken gevonden.</Typography>
          )}
        </Box>
      </Drawer>

      {/* Display unscheduled tasks */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Niet-geplande Taken
        </Typography>
        <List>
          {unscheduledTasks.map((task, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={task.beschrijving}
                secondary={`Categorie: ${task.category || 'Onbekend'}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Navigation Buttons */}
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