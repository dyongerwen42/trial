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
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Add as AddIcon,
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
  const [groupName, setGroupName] = useState("");

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
    if (selectedTasks.length === 0) {
      setSnackbarMessage("No tasks selected to group!");
      setSnackbarOpen(true);
      return;
    }

    const groupId = uuidv4();
    const groupedTasks = tasks.map((task) =>
      selectedTasks.includes(task.id) ? { ...task, isGrouped: true, groupId } : task
    );

    const newGroup = {
      id: groupId,
      name: groupName || `Group ${taskGroups.length + 1}`,
      tasks: groupedTasks.filter((task) => task.groupId === groupId),
    };

    setTaskGroups((prev) => [...prev, newGroup]);
    setTasks(groupedTasks);
    setSelectedTasks([]);
    setSnackbarMessage("Group Created!");
    setSnackbarOpen(true);
    handleCloseGroupDialog();
  };

  const deleteGroup = (groupId) => {
    const updatedTasks = tasks.map((task) =>
      task.groupId === groupId ? { ...task, isGrouped: false, groupId: null } : task
    );
    setTasks(updatedTasks);
    setTaskGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSnackbarMessage("Group Deleted!");
    setSnackbarOpen(true);
  };

  const groupedTasks = taskGroups.map((group) => (
    <Accordion
      key={group.id}
      sx={{
        marginBottom: 2,
        borderRadius: 4,
        background: "linear-gradient(135deg, #f5f7fa, #ebeff5)",
        boxShadow: "0px 6px 20px rgba(0,0,0,0.1)",
        "&:hover": { transform: "scale(1.02)", transition: "all 0.3s ease" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: "#dfe9f3" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
          {group.name}
        </Typography>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            deleteGroup(group.id);
          }}
          sx={{
            marginLeft: 2,
            color: "red",
            "&:hover": { color: "#d63031", transform: "scale(1.1)" },
          }}
        >
          <DeleteIcon />
        </IconButton>
      </AccordionSummary>
      <AccordionDetails>
        {group.tasks.map((task) => (
          <Typography key={task.id} variant="body2" sx={{ color: "#2d3436" }}>
            {task.name} (Urgency: {task.urgency})
          </Typography>
        ))}
      </AccordionDetails>
    </Accordion>
  ));

  return (
    <Grid container spacing={2} sx={{ height: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Sidebar */}
      <Grid item xs={4}>
        <Paper
          elevation={4}
          sx={{
            height: "100%",
            p: 3,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            background: "linear-gradient(135deg, #f0f4f9, #e9edf4)",
            borderRadius: 6,
            boxShadow: "0px 8px 20px rgba(0,0,0,0.12)",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2c3e50", marginBottom: 3 }}>
            Task Overview
          </Typography>
          {groupedTasks}
          {tasks
            .filter((task) => !task.isGrouped)
            .map((task) => (
              <Accordion
                key={task.id}
                sx={{
                  marginBottom: 2,
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #ffffff, #f4f6f8)",
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                  "&:hover": { transform: "scale(1.01)", transition: "all 0.3s ease" },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: "#ecf3fc" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#34495e" }}>
                    {task.name} ({task.year || "No Year"})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ marginBottom: 2, color: "#616161" }}>
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
                        "&:hover": { color: "darkred", transform: "scale(1.1)" },
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
          elevation={4}
          sx={{
            height: "100%",
            p: 3,
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, #f9fafc, #f0f4f9)",
            borderRadius: 6,
            boxShadow: "0px 8px 20px rgba(0,0,0,0.12)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#34495e" }}>
              Timeline Overview
            </Typography>
            <FormControl size="small" sx={{ width: 140 }}>
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
                elevation={3}
                sx={{
                  minWidth: 220,
                  padding: 2,
                  borderRadius: 6,
                  textAlign: "center",
                  background: "linear-gradient(135deg, #ffffff, #f9f9f9)",
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  "&:hover": { transform: "scale(1.03)", boxShadow: "0px 6px 15px rgba(0,0,0,0.2)" },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#34495e" }}>
                  {year}
                </Typography>
                {tasks
                  .filter((task) => task.year === year)
                  .map((task) => (
                    <Typography key={task.id} variant="body2" sx={{ color: "#7f8c8d" }}>
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
        onClick={handleOpenTaskDialog}
      >
        <AddIcon />
        Add Task
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
          onClick={handleOpenGroupDialog}
        >
          <GroupIcon />
          Create Group
        </Button>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isTaskDialogOpen} onClose={handleCloseTaskDialog}>
        <DialogTitle sx={{ fontWeight: "bold", backgroundColor: "#f0f4f9", textAlign: "center" }}>
          Add New Task
        </DialogTitle>
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
