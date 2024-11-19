// TaskCreationForm.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  TableContainer,
  CircularProgress,
  ListSubheader,
} from '@mui/material';
import {
  Save as SaveIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';
import { addDays, isBefore } from 'date-fns';
import { useMjopContext } from './MjopContext'; // Pas het pad indien nodig aan
import tasksData from './taken.json'; // Zorg ervoor dat het pad correct is

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  // State variabelen
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [customTask, setCustomTask] = useState({
    name: '',
    description: '',
    urgency: 3,
    durationDays: 0,
    ultimateDate: new Date(),
    offerteNeeded: true,
  });
  const [multiAssign, setMultiAssign] = useState(false);
  const [estimatedPrices, setEstimatedPrices] = useState({});
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedElement, setSelectedElement] = useState('');
  const [selectedElements, setSelectedElements] = useState([]);

  // Nieuwe state variabelen
  const [availableTasks, setAvailableTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [existingTasks, setExistingTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Selecteer Taak Type en Toewijzing',
    'Vul Taakdetails In',
    'Controleer en Bevestig',
  ];

  // Zorg ervoor dat 'Algemeen' ruimte en element aanwezig zijn
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
          categories: ['default'], // Voeg een standaard categorie toe
        };
        updatedElements.push(algemeenElement);
        setGlobalElements(updatedElements);
      }
    };

    ensureAlgemeenOptions();
  }, [globalSpaces, globalElements, setGlobalSpaces, setGlobalElements]);

  // Handlers
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

      // Ruimtenamen toewijzen aan elementen en andere details
      elements = elements.map((el) => {
        const space = globalSpaces.find((space) => space.id === el.spaceId);
        return { ...el, spaceName: space ? space.name : 'Onbekende ruimte' };
      });

      setSelectedElements(elements);

      // Bestaande taken ophalen uit geselecteerde elementen
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

      // Taken laden op basis van alle unieke categorieën
      if (elements.length > 0) {
        const allCategories = Array.from(
          new Set(elements.flatMap((el) => el.categories || ['default']))
        );
        setLoadingTasks(true);
        const tasks = [];

        allCategories.forEach((category) => {
          const categoryTasks = tasksData.onderhoudstaken[category];
          if (categoryTasks) {
            const taskTypes = Object.keys(categoryTasks); // e.g., 'onderhoud', 'reparaties'
            taskTypes.forEach((taskType) => {
              const tasksOfType = categoryTasks[taskType];
              if (tasksOfType) {
                tasks.push(
                  ...tasksOfType.map((task) => ({
                    ...task,
                    category,
                    taskType, // Voeg taaktype toe indien nodig
                  }))
                );
              }
            });
          } else if (category === 'default') {
            // Laad standaardtaken
            const defaultTasks = tasksData.onderhoudstaken['default'] || [];
            tasks.push(
              ...defaultTasks.map((task) => ({
                ...task,
                category: 'Default',
                taskType: 'onderhoud',
              }))
            );
          }
        });

        setAvailableTasks(tasks);
        setFilteredTasks(tasks);
        setLoadingTasks(false);
      } else {
        setAvailableTasks([]);
        setFilteredTasks([]);
      }

      setSelectedTasks([]);
    },
    [globalElements, multiAssign, selectedSpace, globalSpaces]
  );

  // Update existing tasks when selectedElements change
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
        return [...prevSelected, { ...task }];
      }
    });
  };

  // Nieuw: Aanpassingen per element per taak
  const [taskAdjustments, setTaskAdjustments] = useState({});

  const handleTaskAdjustment = (elementId, taskIndex, field, value) => {
    setTaskAdjustments((prevAdjustments) => {
      const elementAdjustments = prevAdjustments[elementId] || {};
      const taskAdjustment = elementAdjustments[taskIndex] || {};

      let adjustedValue = value;

      // Uniformiteit van urgency
      if (field === 'urgency') {
        adjustedValue = parseInt(value, 10);
        if (isNaN(adjustedValue)) adjustedValue = '';
      }

      // Validatie van durationDays
      if (field === 'durationDays') {
        adjustedValue = parseInt(value, 10);
        if (isNaN(adjustedValue) || adjustedValue < 0) adjustedValue = 0;
      }

      return {
        ...prevAdjustments,
        [elementId]: {
          ...elementAdjustments,
          [taskIndex]: {
            ...taskAdjustment,
            [field]: adjustedValue,
          },
        },
      };
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

    if (selectedTasks.length === 0 && !customTask.name) {
      alert('Voeg een taak toe of selecteer er een uit de lijst.');
      return;
    }

    const tasksToAdd = selectedTasks.length > 0 ? selectedTasks : [customTask];

    selectedElements.forEach((element) => {
      const spaceName = element.spaceName || 'Onbekende ruimte';

      tasksToAdd.forEach((task, taskIndex) => {
        const adjustments =
          (taskAdjustments[element.id] && taskAdjustments[element.id][taskIndex]) || {};

        let taskName = adjustments.name || task.name || task.beschrijving;
        let taskDescription = adjustments.description || task.description || task.toelichting;
        let taskUrgency = adjustments.urgency || task.urgency || 3; // Standaard urgentie

        const elementTaskKey = `${element.spaceId}-${element.id}-${taskIndex}`;
        let currentEstimatedPrice = parseFloat(adjustments.estimatedPrice || 0);

        const offerAccepted = !task.offerteNeeded;

        // Startdatum en duur uit de taakaanpassingen halen
        let newStartDate = adjustments.startDate || new Date();
        let durationDays = adjustments.durationDays ? parseInt(adjustments.durationDays) : 0;

        let newUltimateDate = new Date(adjustments.ultimateDate || newStartDate);
        let newWorkDate = null;
        let newEndDate = addDays(newStartDate, durationDays);

        if (offerAccepted) {
          newUltimateDate = addDays(newStartDate, durationDays);
        }

        // Werkdatum instellen indien geselecteerd
        if (adjustments.setDirectToWorkDate && adjustments.workDate) {
          newWorkDate = new Date(adjustments.workDate);
        }

        // Einddatum instellen vanuit aanpassingen indien aanwezig
        if (adjustments.endDate) {
          newEndDate = new Date(adjustments.endDate);
        }

        // Validatie dat einddatum na startdatum ligt
        if (isBefore(newEndDate, newStartDate)) {
          alert(`Einddatum kan niet voor de startdatum liggen voor taak: ${taskName}`);
          newEndDate = addDays(newStartDate, 1); // Stel minimaal één dag na startdatum
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
            workDate: newWorkDate ? newWorkDate.toISOString() : null,
            startDate: offerAccepted ? newStartDate.toISOString() : null,
            endDate: newEndDate.toISOString(),
            offerAccepted,
            // Voeg andere geplande velden toe indien nodig
          },
        };

        // Integratie van aanvullende velden zoals interval, contract, commentaar, etc.
        if (adjustments.comment) {
          newTask.planned.comment = adjustments.comment;
        }
        if (adjustments.contractCost) {
          newTask.planned.contractCost = parseFloat(adjustments.contractCost);
        }
        if (adjustments.contractDuration) {
          newTask.planned.contractDuration = parseInt(adjustments.contractDuration, 10);
        }
        if (adjustments.useInterval) {
          newTask.planned.useInterval = true;
          newTask.planned.intervalYears = parseFloat(adjustments.intervalYears);
          newTask.planned.totalYears = parseFloat(adjustments.totalYears);
          newTask.planned.inflationRate = parseFloat(adjustments.inflationRate);
        }
        if (adjustments.offerFiles) {
          newTask.planned.offerFiles = adjustments.offerFiles;
        }
        if (adjustments.invoiceFiles) {
          newTask.planned.invoiceFiles = adjustments.invoiceFiles;
        }

        dispatch({
          type: 'ADD_TASK',
          payload: { elementId: element.id, tasks: [newTask] },
        });
      });
    });

    saveData();
    resetForm();
  }, [customTask, selectedElements, selectedTasks, taskAdjustments, dispatch, saveData]);

  const resetForm = useCallback(() => {
    setCustomTask({
      name: '',
      description: '',
      urgency: 3,
      durationDays: 0,
      ultimateDate: new Date(),
      offerteNeeded: true,
    });
    setMultiAssign(false);
    setEstimatedPrices({});
    setSelectedElement('');
    setSelectedSpace('');
    setSelectedElements([]);
    setSelectedTaskType('');
    setActiveStep(0);
    setAvailableTasks([]);
    setFilteredTasks([]);
    setSelectedTasks([]);
    setTaskSearchQuery('');
    setExistingTasks([]);
    setTaskAdjustments({});
  }, []);

  const handleNext = () => {
    // Validatie voordat we doorgaan naar de volgende stap
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
      if (selectedTasks.length === 0 && !customTask.name) {
        alert('Voeg een taak toe of selecteer er een uit de lijst om door te gaan.');
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Subcomponent voor Stap 1
  const Step1SelectAssignment = () => {
    const filteredElementsStep1 = globalElements.filter((element) =>
      multiAssign ? true : element.spaceId === selectedSpace
    );

    const uniqueElementNames = useMemo(() => {
      return [...new Set(filteredElementsStep1.map((el) => el.name))];
    }, [filteredElementsStep1]);

    return (
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stap 1: Selecteer Taak Type en Toewijzing
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Taak Type"
              value={selectedTaskType}
              onChange={(e) => setSelectedTaskType(e.target.value)}
              variant="outlined"
              size="medium"
            >
              <MenuItem value="" disabled>
                Selecteer taaktype
              </MenuItem>
              <MenuItem value="Onderhoud">Onderhoud</MenuItem>
              <MenuItem value="Reparatie">Reparatie</MenuItem>
              <MenuItem value="Inspectie">Inspectie</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
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
                  }}
                />
              }
              label="Multi-Assign (alle elementen in alle ruimtes)"
            />
          </Grid>
          {!multiAssign && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Selecteer ruimte"
                value={selectedSpace}
                onChange={handleSpaceChange}
                variant="outlined"
                size="medium"
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
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Selecteer element"
              value={selectedElement}
              onChange={handleElementChange}
              variant="outlined"
              size="medium"
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
          </Grid>
        </Grid>

        {/* Element Details */}
        {selectedElement && (
          <Box sx={{ mt: 4 }}>
            {selectedElements.map((el) => (
              <Paper key={el.id} elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Element Details ({el.spaceName} - {el.name})
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Beschrijving:</strong> {el.description || 'Geen beschrijving'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Type:</strong> {el.type || 'Onbekend'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Materiaal:</strong> {el.material || 'Onbepaald'}
                    </Typography>
                    {el.customMaterial && (
                      <Typography variant="body1">
                        <strong>Aangepast Materiaal:</strong> {el.customMaterial}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Levensduur:</strong> {el.levensduur || 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Aanschafdatum:</strong>{' '}
                      {el.aanschafDatum ? new Date(el.aanschafDatum).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Vervangingskosten:</strong> € {el.vervangingsKosten || '0.00'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Gebreken en Inspectierapporten */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Gebreken
                  </Typography>
                  {el.gebreken && (
                    <Grid container spacing={2}>
                      {Object.keys(el.gebreken).map((severity) => (
                        <Grid item xs={12} sm={4} key={severity}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}:
                          </Typography>
                          <List dense>
                            {el.gebreken[severity].map((defect, idx) => (
                              <ListItem key={idx} sx={{ pl: 2 }}>
                                <ListItemText primary={defect} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>

                {el.inspectionReport && el.inspectionReport.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Inspectierapporten
                    </Typography>
                    {el.inspectionReport.map((report) => (
                      <Paper key={report.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Inspectiedatum:</strong>{' '}
                          {report.inspectionDate
                            ? new Date(report.inspectionDate).toLocaleDateString()
                            : 'Nog niet geïnspecteerd'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong>{' '}
                          {report.inspectionDone ? 'Geïnspecteerd' : 'Niet Geïnspecteerd'}
                        </Typography>
                        {report.mistakes && report.mistakes.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Gebreken:
                            </Typography>
                            <List dense>
                              {report.mistakes.map((mistake) => (
                                <ListItem key={mistake.id} sx={{ pl: 2 }}>
                                  <ListItemText
                                    primary={`${mistake.category} (${mistake.severity})`}
                                    secondary={`Omschrijving: ${mistake.description}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}

        {/* Bestaande taken indien aanwezig */}
        {existingTasks.length > 0 && (
          <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Al Geplande Taken voor Geselecteerde Elementen
            </Typography>
            <TableContainer component={Paper}>
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
            </TableContainer>
          </Paper>
        )}
      </CardContent>
    );
  };

  // Subcomponent voor Stap 2
  const Step2FillTaskDetails = () => {
    const [newTask, setNewTask] = useState({
      name: '',
      description: '',
      urgency: 3,
      durationDays: 0,
    });

    const handleNewTaskChange = (field, value) => {
      setNewTask((prevTask) => ({
        ...prevTask,
        [field]: value,
      }));
    };

    const handleAddCustomTask = () => {
      if (!newTask.name) {
        alert('Vul een taaknaam in.');
        return;
      }
      setSelectedTasks((prevTasks) => [...prevTasks, { ...newTask }]);
      setNewTask({
        name: '',
        description: '',
        urgency: 3,
        durationDays: 0,
      });
    };

    return (
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stap 2: Vul Taakdetails In
        </Typography>

        <Button
          variant="outlined"
          onClick={() => setIsDrawerOpen(true)}
          sx={{ mt: 2, mb: 3 }}
          startIcon={<SearchIcon />}
        >
          Kies Taken uit de Lijst
        </Button>

        <Typography variant="subtitle1" gutterBottom>
          Voeg een eigen taak toe
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Taaknaam"
              value={newTask.name}
              onChange={(e) => handleNewTaskChange('name', e.target.value)}
              variant="outlined"
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Urgentie"
              value={newTask.urgency}
              onChange={(e) => handleNewTaskChange('urgency', e.target.value)}
              select
              variant="outlined"
              size="medium"
            >
              {[...Array(6).keys()].map((i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Beschrijving"
              value={newTask.description}
              onChange={(e) => handleNewTaskChange('description', e.target.value)}
              variant="outlined"
              size="medium"
              multiline
              minRows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleAddCustomTask}>
              Taak Toevoegen
            </Button>
          </Grid>
        </Grid>

        {selectedTasks.length > 0 ? (
          selectedElements.map((element) => (
            <Accordion key={element.id} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {element.spaceName} - {element.name}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {selectedTasks.map((task, taskIndex) => {
                  const adjustments =
                    (taskAdjustments[element.id] && taskAdjustments[element.id][taskIndex]) || {};

                  return (
                    <Accordion key={taskIndex} defaultExpanded sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          {adjustments.name || task.beschrijving || task.name}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {/* Formulier voor taakaanpassingen per element */}
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Naam"
                              value={adjustments.name || task.beschrijving || task.name}
                              onChange={(e) =>
                                handleTaskAdjustment(element.id, taskIndex, 'name', e.target.value)
                              }
                              variant="outlined"
                              size="medium"
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              label="Urgentie"
                              value={adjustments.urgency || task.urgency?.toString() || ''}
                              onChange={(e) =>
                                handleTaskAdjustment(element.id, taskIndex, 'urgency', e.target.value)
                              }
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
                            <TextField
                              fullWidth
                              label="Geschatte Prijs (€)"
                              value={adjustments.estimatedPrice || ''}
                              onChange={(e) =>
                                handleTaskAdjustment(
                                  element.id,
                                  taskIndex,
                                  'estimatedPrice',
                                  e.target.value
                                )
                              }
                              variant="outlined"
                              size="medium"
                              type="number"
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="subtitle1" gutterBottom>
                              Startdatum
                            </Typography>
                            <DatePicker
                              selected={adjustments.startDate || new Date()}
                              onChange={(date) =>
                                handleTaskAdjustment(element.id, taskIndex, 'startDate', date)
                              }
                              dateFormat="dd/MM/yyyy"
                              customInput={
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  size="medium"
                                  placeholder="Selecteer startdatum"
                                />
                              }
                            />
                            <Typography variant="subtitle1" gutterBottom>
                              Duur (dagen)
                            </Typography>
                            <TextField
                              fullWidth
                              type="number"
                              label="Duur in dagen"
                              value={adjustments.durationDays || ''}
                              onChange={(e) =>
                                handleTaskAdjustment(
                                  element.id,
                                  taskIndex,
                                  'durationDays',
                                  e.target.value
                                )
                              }
                              variant="outlined"
                              size="medium"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Beschrijving"
                              value={
                                adjustments.description ||
                                task.toelichting ||
                                task.description ||
                                ''
                              }
                              onChange={(e) =>
                                handleTaskAdjustment(
                                  element.id,
                                  taskIndex,
                                  'description',
                                  e.target.value
                                )
                              }
                              variant="outlined"
                              size="medium"
                              multiline
                              minRows={4}
                              sx={{ mb: 2 }}
                            />
                          </Grid>
                        </Grid>

                        {/* Dynamische Formuliervelden */}
                        {/* ... (Rest van de aanpassingsvelden per element per taak, vergelijkbaar met eerder) */}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography variant="body1">Geen taken geselecteerd of toegevoegd.</Typography>
        )}
      </CardContent>
    );
  };

  // Subcomponent voor Stap 3
  const Step3ReviewConfirm = () => {
    return (
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stap 3: Controleer en Bevestig
        </Typography>
        <Typography variant="body1">
          Controleer de details en klik op "Taken Toevoegen" om de taken toe te voegen.
        </Typography>
        {/* Overzicht van voorgestelde taken */}
        {selectedElements.length > 0 && selectedTasks.length > 0 && (
          <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Overzicht van Toe Te Voegen Taken
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Taak Naam</TableCell>
                    <TableCell>Element</TableCell>
                    <TableCell>Ruimte</TableCell>
                    <TableCell>Geschatte Prijs (€)</TableCell>
                    <TableCell>Startdatum</TableCell>
                    <TableCell>Werkdatum</TableCell>
                    <TableCell>Einddatum</TableCell>
                    <TableCell>Commentaar</TableCell>
                    <TableCell>Contractkosten (€)</TableCell>
                    <TableCell>Contractduur (jaren)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedElements.map((element) => {
                    const spaceName = element.spaceName || 'Onbekende ruimte';
                    return selectedTasks.map((task, taskIndex) => {
                      const adjustments =
                        (taskAdjustments[element.id] && taskAdjustments[element.id][taskIndex]) ||
                        {};

                      const estimatedPrice = adjustments.estimatedPrice || '0';
                      const offerAccepted = !task.offerteNeeded;

                      let newUltimateDate = new Date(adjustments.ultimateDate || new Date());
                      let newStartDate = adjustments.startDate || new Date();
                      let newWorkDate = null;
                      let durationDays = adjustments.durationDays
                        ? parseInt(adjustments.durationDays)
                        : 0;
                      let newEndDate = addDays(newStartDate, durationDays);

                      if (offerAccepted) {
                        newUltimateDate = addDays(newStartDate, durationDays);
                      }

                      // Werkdatum instellen indien geselecteerd
                      if (adjustments.setDirectToWorkDate && adjustments.workDate) {
                        newWorkDate = new Date(adjustments.workDate);
                      }

                      // Einddatum instellen vanuit aanpassingen indien aanwezig
                      if (adjustments.endDate) {
                        newEndDate = new Date(adjustments.endDate);
                      }

                      return (
                        <TableRow key={`${element.id}-${taskIndex}`}>
                          <TableCell>
                            {adjustments.name || task.beschrijving || task.name}
                          </TableCell>
                          <TableCell>{element.name}</TableCell>
                          <TableCell>{spaceName}</TableCell>
                          <TableCell>€ {estimatedPrice}</TableCell>
                          <TableCell>
                            {offerAccepted
                              ? new Date(newStartDate).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {newWorkDate ? newWorkDate.toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>{newEndDate.toLocaleDateString()}</TableCell>
                          <TableCell>{adjustments.comment || '-'}</TableCell>
                          <TableCell>
                            {adjustments.contractCost
                              ? `€ ${parseFloat(adjustments.contractCost).toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {adjustments.contractDuration
                              ? `${adjustments.contractDuration} jaar(s)`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </CardContent>
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return <Step1SelectAssignment />;
      case 1:
        return <Step2FillTaskDetails />;
      case 2:
        return <Step3ReviewConfirm />;
      default:
        return 'Onbekende stap';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom align="center">
        Nieuwe Taken Aanmaken
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ mb: 4, boxShadow: 3 }}>{renderStepContent(activeStep)}</Card>

      {/* Sidebar voor taakselectie */}
      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <Box sx={{ width: { xs: 300, sm: 400 }, p: 2 }}>
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
          {loadingTasks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          ) : filteredTasks.length > 0 ? (
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

      {/* Navigatieknoppen */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
          color="primary"
        >
          Vorige
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleAddTask}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={selectedTasks.length === 0 && !customTask.name}
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
