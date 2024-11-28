import React, { useState, useEffect } from "react";
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
  Add as AddIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

const FullTaskManager = () => {
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem("tasks")) || []);
  const [taskGroups, setTaskGroups] = useState(() => JSON.parse(localStorage.getItem("taskGroups")) || []);
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

  // Save tasks and groups to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("taskGroups", JSON.stringify(taskGroups));
  }, [tasks, taskGroups]);

  // Add a new task
  const addTask = () => {
    if (!newTaskDetails.name || !newTaskDetails.year) {
      setSnackbarMessage("Task name and year are required!");
      setSnackbarOpen(true);
      return;
    }
    const task = { ...newTaskDetails, id: uuidv4(), isGrouped: false };
    setTasks((prev) => [...prev, task]);
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
    const updatedTasks = tasks.map((task) =>
      selectedTasks.includes(task.id) ? { ...task, isGrouped: true, groupId } : task
    );
    const newGroup = {
      id: groupId,
      name: groupName || `Group ${taskGroups.length + 1}`,
      tasks: updatedTasks.filter((task) => task.groupId === groupId),
    };

    setTaskGroups((prev) => [...prev, newGroup]);
    setTasks(updatedTasks);
    setSelectedTasks([]);
    setSnackbarMessage("Group created successfully!");
    setSnackbarOpen(true);
    setIsGroupDialogOpen(false);
  };

  // Delete a task
  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setSnackbarMessage("Task deleted successfully!");
    setSnackbarOpen(true);
  };

  // Delete a group
  const deleteGroup = (groupId) => {
    const updatedTasks = tasks.map((task) =>
      task.groupId === groupId ? { ...task, isGrouped: false, groupId: null } : task
    );
    setTasks(updatedTasks);
    setTaskGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSnackbarMessage("Group deleted successfully!");
    setSnackbarOpen(true);
  };

  // Edit a group name
  const editGroupName = (groupId, newName) => {
    setTaskGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, name: newName } : group))
    );
  };

  // Organize tasks into categories/groups
  const categorizedTasks = {};
  tasks.forEach((task) => {
    const category = task.groupId ? `Group: ${taskGroups.find((g) => g.id === task.groupId)?.name}` : "Ungrouped Tasks";
    if (!categorizedTasks[category]) {
      categorizedTasks[category] = [];
    }
    categorizedTasks[category].push(task);
  });

  // Sidebar rendering
  const sidebarContent = Object.entries(categorizedTasks).map(([category, tasks]) => (
    <Box key={category} sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2c3e50", mb: 2 }}>
        {category}
      </Typography>
      {tasks.map((task) => (
        <Accordion key={task.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{task.name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {task.description}
            </Typography>
            <Checkbox
              checked={selectedTasks.includes(task.id)}
              onChange={() => setSelectedTasks((prev) =>
                prev.includes(task.id) ? prev.filter((id) => id !== task.id) : [...prev, task.id]
              )}
            />
            <Tooltip title="Delete Task">
              <DeleteIcon
                onClick={() => deleteTask(task.id)}
                sx={{
                  ml: 2,
                  color: "red",
                  cursor: "pointer",
                  "&:hover": { color: "darkred", transform: "scale(1.1)" },
                }}
              />
            </Tooltip>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  ));

  return (
    <Grid container spacing={2} sx={{ height: "100vh", backgroundColor: "#f8fafd" }}>
      {/* Sidebar */}
      <Grid item xs={4}>
        <Paper sx={{ height: "100%", p: 3, overflowY: "auto", borderRadius: 4 }}>
          {sidebarContent}
        </Paper>
      </Grid>

      {/* Timeline */}
      <Grid item xs={8}>
        <Paper sx={{ height: "100%", p: 3, borderRadius: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
            Timeline
          </Typography>
          <Box display="flex" gap={2} overflow="auto">
            {[...new Set(tasks.map((task) => task.year))].map((year) => (
              <Paper
                key={year}
                sx={{
                  minWidth: 150,
                  p: 2,
                  borderRadius: 4,
                  textAlign: "center",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                <Typography variant="h6">{year}</Typography>
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
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => setIsTaskDialogOpen(true)}
      >
        <AddIcon />
        Add Task
      </Button>

      {/* Add Task Dialog */}
      <Dialog open={isTaskDialogOpen} onClose={() => setIsTaskDialogOpen(false)}>
        <DialogTitle>Add Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newTaskDetails.name}
            onChange={(e) => setNewTaskDetails((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Description"
            value={newTaskDetails.description}
            onChange={(e) => setNewTaskDetails((prev) => ({ ...prev, description: e.target.value }))}
            multiline
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={addTask}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>
    </Grid>
  );
};

export default FullTaskManager;
