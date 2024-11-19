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
import { useMjopContext } from './MjopContext'; // Adjust the path if necessary
import tasksData from './taken.json'; // Ensure the path is correct

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
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [existingTasks, setExistingTasks] = useState([]);
  const [unplannedElements, setUnplannedElements] = useState([]);

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Selecteer Element(en)',
    'Selecteer Taken',
    'Configureer Opties',
    'Voer Geschatte Prijzen In',
    'Bevestig en Voeg Taken Toe',
  ];

  useEffect(() => {
    // Ensure "Algemeen" options are available
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

  // Function to update unplanned elements
  const updateUnplannedElements = useCallback(() => {
    const elementsWithNoTasks = globalElements.filter(
      (el) => !el.tasks || el.tasks.length === 0
    );
    setUnplannedElements(elementsWithNoTasks);
  }, [globalElements]);

  useEffect(() => {
    updateUnplannedElements();
  }, [globalElements, updateUnplannedElements]);

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
      setSelectedElements(elements);

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

        // Fetch existing tasks
        const existing = elements.flatMap((el) => el.tasks || []);
        setExistingTasks(existing);
      } else {
        setAvailableTasks([]);
        setFilteredTasks([]);
        setExistingTasks([]);
      }

      setSelectedTasks([]);
    },
    [globalElements, multiAssign, selectedSpace, selectedTaskType]
  );

  const handleTaskTypeChange = (event) => {
    setSelectedTaskType(event.target.value);
    // Reset tasks and filters when task type changes
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
    // The function to add tasks remains largely the same
    // ...
    saveData();
    resetForm();
    updateUnplannedElements();
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
    updateUnplannedElements,
  ]);

  const resetForm = useCallback(() => {
    // Reset form fields
    // ...
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
    // ...
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Step 1: Select Elements
        const filteredElements = globalElements.filter((element) =>
          multiAssign ? true : element.spaceId === selectedSpace
        );

        const uniqueElementNames = [...new Set(filteredElements.map((el) => el.name))];

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 1: Selecteer Element(en)
            </Typography>
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
          </Box>
        );
      case 1:
        // Step 2: Select Tasks
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
                        onChange={(e) => handleTaskAdjustment(index, 'description', e.target.value)}
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
        // Step 3: Configure Options
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 3: Configureer Opties
            </Typography>
            {/* Configure options as needed */}
          </Box>
        );
      case 3:
        // Step 4: Enter Estimated Prices
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
        // Step 5: Confirmation
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stap 5: Bevestig en Voeg Taken Toe
            </Typography>
            {/* Display a summary of tasks to be added */}
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
        Meerjarenonderhoudsplanning
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          {/* Display unplanned elements */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Niet-Ingeplande Elementen
            </Typography>
            {unplannedElements.length > 0 ? (
              <List>
                {unplannedElements.map((element) => (
                  <ListItem key={element.id}>
                    <ListItemText
                      primary={element.name}
                      secondary={`Ruimte: ${
                        globalSpaces.find((space) => space.id === element.spaceId)?.name ||
                        'Onbekende ruimte'
                      }`}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Pre-fill the form with this element
                        setSelectedElement(element.name);
                        setSelectedElements([element]);
                        setActiveStep(1);
                      }}
                    >
                      Taak Inplannen
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1">Alle elementen hebben geplande taken.</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          {/* Display existing tasks */}
          {existingTasks.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Geplande Taken voor Geselecteerde Elementen
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
            </Paper>
          )}
        </Grid>
      </Grid>

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
