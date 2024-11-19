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
  FormGroup,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { addYears, addDays } from 'date-fns';
import { useMjopContext } from './MjopContext'; // Pas het pad aan indien nodig
import tasksData from './taken.json'; // Zorg ervoor dat het pad klopt

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  // State-variabelen
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [customTask, setCustomTask] = useState({
    ultimateDate: new Date(),
    durationDays: 0,
    offerteNeeded: true,
  });
  const [useInterval, setUseInterval] = useState(false);
  const [intervalSettings, setIntervalSettings] = useState({
    intervalYears: 1,
    totalYears: 5,
    inflationRate: 0,
  });
  const [multiAssign, setMultiAssign] = useState(false);
  const [useContract, setUseContract] = useState(false);
  const [contractSettings, setContractSettings] = useState({
    contractCost: 0,
    contractDuration: 1,
  });
  const [estimatedPrices, setEstimatedPrices] = useState({});
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedElement, setSelectedElement] = useState('');
  const [selectedElements, setSelectedElements] = useState([]);
  const [setDirectToWorkDate, setSetDirectToWorkDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date());

  // Nieuwe state-variabelen
  const [availableTasks, setAvailableTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [existingTasks, setExistingTasks] = useState([]);

  // Stepper-state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Selecteer Element',
    'Selecteer Taken',
    'Configureer Opties',
    'Voer Geschatte Prijzen In',
    'Bevestig en Voeg Taken Toe',
  ];

  useEffect(() => {
    // Zorg ervoor dat "Algemeen" opties beschikbaar zijn
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
    };

    ensureAlgemeenOptions();
  }, [globalSpaces, globalElements, setGlobalSpaces, setGlobalElements]);

  const handleSpaceChange = useCallback((event) => {
    const spaceId = event.target.value;
    setSelectedSpace(spaceId);
    setSelectedElement('');
    setSelectedElements([]);
    setAvailableTasks([]);
    setFilteredTasks([]);
    setSelectedTasks([]);
    setExistingTasks([]);
  }, []);

  const handleElementChange = useCallback(
    (event) => {
      const elementId = event.target.value;
      setSelectedElement(elementId);

      let elements = globalElements.filter((el) => el.id === elementId);
      setSelectedElements(elements);

      if (elements.length > 0) {
        const element = elements[0];
        const categories = element.categories || [];
        const tasks = [];

        categories.forEach((category) => {
          const categoryTasks = tasksData.onderhoudstaken[category];
          if (categoryTasks) {
            const taskType =
              selectedTaskType.toLowerCase() === 'onderhoud' ? 'onderhoud' : 'reparaties';
            const tasksOfType = categoryTasks[taskType];
            if (tasksOfType) {
              tasks.push(
                ...tasksOfType.map((task) => ({
                  ...task,
                  category,
                }))
              );
            }
          }
        });

        setAvailableTasks(tasks);
        setFilteredTasks(tasks);

        // Bestaande taken ophalen
        const existing = element.tasks || [];
        setExistingTasks(existing);
      } else {
        setAvailableTasks([]);
        setFilteredTasks([]);
        setExistingTasks([]);
      }

      setSelectedTasks([]);
    },
    [globalElements, selectedTaskType]
  );

  const handleTaskTypeChange = (event) => {
    setSelectedTaskType(event.target.value);
    // Reset de taken en filters wanneer het taaktype verandert
    setAvailableTasks([]);
    setFilteredTasks([]);
    setSelectedTasks([]);
  };

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
        return [...prevSelected, { ...task, adjustments: {} }];
      }
    });
  };

  const handleTaskAdjustment = (index, field, value) => {
    setSelectedTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[index].adjustments = {
        ...updatedTasks[index].adjustments,
        [field]: value,
      };
      return updatedTasks;
    });
  };

  const handleTaskSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setTaskSearchQuery(query);
    const filtered = availableTasks.filter(
      (task) =>
        task.beschrijving.toLowerCase().includes(query) ||
        (task.toelichting && task.toelichting.toLowerCase().includes(query))
    );
    setFilteredTasks(filtered);
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
      const space = globalSpaces.find((space) => space.id === element.spaceId);
      const spaceName = space ? space.name : 'Onbekende ruimte';
      const elementKey = `${element.spaceId}-${element.id}`;

      selectedTasks.forEach((task) => {
        let taskName = task.adjustments.name || task.beschrijving;
        let taskDescription = task.adjustments.description || task.toelichting;
        let taskUrgency = task.adjustments.urgency || task.prioriteit?.toString() || '';

        let currentEstimatedPrice = parseFloat(estimatedPrices[elementKey] || 0);

        const offerAccepted = !customTask.offerteNeeded;
        const newTasks = [];

        if (useInterval) {
          const taskCount = Math.floor(
            intervalSettings.totalYears / intervalSettings.intervalYears
          );
          const contractCostPerTask = useContract
            ? contractSettings.contractCost / taskCount
            : 0;

          let accumulatedYears = 0;
          let currentUltimateDate = new Date(customTask.ultimateDate);
          let currentStartDate = new Date(startDate);
          let previousYear = currentUltimateDate.getFullYear();

          for (let i = 0; i < taskCount; i++) {
            let newUltimateDate;
            let newStartDate;

            accumulatedYears = i * intervalSettings.intervalYears;

            if (offerAccepted) {
              newStartDate = addYears(currentStartDate, accumulatedYears);
              newUltimateDate = addDays(newStartDate, customTask.durationDays || 0);
            } else {
              newUltimateDate = addYears(currentUltimateDate, accumulatedYears);
            }

            const currentYear = newUltimateDate.getFullYear();
            if (currentYear > previousYear) {
              currentEstimatedPrice *= 1 + parseFloat(intervalSettings.inflationRate) / 100;
              previousYear = currentYear;
            }

            const newTask = {
              id: uuidv4(),
              name: taskName,
              description: taskDescription,
              urgency: taskUrgency,
              spaceName: spaceName,
              elementName: element.name,
              ultimateDate: newUltimateDate.toISOString(),
              estimatedPrice: (currentEstimatedPrice + contractCostPerTask).toFixed(2),
              planned: {
                workDate: setDirectToWorkDate ? newUltimateDate.toISOString() : null,
                startDate: offerAccepted ? newStartDate.toISOString() : null,
                endDate: offerAccepted
                  ? addDays(newStartDate, customTask.durationDays || 0).toISOString()
                  : null,
                offerAccepted,
              },
            };

            newTasks.push(newTask);
          }
        } else {
          let newUltimateDate = new Date(customTask.ultimateDate);
          let newStartDate = new Date(startDate);

          if (offerAccepted) {
            newUltimateDate = addDays(newStartDate, customTask.durationDays || 0);
          }

          const newTask = {
            id: uuidv4(),
            name: taskName,
            description: taskDescription,
            urgency: taskUrgency,
            spaceName: spaceName,
            elementName: element.name,
            ultimateDate: newUltimateDate.toISOString(),
            estimatedPrice: currentEstimatedPrice.toFixed(2),
            planned: {
              workDate: setDirectToWorkDate ? newUltimateDate.toISOString() : null,
              startDate: offerAccepted ? newStartDate.toISOString() : null,
              endDate: offerAccepted
                ? addDays(newStartDate, customTask.durationDays || 0).toISOString()
                : null,
              offerAccepted,
            },
          };

          newTasks.push(newTask);
        }

        dispatch({
          type: 'ADD_TASK',
          payload: { elementId: element.id, tasks: newTasks },
        });
      });
    });

    saveData();
    resetForm();
  }, [
    customTask,
    globalSpaces,
    selectedElements,
    estimatedPrices,
    setDirectToWorkDate,
    startDate,
    useContract,
    useInterval,
    contractSettings,
    intervalSettings,
    saveData,
    dispatch,
    selectedTasks,
  ]);

  const resetForm = useCallback(() => {
    setCustomTask({
      ultimateDate: new Date(),
      durationDays: 0,
      offerteNeeded: true,
    });
    setUseInterval(false);
    setIntervalSettings({
      intervalYears: 1,
      totalYears: 5,
      inflationRate: 0,
    });
    setSetDirectToWorkDate(false);
    setMultiAssign(false);
    setUseContract(false);
    setContractSettings({
      contractCost: 0,
      contractDuration: 1,
    });
    setEstimatedPrices({});
    setSelectedElement('');
    setSelectedSpace('');
    setSelectedElements([]);
    setStartDate(new Date());
    setSelectedTaskType('');
    setActiveStep(0);
    setAvailableTasks([]);
    setFilteredTasks([]);
    setSelectedTasks([]);
    setTaskSearchQuery('');
    setExistingTasks([]);
  }, []);

  const handleEstimatedPriceChange = (spaceId, elementId, value) => {
    const elementKey = `${spaceId}-${elementId}`;
    setEstimatedPrices((prev) => ({
      ...prev,
      [elementKey]: value,
    }));
  };

  const handleNext = () => {
    // Validatie vóór het doorgaan naar de volgende stap
    if (activeStep === 0) {
      if (!selectedSpace) {
        alert('Selecteer een ruimte om door te gaan.');
        return;
      }
      if (!selectedElement) {
        alert('Selecteer een element om door te gaan.');
        return;
      }
    }

    if (activeStep === 1) {
      if (!selectedTaskType) {
        alert('Selecteer een taaktype om door te gaan.');
        return;
      }
      if (selectedTasks.length === 0) {
        alert('Selecteer minimaal één taak om door te gaan.');
        return;
      }
    }

    if (activeStep === 3) {
      if (selectedElements.some((el) => !estimatedPrices[`${el.spaceId}-${el.id}`])) {
        alert('Voer voor alle elementen een geschatte prijs in om door te gaan.');
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Stap 1: Selecteer Element
        const elementsInSpace = globalElements.filter((element) => element.spaceId === selectedSpace);

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 1: Selecteer Element
            </Typography>
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
            <TextField
              fullWidth
              select
              label="Selecteer element"
              value={selectedElement}
              onChange={handleElementChange}
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
              disabled={!selectedSpace}
            >
              <MenuItem value="" disabled>
                Selecteer een element
              </MenuItem>
              {elementsInSpace.map((element) => (
                <MenuItem key={element.id} value={element.id}>
                  {element.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Weergave van bestaande taken voor het geselecteerde element */}
            {existingTasks.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Geplande Taken voor {elementsInSpace.find((el) => el.id === selectedElement)?.name}
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Taak Naam</TableCell>
                      <TableCell>Beschrijving</TableCell>
                      <TableCell>Urgentie</TableCell>
                      <TableCell>Einddatum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingTasks.map((task, index) => (
                      <TableRow key={index}>
                        <TableCell>{task.name}</TableCell>
                        <TableCell>{task.description}</TableCell>
                        <TableCell>{task.urgency}</TableCell>
                        <TableCell>
                          {new Date(task.ultimateDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        );
      case 1:
        // Stap 2: Selecteer Taken
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 2: Selecteer Taken
            </Typography>
            <TextField
              fullWidth
              select
              label="Taak Type"
              value={selectedTaskType}
              onChange={handleTaskTypeChange}
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
            >
              <MenuItem value="" disabled>
                Selecteer taaktype
              </MenuItem>
              <MenuItem value="Onderhoud">Onderhoud</MenuItem>
              <MenuItem value="Reparatie">Reparatie</MenuItem>
              <MenuItem value="Inspectie">Inspectie</MenuItem>
            </TextField>
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
            {filteredTasks.length > 0 ? (
              <List>
                {filteredTasks.map((task, index) => {
                  const isSelected = selectedTasks.some(
                    (t) => t.beschrijving === task.beschrijving && t.category === task.category
                  );
                  return (
                    <ListItem
                      key={index}
                      onClick={() => handleTaskSelect(task)}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        backgroundColor: isSelected ? '#e0f7fa' : 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleTaskSelect(task)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={task.beschrijving}
                        secondary={`Categorie: ${task.category}`}
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body1">Geen taken gevonden.</Typography>
            )}
            {selectedTasks.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Geselecteerde Taken
                </Typography>
                {selectedTasks.map((task, index) => (
                  <Accordion key={index} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        {task.adjustments.name || task.beschrijving}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        fullWidth
                        label="Naam"
                        value={task.adjustments.name || task.beschrijving}
                        onChange={(e) => handleTaskAdjustment(index, 'name', e.target.value)}
                        variant="outlined"
                        size="medium"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Beschrijving"
                        value={task.adjustments.description || task.toelichting}
                        onChange={(e) =>
                          handleTaskAdjustment(index, 'description', e.target.value)
                        }
                        variant="outlined"
                        size="medium"
                        multiline
                        minRows={3}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Urgentie"
                        value={task.adjustments.urgency || task.prioriteit?.toString() || ''}
                        onChange={(e) => handleTaskAdjustment(index, 'urgency', e.target.value)}
                        select
                        variant="outlined"
                        size="medium"
                        sx={{ mb: 2 }}
                      >
                        {[...Array(6).keys()].map((i) => (
                          <MenuItem key={i + 1} value={i + 1}>
                            {i + 1}
                          </MenuItem>
                        ))}
                      </TextField>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>
        );
      case 2:
        // Stap 3: Configureer Opties
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 3: Configureer Opties
            </Typography>
            {/* Configureer opties indien nodig */}
            {/* ... */}
          </Box>
        );
      case 3:
        // Stap 4: Voer Geschatte Prijzen In
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 4: Voer Geschatte Prijzen In
            </Typography>
            {selectedElements.length > 0 ? (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {selectedElements.map((element) => {
                  const space = globalSpaces.find((space) => space.id === element.spaceId);
                  const spaceName = space ? space.name : 'Onbekende ruimte';
                  return (
                    <Card key={`${element.spaceId}-${element.id}`} sx={{ p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth
                            type="number"
                            label={`Geschatte prijs voor ${spaceName} > ${element.name}`}
                            value={estimatedPrices[`${element.spaceId}-${element.id}`] || ''}
                            onChange={(e) =>
                              handleEstimatedPriceChange(
                                element.spaceId,
                                element.id,
                                e.target.value
                              )
                            }
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          {element.photos && element.photos.length > 0 ? (
                            <img
                              src={`http://localhost:5000/${element.photos[0]}`}
                              alt={`${element.name}`}
                              style={{
                                width: '100%',
                                maxHeight: '150px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                              }}
                            />
                          ) : (
                            <Typography>Geen afbeelding beschikbaar</Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Typography>Geen elementen geselecteerd.</Typography>
            )}
          </Box>
        );
      case 4:
        // Stap 5: Bevestiging
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 5: Bevestig en Voeg Taken Toe
            </Typography>
            {/* Toon een overzicht van de taken die toegevoegd gaan worden */}
            <Typography variant="body1">
              Controleer de details en klik op "Taken Toevoegen" om de taken toe te voegen.
            </Typography>
          </Box>
        );
      default:
        return 'Onbekende stap';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Taakplanning voor Elementen
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ mt: 4, p: 2 }}>
        {renderStepContent(activeStep)}
      </Card>

      {/* Navigatieknoppen */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
          Vorige
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleAddTask}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
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
