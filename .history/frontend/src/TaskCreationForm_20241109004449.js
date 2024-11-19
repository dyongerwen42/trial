import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import { addYears, addDays } from "date-fns";
import { useMjopContext } from "./MjopContext"; // Adjust the path if necessary

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  // State variables
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [customTask, setCustomTask] = useState({
    name: "",
    description: "",
    urgency: "",
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
  const [selectedSpace, setSelectedSpace] = useState("");
  const [selectedElement, setSelectedElement] = useState("");
  const [selectedElements, setSelectedElements] = useState([]);
  const [setDirectToWorkDate, setSetDirectToWorkDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date());

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Selecteer Taak Type en Toewijzing",
    "Vul Taak Details In",
    "Configureer Opties",
    "Voer Geschatte Prijzen In",
    "Bevestig en Voeg Taak Toe",
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

  const handleSpaceChange = useCallback((event) => {
    const spaceId = event.target.value;
    setSelectedSpace(spaceId);
    setSelectedElement("");
    setSelectedElements([]);
  }, []);

  const handleElementChange = useCallback(
    (event) => {
      const elementName = event.target.value;
      setSelectedElement(elementName);

      if (multiAssign) {
        const elements = globalElements.filter((el) => el.name === elementName);
        setSelectedElements(elements);
      } else {
        const elements = globalElements.filter(
          (el) => el.name === elementName && el.spaceId === selectedSpace
        );
        setSelectedElements(elements);
      }
    },
    [globalElements, multiAssign, selectedSpace]
  );

  const handleAddTask = useCallback(() => {
    if (selectedElements.length === 0) {
      alert("Geen elementen geselecteerd om een taak aan toe te voegen.");
      return;
    }

    selectedElements.forEach((element) => {
      const space = globalSpaces.find((space) => space.id === element.spaceId);
      const spaceName = space ? space.name : "Onbekende ruimte";
      const elementKey = `${element.spaceId}-${element.id}`;

      let currentUltimateDate = new Date(customTask.ultimateDate);
      let currentStartDate = new Date(startDate);
      let currentEstimatedPrice = parseFloat(estimatedPrices[elementKey] || 0);
      let previousYear = currentUltimateDate.getFullYear();

      const offerAccepted = !customTask.offerteNeeded;
      const newTasks = [];

      if (useInterval) {
        const taskCount = Math.floor(intervalSettings.totalYears / intervalSettings.intervalYears);
        const contractCostPerTask = useContract
          ? contractSettings.contractCost / taskCount
          : 0;

        for (let i = 0; i < intervalSettings.totalYears; i += intervalSettings.intervalYears) {
          let newUltimateDate;
          let newStartDate;

          if (offerAccepted) {
            newStartDate = addYears(currentStartDate, intervalSettings.intervalYears);
            newUltimateDate = addDays(newStartDate, customTask.durationDays || 0);
          } else {
            newUltimateDate = addYears(currentUltimateDate, intervalSettings.intervalYears);
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
          currentUltimateDate = newUltimateDate;
          currentStartDate = newStartDate;
        }
      } else {
        let newUltimateDate = offerAccepted
          ? addDays(currentStartDate, customTask.durationDays || 0)
          : currentUltimateDate;

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
            startDate: offerAccepted ? currentStartDate.toISOString() : null,
            endDate: offerAccepted
              ? addDays(currentStartDate, customTask.durationDays || 0).toISOString()
              : null,
            offerAccepted,
          },
        };

        newTasks.push(newTask);
      }

      dispatch({
        type: "ADD_TASK",
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
      name: "",
      description: "",
      urgency: "",
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
    setSelectedElement("");
    setSelectedSpace("");
    setSelectedElements([]);
    setStartDate(new Date());
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

  const handleNext = () => {
    // Validation before moving to the next step
    if (activeStep === 0) {
      if (!selectedTaskType) {
        alert("Selecteer een taaktype om door te gaan.");
        return;
      }
      if (!multiAssign && !selectedSpace) {
        alert("Selecteer een ruimte of kies voor Multi-Assign.");
        return;
      }
      if (!selectedElement) {
        alert("Selecteer een element om door te gaan.");
        return;
      }
    }

    if (activeStep === 1) {
      if (!customTask.name || !customTask.description || !customTask.urgency) {
        alert("Vul alle taakdetails in om door te gaan.");
        return;
      }
    }

    if (activeStep === 3) {
      if (selectedElements.some((el) => !estimatedPrices[`${el.spaceId}-${el.id}`])) {
        alert("Voer voor alle elementen een geschatte prijs in om door te gaan.");
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
                    setSelectedSpace("");
                    setSelectedElement("");
                    setSelectedElements([]);
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
              {globalElements
                .filter((element) =>
                  multiAssign ? true : element.spaceId === selectedSpace
                )
                .map((element) => (
                  <MenuItem key={element.id} value={element.name}>
                    {element.name} ({element.type})
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
              Stap 2: Vul Taak Details In
            </Typography>
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
                  sx={{ width: "100%" }}
                />
              }
            />
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
                        inputProps={{ step: "0.1" }}
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
                        inputProps={{ step: "0.1" }}
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
        // Step 4: Input Estimated Prices
        return (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stap 4: Voer Geschatte Prijzen In
            </Typography>
            {selectedElements.length > 0 ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                {selectedElements.map((element) => {
                  const space = globalSpaces.find((space) => space.id === element.spaceId);
                  const spaceName = space ? space.name : "Onbekende ruimte";
                  return (
                    <Card key={`${element.spaceId}-${element.id}`} sx={{ p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth
                            type="number"
                            label={`Geschatte prijs voor ${spaceName} > ${element.name}`}
                            value={estimatedPrices[`${element.spaceId}-${element.id}`] || ""}
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
                                width: "100%",
                                maxHeight: "150px",
                                objectFit: "cover",
                                borderRadius: "8px",
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
              Stap 5: Bevestig en Voeg Taak Toe
            </Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                <strong>Taak Type:</strong> {selectedTaskType}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Ruimte:</strong> {multiAssign ? "Alle ruimtes" : selectedSpace}
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
                <strong>Geschatte Prijs:</strong>{" "}
                {selectedElements
                  .map((el) => estimatedPrices[`${el.spaceId}-${el.id}`] || "N.v.t.")
                  .join(", ")}
              </Typography>
            </Paper>
            <Typography variant="body1">
              Klik op "Taak Toevoegen" om de taak toe te voegen of gebruik de "Vorige" knop om
              aanpassingen te maken.
            </Typography>
          </CardContent>
        );
      default:
        return "Onbekende stap";
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

      {/* Navigation Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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
