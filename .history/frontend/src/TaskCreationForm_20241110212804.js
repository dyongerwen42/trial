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
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  FormGroup,
  Drawer,
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
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { addYears, addDays } from 'date-fns';
import { useMjopContext } from './MjopContext'; // Adjust the path if necessary
import tasksData from './taken.json'; // Ensure the path is correct
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  // State variables
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

  // New state variables
  const [availableTasks, setAvailableTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [existingTasks, setExistingTasks] = useState([]);

  // State variables for conflict detection and timeline visualization
  const [proposedTasks, setProposedTasks] = useState([]);
  const [conflictingTasks, setConflictingTasks] = useState([]);
  const [timelineGroups, setTimelineGroups] = useState([]);
  const [timelineItems, setTimelineItems] = useState([]);

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Selecteer Taak Type en Toewijzing',
    'Vul Taakdetails In',
    'Configureer Opties',
    'Voer Geschatte Prijzen In',
    'Controleer en Bevestig',
  ];

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
    setProposedTasks([]);
    setConflictingTasks([]);
    setTimelineGroups([]);
    setTimelineItems([]);
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

      // Map space names to elements
      elements = elements.map((el) => {
        const space = globalSpaces.find((space) => space.id === el.spaceId);
        return { ...el, spaceName: space ? space.name : 'Onbekende ruimte' };
      });

      setSelectedElements(elements);

      // Fetch existing tasks from selected elements
      const existing = elements.flatMap((el) =>
        el.tasks
          ? el.tasks.map((task) => ({
              ...task,
              elementId: el.id,
              elementName: el.name,
              spaceName: el.spaceName,
            }))
          : []
      );
      setExistingTasks(existing);

      // Load tasks based on categories
      if (elements.length > 0) {
        const categories = elements[0].categories || [];
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
        if (tasks.length > 0) {
          setIsDrawerOpen(true);
        }
      } else {
        setAvailableTasks([]);
        setFilteredTasks([]);
      }

      setSelectedTasks([]);
      setProposedTasks([]);
      setConflictingTasks([]);
      setTimelineGroups([]);
      setTimelineItems([]);
    },
    [globalElements, multiAssign, selectedSpace, selectedTaskType, globalSpaces]
  );

  useEffect(() => {
    if (selectedElements.length > 0) {
      const existing = selectedElements.flatMap((el) =>
        el.tasks
          ? el.tasks.map((task) => ({
              ...task,
              elementId: el.id,
              elementName: el.name,
              spaceName: el.spaceName,
            }))
          : []
      );
      setExistingTasks(existing);
    } else {
      setExistingTasks([]);
    }
  }, [selectedElements]);

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

  useEffect(() => {
    if (activeStep === steps.length - 1) {
      // Prepare proposed tasks based on the data provided in previous steps
      const newTasks = [];

      selectedElements.forEach((element) => {
        const spaceName = element.spaceName || 'Onbekende ruimte';
        const elementKey = `${element.spaceId}-${element.id}`;

        selectedTasks.forEach((task) => {
          let taskName = task.adjustments.name || task.beschrijving;
          let taskDescription = task.adjustments.description || task.toelichting;
          let taskUrgency = task.adjustments.urgency || task.prioriteit?.toString() || '';

          let currentEstimatedPrice = parseFloat(estimatedPrices[elementKey] || 0);

          const offerAccepted = !customTask.offerteNeeded;

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
                elementId: element.id,
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
              elementId: element.id,
            };

            newTasks.push(newTask);
          }
        });
      });

      setProposedTasks(newTasks);
    }
  }, [
    activeStep,
    selectedElements,
    selectedTasks,
    estimatedPrices,
    customTask,
    startDate,
    useContract,
    useInterval,
    contractSettings,
    intervalSettings,
    setDirectToWorkDate,
  ]);

  const detectConflicts = useCallback(() => {
    const conflicts = [];

    proposedTasks.forEach((newTask) => {
      existingTasks.forEach((existingTask) => {
        if (newTask.elementId === existingTask.elementId) {
          const newStart = new Date(newTask.planned.startDate || newTask.ultimateDate);
          const newEnd = new Date(newTask.planned.endDate || newTask.ultimateDate);
          const existingStart = new Date(
            existingTask.planned?.startDate || existingTask.ultimateDate
          );
          const existingEnd = new Date(
            existingTask.planned?.endDate || existingTask.ultimateDate
          );

          if (
            (newStart <= existingEnd && newEnd >= existingStart) ||
            (existingStart <= newEnd && existingEnd >= newStart)
          ) {
            conflicts.push({ newTask, existingTask });
          }
        }
      });
    });

    setConflictingTasks(conflicts);
  }, [proposedTasks, existingTasks]);

  const prepareTimelineData = useCallback(() => {
    // Prepare groups based on selected elements
    const groups = selectedElements.map((el) => ({
      id: el.id,
      title: `${el.name} (${el.spaceName || 'Onbekende ruimte'})`,
    }));
    setTimelineGroups(groups);

    // Prepare items based on existing tasks
    const items = existingTasks.map((task) => ({
      id: task.id,
      group: task.elementId,
      title: task.name,
      start_time: new Date(task.planned?.startDate || task.ultimateDate),
      end_time: new Date(task.planned?.endDate || task.ultimateDate),
      itemProps: {
        style: {
          background: '#2196f3', // Blue color for existing tasks
        },
      },
    }));

    // Add new tasks to the timeline
    const newTaskItems = proposedTasks.map((task) => ({
      id: task.id,
      group: task.elementId,
      title: task.name,
      start_time: new Date(task.planned.startDate || task.ultimateDate),
      end_time: new Date(task.planned.endDate || task.ultimateDate),
      itemProps: {
        style: {
          background: conflictingTasks.some((conflict) => conflict.newTask.id === task.id)
            ? 'red' // Red color for conflicting tasks
            : '#4caf50', // Green color for new tasks
        },
      },
    }));

    setTimelineItems([...items, ...newTaskItems]);
  }, [selectedElements, existingTasks, proposedTasks, conflictingTasks]);

  useEffect(() => {
    if (activeStep === steps.length - 1) {
      detectConflicts();
      prepareTimelineData();
    }
  }, [activeStep, detectConflicts, prepareTimelineData]);

  const handleAddTask = useCallback(() => {
    if (conflictingTasks.length > 0) {
      alert('Er zijn conflicterende taken. Los de conflicten op voordat u doorgaat.');
      return;
    }

    proposedTasks.forEach((task) => {
      dispatch({
        type: 'ADD_TASK',
        payload: { elementId: task.elementId, tasks: [task] },
      });
    });

    saveData();
    resetForm();
  }, [conflictingTasks.length, proposedTasks, dispatch, saveData]);

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
    setProposedTasks([]);
    setConflictingTasks([]);
    setTimelineGroups([]);
    setTimelineItems([]);
  }, []);

  const handleEstimatedPriceChange = (spaceId, elementId, value) => {
    const elementKey = `${spaceId}-${elementId}`;
    setEstimatedPrices((prev) => ({
      ...prev,
      [elementKey]: value,
    }));
  };

  const handleNext = () => {
    // Validation before proceeding to the next step
    if (activeStep === 0) {
      if (!selectedTaskType) {
        alert('Selecteer een taaktype om door te gaan.');
        return;
      }
      if (!multiAssign && !selectedSpace) {
        alert('Selecteer een ruimte of kies voor Multi-Assign.');
        return;
      }
      if (!selectedElement) {
        alert('Selecteer een element om door te gaan.');
        return;
      }
    }

    if (activeStep === 1) {
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
        // Step 1: Select Task Type and Assignment
        const filteredElements = globalElements.filter((element) =>
          multiAssign ? true : element.spaceId === selectedSpace
        );

        const uniqueElementNames = [...new Set(filteredElements.map((el) => el.name))];

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
              <MenuItem value="Inspectie">Inspectie</MenuItem>
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
                    setAvailableTasks([]);
                    setFilteredTasks([]);
                    setSelectedTasks([]);
                    setExistingTasks([]);
                    setProposedTasks([]);
                    setConflictingTasks([]);
                    setTimelineGroups([]);
                    setTimelineItems([]);
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
              {uniqueElementNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>

            {/* Display existing tasks if any */}
            {existingTasks.length > 0 && (
              <Paper elevation={3} sx={{ mt: 4, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Al Geplande Taken voor Geselecteerde Elementen
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Taak Naam</TableCell>
                      <TableCell>Beschrijving</TableCell>
                      <TableCell>Urgentie</TableCell>
                      <TableCell>Startdatum</TableCell>
                      <TableCell>Einddatum</TableCell>
                      <TableCell>Element</TableCell>
                      <TableCell>Ruimte</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingTasks.map((task, index) => (
                      <TableRow key={index}>
                        <TableCell>{task.name}</TableCell>
                        <TableCell>{task.description}</TableCell>
                        <TableCell>{task.urgency}</TableCell>
                        <TableCell>
                          {task.planned?.startDate
                            ? new Date(task.planned.startDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {task.planned?.endDate
                            ? new Date(task.planned.endDate).toLocaleDateString()
                            : new Date(task.ultimateDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{task.elementName}</TableCell>
                        <TableCell>{task.spaceName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
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
              ))
            ) : (
              <Typography variant="body1">Geen taken geselecteerd.</Typography>
            )}
          </CardContent>
        );
      case 2:
        // Step 3: Configure Options
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 3: Configureer Opties
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useInterval}
                    onChange={(e) => setUseInterval(e.target.checked)}
                  />
                }
                label="Gebruik interval"
              />
              {useInterval && (
                <Box sx={{ pl: 4 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Interval jaren"
                        value={intervalSettings.intervalYears}
                        onChange={(e) =>
                          setIntervalSettings({
                            ...intervalSettings,
                            intervalYears: parseFloat(e.target.value),
                          })
                        }
                        variant="outlined"
                        size="medium"
                        inputProps={{ step: '0.1' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Totaal jaren"
                        value={intervalSettings.totalYears}
                        onChange={(e) =>
                          setIntervalSettings({
                            ...intervalSettings,
                            totalYears: parseFloat(e.target.value),
                          })
                        }
                        variant="outlined"
                        size="medium"
                        inputProps={{ step: '0.1' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Inflatiepercentage (%)"
                        value={intervalSettings.inflationRate}
                        onChange={(e) =>
                          setIntervalSettings({
                            ...intervalSettings,
                            inflationRate: parseFloat(e.target.value),
                          })
                        }
                        variant="outlined"
                        size="medium"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customTask.offerteNeeded}
                    onChange={(e) =>
                      setCustomTask({
                        ...customTask,
                        offerteNeeded: e.target.checked,
                      })
                    }
                  />
                }
                label="Offerte nodig"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={setDirectToWorkDate}
                    onChange={(e) => setSetDirectToWorkDate(e.target.checked)}
                  />
                }
                label="Stel werkdatum in op einddatum"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useContract}
                    onChange={(e) => setUseContract(e.target.checked)}
                  />
                }
                label="Gebruik contract"
              />
              {useContract && (
                <Box sx={{ pl: 4 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Totale contractkosten"
                        value={contractSettings.contractCost}
                        onChange={(e) =>
                          setContractSettings({
                            ...contractSettings,
                            contractCost: parseFloat(e.target.value),
                          })
                        }
                        type="number"
                        variant="outlined"
                        size="medium"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Contractduur (jaren)"
                        value={contractSettings.contractDuration}
                        onChange={(e) =>
                          setContractSettings({
                            ...contractSettings,
                            contractDuration: parseInt(e.target.value, 10),
                          })
                        }
                        type="number"
                        variant="outlined"
                        size="medium"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </FormGroup>
          </CardContent>
        );
      case 3:
        // Step 4: Enter Estimated Prices
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 4: Voer Geschatte Prijzen In
            </Typography>
            {selectedElements.length > 0 ? (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {selectedElements.map((element) => {
                  const spaceName = element.spaceName || 'Onbekende ruimte';
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
          </CardContent>
        );
      case 4:
        // Step 5: Confirmation
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 5: Controleer en Bevestig
            </Typography>
            {conflictingTasks.length > 0 && (
              <Typography variant="body1" color="error">
                Er zijn conflicterende taken. Los deze op voordat u doorgaat.
              </Typography>
            )}
            {/* Timeline visualization */}
            <Typography variant="h6" gutterBottom>
              Tijdlijn
            </Typography>
            {timelineGroups.length > 0 && timelineItems.length > 0 ? (
              <Timeline
                groups={timelineGroups}
                items={timelineItems}
                defaultTimeStart={new Date()}
                defaultTimeEnd={addYears(new Date(), 1)}
              />
            ) : (
              <Typography variant="body1">Geen taken om weer te geven op de tijdlijn.</Typography>
            )}
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
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              icon={
                conflictingTasks.length > 0 && activeStep >= index ? (
                  <Tooltip title="Conflicten gevonden">
                    <WarningIcon color="error" />
                  </Tooltip>
                ) : undefined
              }
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Card>

      {/* Sidebar for task selection */}
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
          {filteredTasks.length > 0 ? (
            <List>
              {filteredTasks.map((task, index) => {
                const isSelected = selectedTasks.some(
                  (t) => t.beschrijving === task.beschrijving && t.category === task.category
                );
                return (
                  <ListItem
                    button
                    key={index}
                    onClick={() => handleTaskSelect(task)}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: isSelected ? '#e0f7fa' : 'inherit',
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
        </Box>
      </Drawer>

      {/* Navigation buttons */}
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
