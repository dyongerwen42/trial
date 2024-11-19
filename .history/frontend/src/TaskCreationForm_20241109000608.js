// Import statements
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
  FormGroup,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import { addYears, addDays } from "date-fns";
import { useMjopContext } from "./MjopContext";
import takenJson from "./taken.json"; // Import your tasks JSON file

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch,
  } = useMjopContext();

  // State variables
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
  const [selectedElementId, setSelectedElementId] = useState("");
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [setDirectToWorkDate, setSetDirectToWorkDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 0));

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
    setSelectedElementId("");
    setSelectedElement(null);
    setSelectedCategories([]);
    setAvailableActivities([]);
    setSelectedActivities([]);
  }, []);

  const handleElementChange = useCallback(
    (event) => {
      const elementId = event.target.value;
      setSelectedElementId(elementId);
      const element = globalElements.find((el) => el.id === elementId);
      setSelectedElement(element);

      if (element && element.categories) {
        setSelectedCategories(element.categories);
        fetchActivitiesForCategories(element.categories);
      } else {
        setSelectedCategories([]);
        setAvailableActivities([]);
      }
    },
    [globalElements]
  );

  const fetchActivitiesForCategories = (categories) => {
    // Assuming takenJson is structured with 'onderhoudstaken' at the root
    let activities = [];

    categories.forEach((category) => {
      const categoryTasks = takenJson.onderhoudstaken[category];
      if (categoryTasks) {
        activities.push({
          category,
          ...categoryTasks,
        });
      }
    });

    setAvailableActivities(activities);
  };

  const handleActivitySelection = (category, subcategory, activityIndex) => {
    const activityKey = `${category}-${subcategory}-${activityIndex}`;
    setSelectedActivities((prevSelected) => {
      if (prevSelected.includes(activityKey)) {
        return prevSelected.filter((key) => key !== activityKey);
      } else {
        return [...prevSelected, activityKey];
      }
    });
  };

  useEffect(() => {
    // Automatically fill in the task name and description based on selected activities
    if (selectedActivities.length > 0) {
      let names = [];
      let descriptions = [];

      selectedActivities.forEach((activityKey) => {
        const [category, subcategory, index] = activityKey.split("-");
        const activityList = takenJson.onderhoudstaken[category][subcategory];
        const activity = activityList[parseInt(index, 10)];

        if (activity) {
          names.push(activity.beschrijving);
          descriptions.push(activity.toelichting || activity.beschrijving);
        }
      });

      setCustomTask((prevTask) => ({
        ...prevTask,
        name: names.join(", "),
        description: descriptions.join("; "),
      }));
    } else {
      setCustomTask((prevTask) => ({
        ...prevTask,
        name: "",
        description: "",
      }));
    }
  }, [selectedActivities]);

  const handleAddTask = useCallback(() => {
    if (!selectedElement) {
      console.error("No element selected.");
      return;
    }

    const element = selectedElement;
    const space = globalSpaces.find((space) => space.id === element.spaceId);
    const spaceName = space ? space.name : "Unknown Space";
    const elementKey = `${element.spaceId}-${element.id}`;

    let currentUltimateDate = new Date(customTask.ultimateDate);
    let currentStartDate = new Date(startDate);
    let currentEndDate = new Date(endDate);
    let currentEstimatedPrice = parseFloat(estimatedPrices[elementKey] || 0);
    let previousYear = currentUltimateDate.getFullYear();

    const offerAccepted = !customTask.offerteNeeded;
    const intervalYears = parseFloat(customTask.intervalYears);
    const totalYears = parseFloat(customTask.totalYears);
    const newTasks = [];

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

    // Save data after tasks are added to elements
    saveData();

    console.log("Tasks added and saved to the database.");
    resetForm();
  }, [
    customTask,
    selectedElement,
    globalSpaces,
    estimatedPrices,
    setDirectToWorkDate,
    startDate,
    endDate,
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
    setSelectedElementId("");
    setSelectedElement(null);
    setSelectedSpace("");
    setSelectedCategories([]);
    setAvailableActivities([]);
    setSelectedActivities([]);
    setStartDate(new Date());
    setEndDate(new Date());
  }, []);

  const handleEstimatedPriceChange = (spaceId, elementId, value) => {
    const elementKey = `${spaceId}-${elementId}`;
    setEstimatedPrices((prev) => ({
      ...prev,
      [elementKey]: value,
    }));
  };

  const elementsInSelectedSpace = globalElements.filter(
    (element) => element.spaceId === selectedSpace
  );

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

      {/* Stap 1: Selecteer Ruimte en Element */}
      <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Stap 1: Selecteer Ruimte en Element
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
            value={selectedElementId}
            onChange={handleElementChange}
            variant="outlined"
            size="medium"
            sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 2 }}
            disabled={!multiAssign && !selectedSpace}
          >
            <MenuItem value="" disabled>
              Selecteer een element
            </MenuItem>
            {elementsInSelectedSpace.map((element) => (
              <MenuItem key={element.id} value={element.id}>
                {element.name} ({element.type})
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {/* Stap 2: Haal Categorieën en Activiteiten Op */}
      {availableActivities.length > 0 && (
        <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Stap 2: Selecteer Activiteiten
            </Typography>
            {availableActivities.map((categoryData) => (
              <div key={categoryData.category}>
                <Typography variant="h6">{categoryData.category}</Typography>
                {Object.keys(categoryData).map((subcategory) => {
                  if (subcategory === "category") return null;
                  const activities = categoryData[subcategory];
                  return (
                    <div key={`${categoryData.category}-${subcategory}`}>
                      <Typography variant="subtitle1">{subcategory}</Typography>
                      <FormGroup>
                        {activities.map((activity, index) => {
                          const activityKey = `${categoryData.category}-${subcategory}-${index}`;
                          return (
                            <FormControlLabel
                              key={activityKey}
                              control={
                                <Checkbox
                                  checked={selectedActivities.includes(activityKey)}
                                  onChange={() =>
                                    handleActivitySelection(categoryData.category, subcategory, index)
                                  }
                                />
                              }
                              label={activity.beschrijving}
                            />
                          );
                        })}
                      </FormGroup>
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stap 3: Taak Instellingen */}
      <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Stap 3: Taak Instellingen
          </Typography>
          {/* Verplaatst opties van 'Extra Opties' naar hier */}
          <FormControlLabel
            control={
              <Checkbox checked={useInterval} onChange={(e) => setUseInterval(e.target.checked)} />
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
              <Checkbox checked={useContract} onChange={(e) => setUseContract(e.target.checked)} />
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
              <Checkbox checked={multiAssign} onChange={(e) => setMultiAssign(e.target.checked)} />
            }
            label="Multi-Assign (alle elementen in alle ruimtes)"
            sx={{ mb: 2 }}
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

      {/* Stap 4: Geschatte prijzen en foto's */}
      {selectedElement && (
        <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Stap 4: Geschatte prijzen en foto's
            </Typography>
            <Box sx={{ display: "grid", gap: 3 }}>
              <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
                <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label={`Geschatte prijs voor ${selectedElement.name} > ${selectedElement.type} > ${selectedElement.material}`}
                      value={
                        estimatedPrices[`${selectedElement.spaceId}-${selectedElement.id}`] || ""
                      }
                      onChange={(e) =>
                        handleEstimatedPriceChange(
                          selectedElement.spaceId,
                          selectedElement.id,
                          e.target.value
                        )
                      }
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                      variant="outlined"
                      size="medium"
                    />
                  </Box>
                  <Box sx={{ flexShrink: 0 }}>
                    {selectedElement.photos && selectedElement.photos.length > 0 ? (
                      <img
                        src={`http://localhost:5000/${selectedElement.photos[0]}`}
                        alt={`${selectedElement.name}`}
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
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Box sx={{ textAlign: "center" }}>
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
          disabled={!selectedElement || selectedActivities.length === 0}
        >
          Taak toevoegen
        </Button>
      </Box>
    </Box>
  );
};

export default TaskCreationForm;
