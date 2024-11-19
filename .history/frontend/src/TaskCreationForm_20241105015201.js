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
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import { addYears, addDays } from "date-fns";
import { useMjopContext } from "./MjopContext"; // Adjust the path if needed

const TaskCreationForm = () => {
  const {
    state: { globalSpaces, globalElements },
    setGlobalElements,
    setGlobalSpaces,
    saveData,
    dispatch
  } = useMjopContext();


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
  }, []);

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

  case 'ADD_TASK':
    console.log("Reducer - Adding Tasks:", action.payload);
    return {
      ...state,
      globalElements: state.globalElements.map((element) =>
        element.id === action.payload.elementId
          ? { ...element, tasks: [...(element.tasks || []), ...action.payload.tasks] }
          : element
      ),
    };
 
  

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

      <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Extra Opties
          </Typography>
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
                checked={multiAssign}
                onChange={(e) => setMultiAssign(e.target.checked)}
              />
            }
            label="Multi-Assign (alle elementen in alle ruimtes)"
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
        </CardContent>
      </Card>

      {selectedElements.length > 0 && (
        <Card sx={{ mb: 4, boxShadow: 5, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Geschatte prijzen en foto's
            </Typography>
            <Box sx={{ display: 'grid', gap: 3 }}>
              {selectedElements.map((element) => {
                const space = globalSpaces.find((space) => space.id === element.spaceId);
                const spaceName = space ? space.name : "Unknown Space";
                return (
                  <Card key={`${element.spaceId}-${element.id}`} sx={{ boxShadow: 2, borderRadius: 2 }}>
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label={`Geschatte prijs voor ${spaceName} > ${element.name} > ${element.type} > ${element.material}`}
                          value={estimatedPrices[`${element.spaceId}-${element.id}`] || ""}
                          onChange={(e) =>
                            handleEstimatedPriceChange(element.spaceId, element.id, e.target.value)
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
                              width: '150px',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                        ) : (
                          <Typography>No Image Available</Typography>
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
