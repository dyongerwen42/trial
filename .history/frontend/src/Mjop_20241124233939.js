import React, { useState, useMemo } from "react";
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
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { useMjopContext } from "./MjopContext";

const FullTaskManager = () => {
  const {
    state: { globalElements, offerGroups },
    setGlobalElements,
    setOfferGroups,
  } = useMjopContext();

  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newTaskDetails, setNewTaskDetails] = useState({
    name: "",
    description: "",
    urgency: 3,
    year: new Date().getFullYear(),
  });
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  const tasks = useMemo(() => globalElements.flatMap((element) => element.tasks || []), [globalElements]);
  const taskGroups = useMemo(() => offerGroups, [offerGroups]);

  // Add a new task
  const addTask = () => {
    if (!newTaskDetails.name || !newTaskDetails.year) {
      setSnackbarMessage("Task name and year are required!");
      setSnackbarOpen(true);
      return;
    }
    const task = { ...newTaskDetails, id: uuidv4(), isGrouped: false };
    setGlobalElements((prevElements) => {
      const updatedElements = [...prevElements];
      if (updatedElements.length > 0) {
        updatedElements[0].tasks = [...(updatedElements[0].tasks || []), task];
      }
      return updatedElements;
    });
    setSnackbarMessage("Task added successfully!");
    setSnackbarOpen(true);
    setIsTaskDialogOpen(false);
  };

  // Create a new group from selected tasks
  const createGroup = () => {
    if (selectedTasks.length === 0) {
      setSnackbarMessage("No tasks selected to group!");
      setSnackbarOpen(true);
      return;
    }
    const groupId = uuidv4();
    setGlobalElements((prevElements) => {
      const updatedElements = prevElements.map((element) => {
        const updatedTasks = element.tasks.map((task) =>
          selectedTasks.includes(task.id) ? { ...task, isGrouped: true, groupId } : task
        );
        return { ...element, tasks: updatedTasks };
      });
      return updatedElements;
    });
    setOfferGroups((prevGroups) => [
      ...prevGroups,
      {
        id: groupId,
        name: groupName || `Group ${taskGroups.length + 1}`,
        tasks: tasks.filter((task) => selectedTasks.includes(task.id)),
      },
    ]);
    setSnackbarMessage("Group created successfully!");
    setSnackbarOpen(true);
    setIsGroupDialogOpen(false);
    setSelectedTasks([]);
  };

  // Delete a task
  const deleteTask = (taskId) => {
    setGlobalElements((prevElements) => {
      const updatedElements = prevElements.map((element) => {
        const updatedTasks = element.tasks.filter((task) => task.id !== taskId);
        return { ...element, tasks: updatedTasks };
      });
      return updatedElements;
    });
    setSnackbarMessage("Task deleted successfully!");
    setSnackbarOpen(true);
  };

  // Delete a group
  const deleteGroup = (groupId) => {
    setGlobalElements((prevElements) => {
      const updatedElements = prevElements.map((element) => {
        const updatedTasks = element.tasks.map((task) =>
          task.groupId === groupId ? { ...task, isGrouped: false, groupId: null } : task
        );
        return { ...element, tasks: updatedTasks };
      });
      return updatedElements;
    });
    setOfferGroups((prevGroups) => prevGroups.filter((group) => group.id !== groupId));
    setSnackbarMessage("Group deleted successfully!");
    setSnackbarOpen(true);
  };

  // Edit a group name
  const editGroupName = (groupId, newName) => {
    setOfferGroups((prevGroups) =>
      prevGroups.map((group) => (group.id === groupId ? { ...group, name: newName } : group))
    );
  };

  // Search and filter tasks
  const filteredTasks = tasks
    .filter((task) => (filterUrgency ? task.urgency === parseInt(filterUrgency) : true))
    .filter((task) =>
      searchTerm ? task.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    );

  const handleFieldChange = (field, value) =>
    setNewTaskDetails((prev) => ({ ...prev, [field]: value }));

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <Grid container spacing={2} sx={{ height: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Sidebar */}
      <Grid item xs={4}>
        <Paper elevation={4} sx={{ height: "100%", p: 3, overflowY: "auto", borderRadius: 6 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              placeholder="Search Tasks..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Tooltip title="Search">
              <SearchIcon color="primary" />
            </Tooltip>
          </Box>
          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Filter by Urgency</InputLabel>
            <Select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {[1, 2, 3, 4, 5].map((urgency) => (
                <MenuItem key={urgency} value={urgency}>
                  Urgency {urgency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" gutterBottom>
            Tasks
          </Typography>
          {filteredTasks.map((task) => (
            <Accordion key={task.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {task.name}
                </Typography>
                <Chip
                  label={`Urgency: ${task.urgency}`}
                  size="small"
                  color={task.urgency >= 4 ? "error" : "primary"}
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {task.description}
                </Typography>
                <Checkbox
                  checked={selectedTasks.includes(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  sx={{ mb: 1 }}
                />
                <Tooltip title="Delete Task">
                  <IconButton
                    size="small"
                    sx={{ color: "red", ml: 2 }}
                    onClick={() => deleteTask(task.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Grid>

      {/* Main Panel */}
      <Grid item xs={8}>
        <Paper elevation={4} sx={{ height: "100%", p: 3, borderRadius: 6 }}>
          <Typography variant="h5" gutterBottom>
            Timeline Overview
          </Typography>
          <Box display="flex" gap={2} overflow="auto">
            {years.map((year) => (
              <Paper
                key={year}
                elevation={3}
                sx={{
                  p: 2,
                  minWidth: 180,
                  textAlign: "center",
                  backgroundColor: "#f0f4f9",
                  borderRadius: 4,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {year}
                </Typography>
                {tasks
                  .filter((task) => task.year === year)
                  .map((task) => (
                    <Typography key={task.id} variant="body2" sx={{ mt: 1 }}>
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
          bottom: 20,
          right: 20,
          background: "linear-gradient(135deg, #1e90ff, #87cefa)",
          color: "#fff",
          fontWeight: "bold",
          borderRadius: 50,
          boxShadow: "0px 8px 20px rgba(0,0,0,0.2)",
          padding: "10px 30px",
          "&:hover": {
            background: "linear-gradient(135deg, #00a8ff, #74d1f7)",
            transform: "translateY(-3px)",
            boxShadow: "0px 10px 25px rgba(0,0,0,0.3)",
          },
        }}
        onClick={() => setIsTaskDialogOpen(true)}
      >
        <AddIcon /> Add Task
      </Button>

      {/* Create Group Button */}
      {selectedTasks.length > 0 && (
        <Button
          variant="contained"
          sx={{
            position: "fixed",
            bottom: 90,
            right: 20,
            background: "linear-gradient(135deg, #e74c3c, #ff6f61)",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: 50,
            boxShadow: "0px 8px 20px rgba(0,0,0,0.2)",
            padding: "10px 30px",
            "&:hover": {
              background: "linear-gradient(135deg, #ff6f61, #fa5252)",
              transform: "translateY(-3px)",
              boxShadow: "0px 10px 25px rgba(0,0,0,0.3)",
            },
          }}
          onClick={() => setIsGroupDialogOpen(true)}
        >
          <GroupIcon /> Create Group
        </Button>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isTaskDialogOpen} onClose={() => setIsTaskDialogOpen(false)}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Name"
            fullWidth
            margin="dense"
            value={newTaskDetails.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            multiline
            value={newTaskDetails.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Urgency</InputLabel>
            <Select
              value={newTaskDetails.urgency}
              onChange={(e) => handleFieldChange("urgency", e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((urgency) => (
                <MenuItem key={urgency} value={urgency}>
                  Urgency {urgency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Year</InputLabel>
            <Select
              value={newTaskDetails.year}
              onChange={(e) => handleFieldChange("year", e.target.value)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={addTask} variant="contained">
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onClose={() => setIsGroupDialogOpen(false)}>
        <DialogTitle>Create Group</DialogTitle>
        <DialogContent>
          <TextField
            label="Group Name"
            fullWidth
            margin="dense"
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsGroupDialogOpen(false)}>Cancel</Button>
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
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default FullTaskManager;
