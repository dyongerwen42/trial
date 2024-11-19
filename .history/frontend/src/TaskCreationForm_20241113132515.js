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
    ultimateDate: new Date(),
    durationDays: 0,
    offerteNeeded: true,
  });
  const [multiAssign, setMultiAssign] = useState(false);
  const [estimatedPrices, setEstimatedPrices] = useState({});
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedElement, setSelectedElement] = useState('');
  const [selectedElements, setSelectedElements] = useState([]);
  const [startDate, setStartDate] = useState(new Date());

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
        const allCategories = Array.from(new Set(elements.flatMap((el) => el.categories || ['default'])));
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
        if (tasks.length > 0) {
          setIsDrawerOpen(true);
        }
      } else {
        setAvailableTasks([]);
        setFilteredTasks([]);
      }

      setSelectedTasks([]);
    },
    [globalElements, multiAssign, selectedSpace, globalSpaces, tasksData]
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
        return [...prevSelected, { ...task, adjustments: {} }];
      }
    });
  };

  const handleTaskAdjustment = (index, field, value) => {
    setSelectedTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
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

      updatedTasks[index].adjustments = {
        ...updatedTasks[index].adjustments,
        [field]: adjustedValue,
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

    // Validatie van algemene velden
    if (isBefore(customTask.ultimateDate, startDate)) {
      alert('Ultimata Datum kan niet voor de Startdatum liggen.');
      return;
    }

    selectedElements.forEach((element) => {
      const spaceName = element.spaceName || 'Onbekende ruimte';

      selectedTasks.forEach((task, taskIndex) => {
        let taskName = task.adjustments.name || task.beschrijving;
        let taskDescription = task.adjustments.description || task.toelichting;
        let taskUrgency = task.adjustments.urgency || 3; // Standaard urgentie

        const elementTaskKey = `${element.spaceId}-${element.id}-${taskIndex}`;
        let currentEstimatedPrice = parseFloat(estimatedPrices[elementTaskKey] || 0);

        const offerAccepted = !customTask.offerteNeeded;

        let newUltimateDate = new Date(customTask.ultimateDate);
        let newStartDate = new Date(startDate);
        let newWorkDate = null;
        let newEndDate = addDays(newStartDate, parseInt(customTask.durationDays) || 0);

        if (offerAccepted) {
          newUltimateDate = addDays(
            newStartDate,
            parseInt(customTask.durationDays) || 0
          );
        }

        // Werkdatum instellen indien geselecteerd
        if (task.adjustments.setDirectToWorkDate && task.adjustments.workDate) {
          newWorkDate = new Date(task.adjustments.workDate);
        }

        // Einddatum instellen vanuit aanpassingen indien aanwezig
        if (task.adjustments.endDate) {
          newEndDate = new Date(task.adjustments.endDate);
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

        // Integratie van aanvullende velden zoals commentaar, contractkosten, etc.
        if (task.adjustments.comment) {
          newTask.planned.comment = task.adjustments.comment;
        }
        if (task.adjustments.contractCost) {
          newTask.planned.contractCost = parseFloat(task.adjustments.contractCost);
        }
        if (task.adjustments.contractDuration) {
          newTask.planned.contractDuration = parseInt(task.adjustments.contractDuration, 10);
        }
        if (task.adjustments.offerFiles) {
          newTask.planned.offerFiles = task.adjustments.offerFiles;
        }
        if (task.adjustments.invoiceFiles) {
          newTask.planned.invoiceFiles = task.adjustments.invoiceFiles;
        }

        dispatch({
          type: 'ADD_TASK',
          payload: { elementId: element.id, tasks: [newTask] },
        });
      });
    });

    saveData();
    resetForm();
  }, [
    customTask,
    selectedElements,
    selectedTasks,
    estimatedPrices,
    startDate,
    dispatch,
    saveData,
  ]);

  const resetForm = useCallback(() => {
    setCustomTask({
      ultimateDate: new Date(),
      durationDays: 0,
      offerteNeeded: true,
    });
    setMultiAssign(false);
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
      if (selectedTasks.length === 0) {
        alert('Selecteer minimaal één taak om door te gaan.');
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
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Startdatum
            </Typography>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Duur (dagen)
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Duur in dagen"
              value={customTask.durationDays}
              onChange={(e) =>
                setCustomTask((prev) => ({ ...prev, durationDays: e.target.value }))
              }
              variant="outlined"
              size="medium"
            />
          </Grid>
        </Grid>

        {/* Element Details */}
        {selectedElement && (
          <Box sx={{ mt: 4 }}>
            {selectedElements.map((el) => (
              <Paper key={el.id} elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Element Details
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
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
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
                      label="Urgentie"
                      value={task.adjustments.urgency || task.urgency?.toString() || ''}
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
                    <TextField
                      fullWidth
                      label="Geschatte Prijs (€)"
                      value={task.adjustments.estimatedPrice || task.estimatedPrice || ''}
                      onChange={(e) => handleTaskAdjustment(index, 'estimatedPrice', e.target.value)}
                      variant="outlined"
                      size="medium"
                      type="number"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Beschrijving"
                      value={task.adjustments.description || task.toelichting}
                      onChange={(e) => handleTaskAdjustment(index, 'description', e.target.value)}
                      variant="outlined"
                      size="medium"
                      multiline
                      minRows={4}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                </Grid>

                {/* Dynamische Formuliervelden */}
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={task.adjustments.useInterval || false}
                        onChange={(e) =>
                          handleTaskAdjustment(index, 'useInterval', e.target.checked)
                        }
                      />
                    }
                    label="Gebruik interval"
                  />
                  {task.adjustments.useInterval && (
                    <Box sx={{ pl: 4, mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Interval jaren"
                            value={task.adjustments.intervalYears || 1}
                            onChange={(e) =>
                              handleTaskAdjustment(index, 'intervalYears', e.target.value)
                            }
                            variant="outlined"
                            size="medium"
                            inputProps={{ step: '0.1' }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Totaal jaren"
                            value={task.adjustments.totalYears || 5}
                            onChange={(e) =>
                              handleTaskAdjustment(index, 'totalYears', e.target.value)
                            }
                            variant="outlined"
                            size="medium"
                            inputProps={{ step: '0.1' }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Inflatiepercentage (%)"
                            value={task.adjustments.inflationRate || 0}
                            onChange={(e) =>
                              handleTaskAdjustment(index, 'inflationRate', e.target.value)
                            }
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={task.adjustments.useContract || false}
                        onChange={(e) =>
                          handleTaskAdjustment(index, 'useContract', e.target.checked)
                        }
                      />
                    }
                    label="Gebruik contract"
                  />
                  {task.adjustments.useContract && (
                    <Box sx={{ pl: 4, mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Totale contractkosten (€)"
                            value={task.adjustments.contractCost || 0}
                            onChange={(e) =>
                              handleTaskAdjustment(index, 'contractCost', e.target.value)
                            }
                            type="number"
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Contractduur (jaren)"
                            value={task.adjustments.contractDuration || 1}
                            onChange={(e) =>
                              handleTaskAdjustment(index, 'contractDuration', e.target.value)
                            }
                            type="number"
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={task.adjustments.setDirectToWorkDate || false}
                        onChange={(e) =>
                          handleTaskAdjustment(index, 'setDirectToWorkDate', e.target.checked)
                        }
                      />
                    }
                    label="Werkdatum direct instellen"
                  />
                  {task.adjustments.setDirectToWorkDate && (
                    <Box sx={{ pl: 4, mt: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Werkdatum
                      </Typography>
                      <DatePicker
                        selected={task.adjustments.workDate || null}
                        onChange={(date) =>
                          handleTaskAdjustment(index, 'workDate', date)
                        }
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Selecteer werkdatum"
                        customInput={
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="medium"
                          />
                        }
                      />
                    </Box>
                  )}
                </Box>

                {/* Einddatum Picker - altijd zichtbaar */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Einddatum
                  </Typography>
                  <DatePicker
                    selected={
                      task.adjustments.endDate ||
                      addDays(startDate, customTask.durationDays ? parseInt(customTask.durationDays) : 0)
                    }
                    onChange={(date) =>
                      handleTaskAdjustment(index, 'endDate', date)
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecteer einddatum"
                    customInput={
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="medium"
                      />
                    }
                  />
                </Box>

                {/* Toevoegen van commentaar */}
                {selectedElements.length > 0 &&
                  selectedElements[0].type &&
                  selectedElements[0].type.toLowerCase().includes('climate') && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Commentaar
                      </Typography>
                      <TextField
                        fullWidth
                        label="Commentaar"
                        value={task.adjustments.comment || ''}
                        onChange={(e) => handleTaskAdjustment(index, 'comment', e.target.value)}
                        variant="outlined"
                        size="medium"
                        multiline
                        minRows={2}
                        sx={{ mb: 2 }}
                      />
                    </Box>
                  )}
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography variant="body1">Geen taken geselecteerd.</Typography>
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
                      const elementTaskKey = `${element.spaceId}-${element.id}-${taskIndex}`;
                      const estimatedPrice = estimatedPrices[elementTaskKey] || '0';
                      const offerAccepted = !customTask.offerteNeeded;

                      let newUltimateDate = new Date(customTask.ultimateDate);
                      let newStartDate = new Date(startDate);
                      let newWorkDate = null;
                      let newEndDate = addDays(
                        newStartDate,
                        customTask.durationDays ? parseInt(customTask.durationDays) : 0
                      );

                      if (offerAccepted) {
                        newUltimateDate = addDays(
                          newStartDate,
                          customTask.durationDays ? parseInt(customTask.durationDays) : 0
                        );
                      }

                      // Werkdatum instellen indien geselecteerd
                      if (task.adjustments.setDirectToWorkDate && task.adjustments.workDate) {
                        newWorkDate = new Date(task.adjustments.workDate);
                      }

                      // Einddatum instellen vanuit aanpassingen indien aanwezig
                      if (task.adjustments.endDate) {
                        newEndDate = new Date(task.adjustments.endDate);
                      }

                      return (
                        <TableRow key={`${element.id}-${taskIndex}`}>
                          <TableCell>{task.adjustments.name || task.beschrijving}</TableCell>
                          <TableCell>{element.name}</TableCell>
                          <TableCell>{spaceName}</TableCell>
                          <TableCell>€ {estimatedPrice}</TableCell>
                          <TableCell>
                            {offerAccepted
                              ? newStartDate.toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {newWorkDate ? newWorkDate.toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {newEndDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell>{task.planned.comment || '-'}</TableCell>
                          <TableCell>
                            {task.planned.contractCost
                              ? `€ ${task.planned.contractCost.toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {task.planned.contractDuration
                              ? `${task.planned.contractDuration} jaar(s)`
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

      <Card sx={{ mb: 4, boxShadow: 3 }}>
        {renderStepContent(activeStep)}
      </Card>

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
            disabled={selectedTasks.length === 0}
          >
            Taken Toevoegen
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            color="primary"
          >
            Volgende
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TaskCreationForm;
