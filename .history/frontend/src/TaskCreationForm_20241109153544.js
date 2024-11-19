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
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
    name: '',
    description: '',
    urgency: '',
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
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [favoriteTasks, setFavoriteTasks] = useState([]);

  // Stepper-state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Selecteer Taak Type en Toewijzing',
    'Vul Taakdetails In',
    'Configureer Opties',
    'Voer Geschatte Prijzen In',
    'Bevestig en Voeg Taak Toe',
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
    setSelectedTaskDetails(null);
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

      // Taken laden op basis van categorieën
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

      setSelectedTaskDetails(null);
    },
    [globalElements, multiAssign, selectedSpace, selectedTaskType]
  );

  const handleTaskSelect = (task) => {
    setSelectedTaskDetails(task);
    setCustomTask({
      ...customTask,
      name: task.beschrijving,
      description: task.toelichting,
      urgency: task.prioriteit ? task.prioriteit.toString() : '',
    });
    setIsDrawerOpen(false);
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

  const toggleFavoriteTask = (task) => {
    setFavoriteTasks((prevFavorites) => {
      const isFavorite = prevFavorites.some(
        (fav) => fav.beschrijving === task.beschrijving && fav.category === task.category
      );
      if (isFavorite) {
        return prevFavorites.filter(
          (fav) => !(fav.beschrijving === task.beschrijving && fav.category === task.category)
        );
      } else {
        return [...prevFavorites, task];
      }
    });
  };

  const handleAddTask = useCallback(() => {
    if (selectedElements.length === 0) {
      alert('Geen elementen geselecteerd om een taak aan toe te voegen.');
      return;
    }

    if (!customTask.name || !customTask.description || !customTask.urgency) {
      alert('Vul alle taakdetails in om door te gaan.');
      return;
    }

    selectedElements.forEach((element) => {
      const space = globalSpaces.find((space) => space.id === element.spaceId);
      const spaceName = space ? space.name : 'Onbekende ruimte';
      const elementKey = `${element.spaceId}-${element.id}`;

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
            name: customTask.name,
            description: customTask.description,
            urgency: customTask.urgency,
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
          name: customTask.name,
          description: customTask.description,
          urgency: customTask.urgency,
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
  ]);

  const resetForm = useCallback(() => {
    setCustomTask({
      name: '',
      description: '',
      urgency: '',
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
    setSelectedTaskDetails(null);
    setTaskSearchQuery('');
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
      if (!customTask.name || !customTask.description || !customTask.urgency) {
        alert('Vul alle taakdetails in om door te gaan.');
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
        // Stap 1: Selecteer Taak Type en Toewijzing
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
                    setSelectedTaskDetails(null);
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
          </CardContent>
        );
      case 1:
        // Stap 2: Vul Taakdetails In
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 2: Vul Taakdetails In
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setIsDrawerOpen(true)}
              sx={{ mb: 3 }}
              startIcon={<SearchIcon />}
            >
              Kies een Taak uit de Lijst
            </Button>
            <TextField
              fullWidth
              label="Naam"
              value={customTask.name}
              onChange={(e) => setCustomTask({ ...customTask, name: e.target.value })}
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Beschrijving"
              value={customTask.description}
              onChange={(e) => setCustomTask({ ...customTask, description: e.target.value })}
              variant="outlined"
              size="medium"
              multiline
              minRows={3}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Urgentie"
              value={customTask.urgency}
              onChange={(e) => setCustomTask({ ...customTask, urgency: e.target.value })}
              select
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
            >
              {[...Array(6).keys()].map((i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Duur in dagen"
              value={customTask.durationDays}
              onChange={(e) =>
                setCustomTask({ ...customTask, durationDays: parseInt(e.target.value, 10) })
              }
              variant="outlined"
              size="medium"
              sx={{ mb: 3 }}
            />
            <DatePicker
              selected={customTask.ultimateDate}
              onChange={(date) => setCustomTask({ ...customTask, ultimateDate: date })}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              customInput={
                <TextField
                  variant="outlined"
                  size="medium"
                  label="Einddatum"
                  sx={{ width: '100%' }}
                />
              }
            />
          </CardContent>
        );
      case 2:
        // Stap 3: Configureer Opties
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
        // Stap 4: Voer Geschatte Prijzen In
        return (
          <CardContent>
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
          </CardContent>
        );
      case 4:
        // Stap 5: Bevestiging
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 5: Bevestig en Voeg Taak Toe
            </Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                <strong>Taak Type:</strong> {selectedTaskType}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Ruimte:</strong> {multiAssign ? 'Alle ruimtes' : selectedSpace}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Element:</strong> {selectedElement}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Taak Naam:</strong> {customTask.name}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Beschrijving:</strong> {customTask.description}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Urgentie:</strong> {customTask.urgency}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Einddatum:</strong> {customTask.ultimateDate.toLocaleDateString()}
              </Typography>
              {useInterval && (
                <>
                  <Typography variant="subtitle1">
                    <strong>Interval jaren:</strong> {intervalSettings.intervalYears}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Totaal jaren:</strong> {intervalSettings.totalYears}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Inflatiepercentage:</strong> {intervalSettings.inflationRate}%
                  </Typography>
                </>
              )}
              {useContract && (
                <>
                  <Typography variant="subtitle1">
                    <strong>Totale contractkosten:</strong> €{contractSettings.contractCost}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Contractduur:</strong> {contractSettings.contractDuration} jaar
                  </Typography>
                </>
              )}
              <Typography variant="subtitle1">
                <strong>Geschatte Prijs:</strong>{' '}
                {selectedElements
                  .map((el) => estimatedPrices[`${el.spaceId}-${el.id}`] || 'N.v.t.')
                  .join(', ')}
              </Typography>
            </Paper>
            <Typography variant="body1">
              Klik op "Taak Toevoegen" om de taak toe te voegen of gebruik de "Vorige" knop om
              aanpassingen te maken.
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
        Nieuwe Taak Aanmaken
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ mb: 4 }}>
        {renderStepContent(activeStep)}
      </Card>

      {/* Zijpaneel voor taakselectie */}
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
          {loadingTasks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredTasks.length > 0 ? (
            <List>
              {filteredTasks.map((task, index) => {
                const isFavorite = favoriteTasks.some(
                  (fav) => fav.beschrijving === task.beschrijving && fav.category === task.category
                );
                return (
                  <ListItem
                    button
                    key={index}
                    onClick={() => handleTaskSelect(task)}
                    sx={{ mb: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f0f0f0' } }}
                  >
                    <ListItemText
                      primary={task.beschrijving}
                      secondary={`${task.toelichting} (Categorie: ${task.category})`}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTask(task);
                      }}
                    >
                      {isFavorite ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
            Taak Toevoegen
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
