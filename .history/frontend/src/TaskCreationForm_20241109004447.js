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
  const [customTask, setCustomTask] = useState({
    name: "",
    description: "",
    urgency: "",
    ultimateDate: new Date(),
    durationDays: 0,
    offerteNeeded: true,
  });
  const [multiAssign, setMultiAssign] = useState(false);
  const [useInterval, setUseInterval] = useState(false);
  const [intervalYears, setIntervalYears] = useState(1);
  const [totalYears, setTotalYears] = useState(5);
  const [estimatedPrices, setEstimatedPrices] = useState({});
  const [selectedSpace, setSelectedSpace] = useState("");
  const [selectedElement, setSelectedElement] = useState("");
  const [selectedElements, setSelectedElements] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [setDirectToWorkDate, setSetDirectToWorkDate] = useState(false);

  useEffect(() => {
    // Ensure "Algemeen" options exist
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

      let newUltimateDate = new Date(customTask.ultimateDate);
      let newStartDate = new Date(startDate);
      let currentEstimatedPrice = parseFloat(estimatedPrices[elementKey] || 0);

      const offerAccepted = !customTask.offerteNeeded;
      const newTasks = [];

      if (useInterval) {
        for (let i = 0; i < totalYears; i += intervalYears) {
          let taskUltimateDate = addYears(newUltimateDate, i);
          let taskStartDate = offerAccepted ? addYears(newStartDate, i) : null;
          let taskEndDate = offerAccepted
            ? addDays(taskStartDate, customTask.durationDays || 0)
            : null;

          const newTask = {
            id: uuidv4(),
            name: customTask.name,
            description: customTask.description,
            urgency: customTask.urgency,
            spaceName: spaceName,
            elementName: element.name,
            ultimateDate: taskUltimateDate.toISOString(),
            estimatedPrice: currentEstimatedPrice.toFixed(2),
            planned: {
              workDate: setDirectToWorkDate ? taskUltimateDate.toISOString() : null,
              startDate: taskStartDate ? taskStartDate.toISOString() : null,
              endDate: taskEndDate ? taskEndDate.toISOString() : null,
              offerAccepted,
            },
          };

          newTasks.push(newTask);
        }
      } else {
        let taskUltimateDate = newUltimateDate;
        let taskStartDate = offerAccepted ? newStartDate : null;
        let taskEndDate = offerAccepted
          ? addDays(newStartDate, customTask.durationDays || 0)
          : null;

        const newTask = {
          id: uuidv4(),
          name: customTask.name,
          description: customTask.description,
          urgency: customTask.urgency,
          spaceName: spaceName,
          elementName: element.name,
          ultimateDate: taskUltimateDate.toISOString(),
          estimatedPrice: currentEstimatedPrice.toFixed(2),
          planned: {
            workDate: setDirectToWorkDate ? taskUltimateDate.toISOString() : null,
            startDate: taskStartDate ? taskStartDate.toISOString() : null,
            endDate: taskEndDate ? taskEndDate.toISOString() : null,
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
    useInterval,
    intervalYears,
    totalYears,
    dispatch,
    saveData,
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
    setIntervalYears(1);
    setTotalYears(5);
    setEstimatedPrices({});
    setSelectedElement("");
    setSelectedSpace("");
    setSelectedElements([]);
    setStartDate(new Date());
    setMultiAssign(false);
    setSetDirectToWorkDate(false);
  }, []);

  const handleEstimatedPriceChange = (spaceId, elementId, value) => {
    const elementKey = `${spaceId}-${elementId}`;
    setEstimatedPrices((prev) => ({
      ...prev,
      [elementKey]: value,
    }));
  };

  const availableElements = multiAssign
    ? [...new Set(globalElements.map((el) => el.name))].map((name) => ({ name }))
    : globalElements.filter((el) => el.spaceId === selectedSpace);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Nieuwe Taak Aanmaken
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Taak Informatie
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Naam van de taak"
                value={customTask.name}
                onChange={(e) => setCustomTask({ ...customTask, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschrijving"
                value={customTask.description}
                onChange={(e) => setCustomTask({ ...customTask, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Urgentie"
                value={customTask.urgency}
                onChange={(e) => setCustomTask({ ...customTask, urgency: e.target.value })}
                select
              >
                {[...Array(6).keys()].map((i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                selected={customTask.ultimateDate}
                onChange={(date) => setCustomTask({ ...customTask, ultimateDate: date })}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                customInput={
                  <TextField
                    label="Einddatum"
                    fullWidth
                    value={
                      customTask.ultimateDate
                        ? customTask.ultimateDate.toLocaleDateString()
                        : ""
                    }
                  />
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Toewijzing
          </Typography>
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
            label="Multi-Assign (taak toewijzen aan alle elementen met dezelfde naam)"
          />
          {!multiAssign && (
            <TextField
              fullWidth
              select
              label="Selecteer ruimte"
              value={selectedSpace}
              onChange={handleSpaceChange}
              sx={{ mt: 2 }}
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
            sx={{ mt: 2 }}
            disabled={!multiAssign && !selectedSpace}
          >
            <MenuItem value="" disabled>
              Selecteer een element
            </MenuItem>
            {availableElements.map((element) => (
              <MenuItem key={element.id || element.name} value={element.name}>
                {element.name}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Opties
          </Typography>
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
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Interval (jaren)"
                  type="number"
                  value={intervalYears}
                  onChange={(e) => setIntervalYears(parseInt(e.target.value, 10))}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Totaal aantal jaren"
                  type="number"
                  value={totalYears}
                  onChange={(e) => setTotalYears(parseInt(e.target.value, 10))}
                />
              </Grid>
            </Grid>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={customTask.offerteNeeded}
                onChange={(e) =>
                  setCustomTask({ ...customTask, offerteNeeded: e.target.checked })
                }
              />
            }
            label="Offerte nodig"
            sx={{ mt: 2 }}
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
        </CardContent>
      </Card>

      {selectedElements.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Geschatte Prijzen
            </Typography>
            {selectedElements.map((element) => {
              const space = globalSpaces.find((space) => space.id === element.spaceId);
              const spaceName = space ? space.name : "Onbekende ruimte";
              return (
                <Box key={element.id} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Geschatte prijs voor ${spaceName} > ${element.name}`}
                    value={estimatedPrices[`${element.spaceId}-${element.id}`] || ""}
                    onChange={(e) =>
                      handleEstimatedPriceChange(element.spaceId, element.id, e.target.value)
                    }
                  />
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Box sx={{ textAlign: "center" }}>
        <Button
          onClick={handleAddTask}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={!customTask.name || !selectedElement || selectedElements.length === 0}
        >
          Taak Toevoegen
        </Button>
      </Box>
    </Box>
  );
};

export default TaskCreationForm;
