import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import { addYears, addDays } from "date-fns";
import { useMjopContext } from './MjopContext';

const TaskCreationForm = () => {
  const { globalSpaces = [], globalElements = [], setGlobalElements, setGlobalSpaces } = useMjopContext();

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
        (element) =>
          element.name === "Algemeen" && element.spaceId === algemeenSpace.id
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
  }, [globalSpaces, globalElements, setGlobalElements, setGlobalSpaces]);

  useEffect(() => {
    if (!customTask.offerteNeeded && startDate) {
      setEndDate(addDays(startDate, customTask.durationDays || 0));
    }
  }, [startDate, customTask.durationDays, customTask.offerteNeeded]);

  const handleSpaceChange = (event) => {
    const spaceId = event.target.value;
    setSelectedSpace(spaceId);
    setSelectedElement("");
  };

  const handleElementChange = (event) => {
    const elementName = event.target.value;
    setSelectedElement(elementName);
  };

  const handleAddTask = () => {
    if (!globalElements.length) {
      console.error("No elements available to create tasks for.");
      return;
    }

    const tasksToAdd = [];
    const elementsToCreateTasksFor = multiAssign
      ? globalElements.filter((el) => el.name === selectedElement)
      : globalElements.filter(
          (el) => el.name === selectedElement && el.spaceId === selectedSpace
        );

    elementsToCreateTasksFor.forEach((element) => {
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

      if (useInterval) {
        let taskCount = Math.floor(totalYears / intervalYears);
        let contractCostPerTask = useContract ? contractCost / taskCount : 0;

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

          tasksToAdd.push(newTask);
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

        tasksToAdd.push(newTask);
      }
    });

    setGlobalElements((prevElements) => {
      return prevElements.map((element) => {
        const newTasks = tasksToAdd.filter((task) => task.elementName === element.name);
        if (newTasks.length > 0) {
          return {
            ...element,
            tasks: [...(element.tasks || []), ...newTasks],
          };
        }
        return element;
      });
    });

    setTasks((prevTasks) => [...prevTasks, ...tasksToAdd]);

    resetForm();
  };

  const resetForm = () => {
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
  };

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
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        Nieuwe Taak Aanmaken
      </Typography>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 5, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 5, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
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
        </Grid>
      </Grid>

      {/* Additional form fields for options like interval, contract, and multi-assign can be added here as shown in previous steps. */}

      <Box sx={{ textAlign: 'center' }}>
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
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.2)',
            },
          }}
          disabled={!selectedElement && !multiAssign}
        >
          Aangepaste taak toevoegen
        </Button>
      </Box>

      {tasks.length > 0 && (
        <Card sx={{ mt: 4, boxShadow: 5, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Taken in {multiAssign ? "alle elementen" : selectedElement}
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="simple table">
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
                      <TableCell>{task.planned?.workDate || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TaskCreationForm;
