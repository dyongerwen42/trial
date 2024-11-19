import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import { addYears, addDays } from "date-fns";
import { useMjopContext } from "./MjopContext"; // Pas het pad aan indien nodig

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  // State variabelen
  const [selectedTaskType, setSelectedTaskType] = useState("");

  const [customTask, setCustomTask] = useState({
    name: "",
    description: "",
    urgency: "",
    ultimateDate: new Date(),
    intervalYears: 1,
    totalYears: 5,
    durationDays: 0,
    inflationRate: 0,
    offerteNeeded: true,
  });

  const [useInterval, setUseInterval] = useState(false);
  const [multiAssign, setMultiAssign] = useState(false);
  const [useContract, setUseContract] = useState(false);
  const [contractCost, setContractCost] = useState(0);
  const [contractDuration, setContractDuration] = useState(1);
  const [estimatedPrices, setEstimatedPrices] = useState({});
  const [selectedSpace, setSelectedSpace] = useState("");
  const [selectedElement, setSelectedElement] = useState("");
  const [tasks, setTasks] = useState([]);
  const [setDirectToWorkDate, setSetDirectToWorkDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 0));

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Taak Instellingen",
    "Kies Taak Type",
    "Taak Details",
    "Toewijzing",
    "Geschatte prijzen en foto's",
  ];

  useEffect(() => {
    const ensureAlgemeenOptions = () => {
      let updatedSpaces = [...globalSpaces];
      let updatedElements = [...globalElements];

      let algemeenSpace = updatedSpaces.find((space) => space.name === "Algemeen");
      if (!algemeenSpace) {
        algemeenSpace = { id: uuidv4(), name: "Algemeen" };
        updatedSpaces.push(algemeenSpace);
        setGlobalSpaces(updatedSpaces);
      }

      let algemeenElement = updatedElements.find(
        (element) => element.name === "Algemeen" && element.spaceId === algemeenSpace.id
      );
      if (!algemeenElement) {
        algemeenElement = {
          id: uuidv4(),
          name: "Algemeen",
          spaceId: algemeenSpace.id,
          tasks: [],
        };
        updatedElements.push(algemeenElement);
        setGlobalElements(updatedElements);
      }
    };

    ensureAlgemeenOptions();
  }, [globalSpaces, globalElements, setGlobalSpaces, setGlobalElements]);

  useEffect(() => {
    if (!customTask.offerteNeeded && startDate) {
      setEndDate(addDays(startDate, customTask.durationDays || 0));
    }
  }, [startDate, customTask.durationDays, customTask.offerteNeeded]);

  const handleSpaceChange = useCallback((event) => {
    const spaceId = event.target.value;
    setSelectedSpace(spaceId);
    setSelectedElement("");
  }, []);

  const handleElementChange = useCallback((event) => {
    const elementName = event.target.value;
    setSelectedElement(elementName);
  }, []);

  const handleAddTask = useCallback(() => {
    console.log("Starting handleAddTask execution");

    if (!globalElements || globalElements.length === 0) {
      console.error("No elements available to create tasks for.");
      return;
    }

    console.log("Available global elements:", globalElements);

    // Filter elements that match the selected criteria
    const elementsToCreateTasksFor = multiAssign
      ? globalElements.filter((el) => el.name === selectedElement)
      : globalElements.filter(
          (el) => el.name === selectedElement && el.spaceId === selectedSpace
        );

    console.log("Elements selected for task creation:", elementsToCreateTasksFor);

    // Loop through selected elements to create tasks for each
    elementsToCreateTasksFor.forEach((element) => {
      const space = globalSpaces.find((space) => space.id === element.spaceId);
      const spaceName = space ? space.name : "Unknown Space";
      const elementKey = `${element.spaceId}-${element.id}`;
      console.log(`Creating tasks for element: ${element.name} in space: ${spaceName}`);

      let currentUltimateDate = new Date(customTask.ultimateDate);
      let currentStartDate = new Date(startDate);
      let currentEndDate = new Date(endDate);
      let currentEstimatedPrice = parseFloat(estimatedPrices[elementKey] || 0);
      let previousYear = currentUltimateDate.getFullYear();

      console.log("Initial dates and estimated price:", {
        currentUltimateDate,
        currentStartDate,
        currentEndDate,
        currentEstimatedPrice,
      });

      const offerAccepted = !customTask.offerteNeeded;
      const intervalYears = parseFloat(customTask.intervalYears);
      const totalYears = parseFloat(customTask.totalYears);
      const newTasks = [];

      // Logic for task creation based on intervals or single task
      if (useInterval) {
        const taskCount = Math.floor(totalYears / intervalYears);
        const contractCostPerTask = useContract ? contractCost / taskCount : 0;

        for (let i = 0; i < totalYears; i += intervalYears) {
          let newUltimateDate;
          let newStartDate;
          let newEndDate;

          if (offerAccepted) {
            newStartDate = addYears(currentStartDate, intervalYears);
            newEndDate = addDays(newStartDate, customTask.durationDays || 0);
            newUltimateDate = newEndDate;
          } else {
            newUltimateDate = addYears(currentUltimateDate, intervalYears);
          }

          const currentYear = newUltimateDate.getFullYear();
          if (currentYear > previousYear) {
            currentEstimatedPrice *= 1 + parseFloat(customTask.inflationRate) / 100;
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
              endDate: offerAccepted ? newEndDate.toISOString() : null,
              offerAccepted,
            },
          };

          newTasks.push(newTask);
          currentUltimateDate = newUltimateDate;
          currentStartDate = newStartDate;
          currentEndDate = newEndDate;
        }
      } else {
        let newUltimateDate;
        let newStartDate;
        let newEndDate;

        if (offerAccepted) {
          newStartDate = currentStartDate;
          newEndDate = addDays(newStartDate, customTask.durationDays || 0);
          newUltimateDate = newEndDate;
        } else {
          newUltimateDate = new Date(customTask.ultimateDate);
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
            endDate: offerAccepted ? newEndDate.toISOString() : null,
            offerAccepted,
          },
        };

        newTasks.push(newTask);
      }

      // Dispatch tasks specific to this element, appending to any existing tasks
      dispatch({
        type: "ADD_TASK",
        payload: { elementId: element.id, tasks: newTasks },
      });
    });

    // Save data after tasks are added to elements
    saveData();

    console.log("Tasks added and saved to the database.");
    resetForm();
  }, [
    customTask,
    globalElements,
    globalSpaces,
    multiAssign,
    selectedElement,
    selectedSpace,
    estimatedPrices,
    setDirectToWorkDate,
    startDate,
    endDate,
    setGlobalElements,
    useContract,
    useInterval,
    contractCost,
    saveData,
    dispatch,
  ]);

  const resetForm = useCallback(() => {
    setCustomTask({
      name: "",
      description: "",
      urgency: "",
      ultimateDate: new Date(),
      intervalYears: 1,
      totalYears: 5,
      durationDays: 0,
      inflationRate: 0,
      offerteNeeded: true,
    });
    setUseInterval(false);
    setSetDirectToWorkDate(false);
    setMultiAssign(false);
    setUseContract(false);
    setContractCost(0);
    setContractDuration(1);
    setEstimatedPrices({});
    setSelectedElement("");
    setSelectedSpace("");
    setStartDate(new Date());
    setEndDate(new Date());
    setSelectedTaskType("");
    setActiveStep(0); // Reset to the first step
  }, []);

  const handleEstimatedPriceChange = (spaceId, elementId, value) => {
    const elementKey = `${spaceId}-${elementId}`;
    setEstimatedPrices((prev) => ({
      ...prev,
      [elementKey]: value,
    }));
  };

  const selectedElements = multiAssign
    ? globalElements.filter((element) => element.name === selectedElement)
    : globalElements.filter(
        (element) => element.name === selectedElement && element.spaceId === selectedSpace
      );

  const handleNext = () => {
    // Add validation if necessary
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
            {/* Taak Instellingen */}
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Taak Instellingen
              </Typography>
              {/* Verplaatst opties van 'Extra Opties' naar hier */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useInterval}
                    onChange={(e) => setUseInterval(e.target.checked)}
                  />
                }
                label="Gebruik interval"
                sx={{ mb: 2 }}
              />
              {useInterval && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Interval jaren"
                      value={customTask.intervalYears}
                      onChange={(e) =>
                        setCustomTask({
                          ...customTask,
                          intervalYears: parseFloat(e.target.value),
                        })
                      }
                      variant="outlined"
                      size="medium"
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                      inputProps={{ step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Totaal jaren"
                      value={customTask.totalYears}
                      onChange={(e) =>
                        setCustomTask({
                          ...customTask,
                          totalYears: parseFloat(e.target.value),
                        })
                      }
                      variant="outlined"
                      size="medium"
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                      inputProps={{ step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Inflatiepercentage (%)"
                      value={customTask.inflationRate}
                      onChange={(e) =>
                        setCustomTask({
                          ...customTask,
                          inflationRate: parseFloat(e.target.value),
                        })
                      }
                      variant="outlined"
                      size="medium"
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                    />
                  </Grid>
                </Grid>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={setDirectToWorkDate}
                    onChange={(e) => setSetDirectToWorkDate(e.target.checked)}
                  />
                }
                label="Stel werkdatum in op einddatum"
                sx={{ mb: 2 }}
              />
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
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useContract}
                    onChange={(e) => setUseContract(e.target.checked)}
                  />
                }
                label="Contract"
                sx={{ mb: 2 }}
              />
              {useContract && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Totale contractkosten"
                      value={contractCost}
                      onChange={(e) => setContractCost(parseFloat(e.target.value))}
                      type="number"
                      variant="outlined"
                      size="medium"
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contractduur (jaren)"
                      value={contractDuration}
                      onChange={(e) => setContractDuration(parseInt(e.target.value, 10))}
                      type="number"
                      variant="outlined"
                      size="medium"
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                    />
                  </Grid>
                </Grid>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={multiAssign}
                    onChange={(e) => setMultiAssign(e.target.checked)}
                  />
                }
                label="Multi-Assign (alle elementen in alle ruimtes)"
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
            {/* Taak Type Selectie */}
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Kies Taak Type
              </Typography>
              <TextField
                fullWidth
                select
                label="Taak Type"
                value={selectedTaskType}
                onChange={(e) => setSelectedTaskType(e.target.value)}
                variant="outlined"
                size="medium"
                sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 2 }}
              >
                {/* Opties voor taaktypes */}
                <MenuItem value="" disabled>
                  Selecteer taaktype
                </MenuItem>
                <MenuItem value="Onderhoud">Onderhoud</MenuItem>
                <MenuItem value="Reparatie">Reparatie</MenuItem>
                <MenuItem value="Inspectie">Inspectie</MenuItem>
              </TextField>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
            {/* Taak Details */}
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Taak Details
              </Typography>
              <TextField
                fullWidth
                label="Naam"
                value={customTask.name}
                onChange={(e) => setCustomTask({ ...customTask, name: e.target.value })}
                variant="outlined"
                size="medium"
                sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 2 }}
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
                sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 2 }}
              />
              <TextField
                fullWidth
                label="Urgentie"
                value={customTask.urgency}
                onChange={(e) => setCustomTask({ ...customTask, urgency: e.target.value })}
                select
                variant="outlined"
                size="medium"
                sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 2 }}
              >
                {[...Array(6).keys()].map((i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </TextField>
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
                    sx={{ width: "100%", backgroundColor: "#fff", borderRadius: 2 }}
                  />
                }
              />
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
            {/* Toewijzing */}
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Toewijzing
              </Typography>
              {!multiAssign && (
                <TextField
                  fullWidth
                  select
                  label="Selecteer ruimte"
                  value={selectedSpace}
                  onChange={handleSpaceChange}
                  variant="outlined"
                  size="medium"
                  sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 2 }}
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
                sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 2 }}
                disabled={!multiAssign && !selectedSpace}
              >
                <MenuItem value="" disabled>
                  Selecteer een element
                </MenuItem>
                {globalElements.map((element) => (
                  <MenuItem key={element.id} value={element.name}>
                    {element.name} ({element.type})
                  </MenuItem>
                ))}
              </TextField>
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <>
            {/* Geschatte prijzen en foto's */}
            {selectedElements.length > 0 && (
              <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                    Geschatte prijzen en foto's
                  </Typography>
                  <Box sx={{ display: "grid", gap: 3 }}>
                    {selectedElements.map((element) => {
                      const space = globalSpaces.find((space) => space.id === element.spaceId);
                      const spaceName = space ? space.name : "Onbekende ruimte";
                      return (
                        <Card
                          key={`${element.spaceId}-${element.id}`}
                          sx={{ boxShadow: 2, borderRadius: 2 }}
                        >
                          <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <TextField
                                fullWidth
                                type="number"
                                label={`Geschatte prijs voor ${spaceName} > ${element.name} > ${element.type} > ${element.material}`}
                                value={estimatedPrices[`${element.spaceId}-${element.id}`] || ""}
                                onChange={(e) =>
                                  handleEstimatedPriceChange(
                                    element.spaceId,
                                    element.id,
                                    e.target.value
                                  )
                                }
                                sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                                variant="outlined"
                                size="medium"
                              />
                            </Box>
                            <Box sx={{ flexShrink: 0 }}>
                              {element.photos && element.photos.length > 0 ? (
                                <img
                                  src={`http://localhost:5000/${element.photos[0]}`}
                                  alt={`${element.name}`}
                                  style={{
                                    width: "150px",
                                    height: "150px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                                  }}
                                />
                              ) : (
                                <Typography>Geen afbeelding beschikbaar</Typography>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Takenlijst */}
            {tasks.length > 0 && (
              <Card sx={{ mt: 4, boxShadow: 5, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                    Taken in {multiAssign ? "alle elementen" : selectedElement}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table aria-label="eenvoudige tabel">
                      <TableHead>
                        <TableRow>
                          <TableCell>Naam</TableCell>
                          <TableCell>Beschrijving</TableCell>
                          <TableCell>Urgentie</TableCell>
                          <TableCell>Einddatum</TableCell>
                          <TableCell>Geschatte prijs</TableCell>
                          <TableCell>Werkdatum</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>{task.name}</TableCell>
                            <TableCell>{task.description}</TableCell>
                            <TableCell>{task.urgency}</TableCell>
                            <TableCell>{task.ultimateDate}</TableCell>
                            <TableCell>€ {task.estimatedPrice}</TableCell>
                            <TableCell>{task.planned?.workDate || "N.v.t."}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </>
        );
      default:
        return "Onbekende stap";
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        backgroundColor: "#f4f4f9",
        borderRadius: 3,
        mb: 4,
        boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ color: "#2c3e50", fontWeight: "bold" }}>
        Nieuwe Taak Aanmaken
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      {/* Navigatieknoppen */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
          Vorige
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleAddTask}
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SaveIcon />}
            sx={{
              minWidth: 200,
              fontSize: "1.1rem",
              padding: "12px 24px",
              borderRadius: 3,
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.2)",
              },
            }}
            disabled={!selectedElement && !multiAssign}
          >
            Aangepaste taak toevoegen
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
