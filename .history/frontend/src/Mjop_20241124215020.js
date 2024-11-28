import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Checkbox,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

const FullTaskManager = () => {
  const [yearRange, setYearRange] = useState(10);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [tasks, setTasks] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newTaskDetails, setNewTaskDetails] = useState({
    name: "",
    description: "",
    urgency: 3,
    year: null,
  });
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  const handleYearRangeChange = (event) => setYearRange(event.target.value);

  const handleOpenTaskDialog = () => setIsTaskDialogOpen(true);
  const handleCloseTaskDialog = () => setIsTaskDialogOpen(false);
  const handleOpenGroupDialog = () => setIsGroupDialogOpen(true);
  const handleCloseGroupDialog = () => setIsGroupDialogOpen(false);

  const handleFieldChange = (field, value) =>
    setNewTaskDetails((prev) => ({ ...prev, [field]: value }));

  const addTask = () => {
    const task = { ...newTaskDetails, id: uuidv4(), isGrouped: false };
    setTasks((prev) => [...prev, task]);
    setSnackbarMessage("Task Added!");
    setSnackbarOpen(true);
    handleCloseTaskDialog();
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setSnackbarMessage("Task Deleted!");
    setSnackbarOpen(true);
  };

  const createGroup = () => {
    const groupId = uuidv4();
    const groupedTasks = tasks.map((task) =>
      selectedTasks.includes(task.id)
        ? { ...task, isGrouped: true, groupId }
        : task
    );
    setTasks(groupedTasks);
    setTaskGroups((prev) => [
      ...prev,
      {
        id: groupId,
        name: `Group ${taskGroups.length + 1}`,
        tasks: groupedTasks.filter((task) => task.groupId === groupId),
      },
    ]);
    setSnackbarMessage("Group Created!");
    setSnackbarOpen(true);
    handleCloseGroupDialog();
    setSelectedTasks([]);
  };

  return (
    <Grid container spacing={2} sx={{ height: "100vh", backgroundColor: "#f0f4f8" }}>
      {/* Sidebar */}
      <Grid item xs={4}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            p: 3,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            background: "linear-gradient(135deg, #ffffff, #f7f8fa)",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#34495e", marginBottom: 2 }}
          >
            Task Overview
          </Typography>

          {/* Task Accordion */}
          {tasks.map((task) => (
            <Accordion key={task.id} sx={{ marginBottom: 2, borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: "#eaf0f6" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {task.name} ({task.year || "No Year"})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ marginBottom: 2 }}>
                  {task.description}
                </Typography>
                <Checkbox
                  checked={selectedTasks.includes(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                />
                <Chip label={`Urgency: ${task.urgency}`} size="small" color="warning" />
                <Tooltip title="Delete Task">
                  <DeleteIcon
                    onClick={() => deleteTask(task.id)}
                    sx={{
                      marginLeft: 2,
                      color: "red",
                      cursor: "pointer",
                      "&:hover": { color: "darkred" },
                    }}
                  />
                </Tooltip>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Grid>

      {/* Timeline */}
      <Grid item xs={8}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            p: 3,
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, #f7f8fa, #eaf0f6)",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
            borderRadius: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 3,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#34495e" }}>
              Timeline Overview
            </Typography>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Years</InputLabel>
              <Select value={yearRange} onChange={handleYearRangeChange}>
                <MenuItem value={10}>10 Years</MenuItem>
                <MenuItem value={15}>15 Years</MenuItem>
                <MenuItem value={20}>20 Years</MenuItem>
                <MenuItem value={25}>25 Years</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              overflowX: "auto",
              gap: 2,
              padding: 2,
            }}
          >
            {years.map((year) => (
              <Paper
                key={year}
                elevation={1}
                sx={{
                  minWidth: 200,
                  padding: 2,
                  borderRadius: 4,
                  textAlign: "center",
                  background: "#ffffff",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#34495e" }}>
                  {year}
                </Typography>
                {tasks
                  .filter((task) => task.year === year)
                  .map((task) => (
                    <Typography key={task.id} variant="body2">
                      {task.name}
                    </Typography>
                  ))}
              </Paper>
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* Add Task Button */}
      <Button
        variant="contained"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          background: "linear-gradient(135deg, #1e88e5, #42a5f5)",
          color: "#fff",
          fontWeight: "bold",
          borderRadius: 8,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
          "&:hover": {
            background: "linear-gradient(135deg, #42a5f5, #64b5f6)",
          },
        }}
        onClick={handleOpenTaskDialog}
      >
        Add Task
      </Button>

      {/* Create Group Button */}
      {selectedTasks.length > 0 && (
        <Button
          variant="contained"
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            background: "linear-gradient(135deg, #e57373, #ef5350)",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: 8,
            boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
            "&:hover": {
              background: "linear-gradient(135deg, #ef5350, #f44336)",
            },
          }}
          onClick={handleOpenGroupDialog}
        >
          Create Group
        </Button>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isTaskDialogOpen} onClose={handleCloseTaskDialog}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Name"
            fullWidth
            margin="dense"
            variant="outlined"
            value={newTaskDetails.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            variant="outlined"
            multiline
            rows={3}
            value={newTaskDetails.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Urgency"
            select
            fullWidth
            value={newTaskDetails.urgency}
            onChange={(e) => handleFieldChange("urgency", e.target.value)}
          >
            {[1, 2, 3, 4, 5].map((urgency) => (
              <MenuItem key={urgency} value={urgency}>
                {urgency}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Year"
            select
            fullWidth
            value={newTaskDetails.year}
            onChange={(e) => handleFieldChange("year", e.target.value)}
            sx={{ marginTop: 2 }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button onClick={addTask} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onClose={handleCloseGroupDialog}>
        <DialogTitle>Create Group</DialogTitle>
        <DialogContent>
          <Typography>Group the selected tasks together.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDialog}>Cancel</Button>
          <Button onClick={createGroup} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default FullTaskManager;
