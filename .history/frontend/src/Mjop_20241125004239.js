// FullTaskManager.js

import React, { useState, useMemo } from 'react';
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
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Search as SearchIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state: { globalElements, offerGroups, globalSpaces },
    setGlobalElements,
    setOfferGroups,
  } = useMjopContext();

  // Local state variables
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]); // State for selected elements (for adding tasks)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newTaskDetails, setNewTaskDetails] = useState({
    name: '',
    description: '',
    urgency: 3,
    year: new Date().getFullYear(),
    cost: 0,
    duration: '',
    squareMeters: 0,
    periodic: false,
  });
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Categorizing elements by category
  const categorizedTasks = useMemo(() => {
    return globalElements.reduce((acc, element) => {
      element.categories.forEach((category) => {
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          ...element,
          tasks: element.tasks || [],
          spaceName:
            globalSpaces.find((space) => space.id === element.spaceId)?.name ||
            'Unknown Space',
        });
      });
      return acc;
    }, {});
  }, [globalElements, globalSpaces]);

  // Function to add a new task to selected elements
  const addTask = () => {
    if (!newTaskDetails.name || !newTaskDetails.year) {
      setSnackbarMessage('Task name and year are required!');
      setSnackbarOpen(true);
      return;
    }
    if (selectedElements.length === 0) {
      setSnackbarMessage('Please select at least one element!');
      setSnackbarOpen(true);
      return;
    }
    const task = { ...newTaskDetails, id: uuidv4(), isGrouped: false };
    setGlobalElements((prevElements) => {
      const updatedElements = prevElements.map((element) => {
        if (selectedElements.includes(element.id)) {
          return {
            ...element,
            tasks: [...(element.tasks || []), task],
          };
        }
        return element;
      });
      return updatedElements;
    });
    setSnackbarMessage('Task added to selected elements successfully!');
    setSnackbarOpen(true);
    setIsTaskDialogOpen(false);
    // Resetting new task details
    setNewTaskDetails({
      name: '',
      description: '',
      urgency: 3,
      year: new Date().getFullYear(),
      cost: 0,
      duration: '',
      squareMeters: 0,
      periodic: false,
    });
    setSelectedElements([]); // Clear selected elements after adding task
  };

  // Function to create a new group from selected tasks
  const createGroup = () => {
    if (selectedTasks.length === 0) {
      setSnackbarMessage('No tasks selected to group!');
      setSnackbarOpen(true);
      return;
    }
    const groupId = uuidv4();
    const groupedTasks = globalElements.flatMap((element) =>
      element.tasks.filter((task) => selectedTasks.includes(task.id))
    );

    // Mark elements as grouped
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        tasks: element.tasks.map((task) =>
          selectedTasks.includes(task.id)
            ? { ...task, isGrouped: true, groupId }
            : task
        ),
      }))
    );

    // Add new group
    setOfferGroups((prevGroups) => [
      ...prevGroups,
      {
        id: groupId,
        name: groupName || `Group ${prevGroups.length + 1}`,
        tasks: groupedTasks,
      },
    ]);

    setSnackbarMessage('Group created successfully!');
    setSnackbarOpen(true);
    setIsGroupDialogOpen(false);
    setGroupName('');
    setSelectedTasks([]);
  };

  // Function to delete a task
  const deleteTask = (taskId) => {
    setGlobalElements((prevElements) => {
      const updatedElements = prevElements.map((element) => {
        const updatedTasks = element.tasks.filter((task) => task.id !== taskId);
        return { ...element, tasks: updatedTasks };
      });
      return updatedElements;
    });
    setSnackbarMessage('Task deleted successfully!');
    setSnackbarOpen(true);
  };

  // Function to delete a group
  const deleteGroup = (groupId) => {
    // Unmark tasks as grouped
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        tasks: element.tasks.map((task) =>
          task.groupId === groupId
            ? { ...task, isGrouped: false, groupId: null }
            : task
        ),
      }))
    );

    // Remove the group
    setOfferGroups((prevGroups) =>
      prevGroups.filter((group) => group.id !== groupId)
    );
    setSnackbarMessage('Group deleted successfully!');
    setSnackbarOpen(true);
  };

  // Function to edit a group name
  const editGroupName = (groupId, newName) => {
    setOfferGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, name: newName } : group
      )
    );
  };

  // Filtering tasks based on search and urgency
  const filteredCategorizedTasks = useMemo(() => {
    if (!searchTerm && !filterUrgency) return categorizedTasks;

    return Object.entries(categorizedTasks).reduce((acc, [category, elements]) => {
      const filteredElements = elements
        .map((element) => {
          const filteredTasks = element.tasks.filter(
            (task) =>
              (filterUrgency
                ? task.urgency === parseInt(filterUrgency)
                : true) &&
              (searchTerm
                ? task.name.toLowerCase().includes(searchTerm.toLowerCase())
                : true)
          );
          return { ...element, tasks: filteredTasks };
        })
        .filter((element) => element.tasks.length > 0);

      if (filteredElements.length > 0) {
        acc[category] = filteredElements;
      }

      return acc;
    }, {});
  }, [categorizedTasks, searchTerm, filterUrgency]);

  // Handle changes in new task fields
  const handleFieldChange = (field, value) =>
    setNewTaskDetails((prev) => ({ ...prev, [field]: value }));

  // Toggle task selection for grouping
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Toggle element selection for adding tasks
  const toggleElementSelection = (elementId) => {
    setSelectedElements((prev) =>
      prev.includes(elementId)
        ? prev.filter((id) => id !== elementId)
        : [...prev, elementId]
    );
  };

  // Function to select all tasks across all categories
  const selectAllTasks = () => {
    const allTasks = Object.values(categorizedTasks).flatMap((elements) =>
      elements.flatMap((element) => element.tasks)
    );
    const allTaskIds = allTasks.map((task) => task.id);
    setSelectedTasks(allTaskIds);
  };

  // Function to unselect all tasks
  const unselectAllTasks = () => {
    setSelectedTasks([]);
  };

  return (
    <Box sx={{ position: 'relative', height: '100vh' }}>
      <Grid
        container
        spacing={2}
        sx={{ height: '100%', backgroundColor: '#f5f5f5' }}
      >
        {/* Sidebar */}
        <Grid item xs={4}>
          <Paper
            elevation={4}
            sx={{ height: '100%', p: 3, overflowY: 'auto', borderRadius: 6 }}
          >
            {/* Search and Filter */}
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
                <IconButton>
                  <SearchIcon color="primary" />
                </IconButton>
              </Tooltip>
            </Box>
            <FormControl size="small" fullWidth sx={{ mb: 2 }}>
              <InputLabel>Filter by Urgency</InputLabel>
              <Select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {[1, 2, 3, 4, 5].map((urgency) => (
                  <MenuItem key={urgency} value={urgency}>
                    Urgency {urgency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tasks Header with Select All / Unselect All */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography variant="h6" gutterBottom>
                Tasks
              </Typography>
              <Box>
                <Tooltip title="Select All Tasks">
                  <IconButton onClick={selectAllTasks}>
                    <SelectAllIcon color="primary" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Unselect All Tasks">
                  <IconButton onClick={unselectAllTasks}>
                    <DeleteIcon color="primary" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Displaying Elements and Their Tasks */}
            {Object.entries(filteredCategorizedTasks).map(
              ([category, elements]) => (
                <Accordion key={category} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {elements.map((element) => (
                      <Box key={element.id} sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center">
                          <Checkbox
                            checked={selectedElements.includes(element.id)}
                            onChange={() => toggleElementSelection(element.id)}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {element.name} ({element.spaceName})
                          </Typography>
                        </Box>
                        {element.tasks && element.tasks.length > 0 ? (
                          element.tasks.map((task) => (
                            <Box
                              key={task.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                ml: 4,
                                mb: 1,
                              }}
                            >
                              <Typography variant="body2">
                                {task.name} - Urgency: {task.urgency}
                              </Typography>
                              <Checkbox
                                checked={selectedTasks.includes(task.id)}
                                onChange={() => toggleTaskSelection(task.id)}
                                sx={{ ml: 2 }}
                              />
                              <Tooltip title="Delete Task">
                                <IconButton
                                  size="small"
                                  sx={{ color: 'red', ml: 2 }}
                                  onClick={() => deleteTask(task.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ))
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ color: 'grey.600', ml: 4 }}
                          >
                            No tasks available
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )
            )}
          </Paper>
        </Grid>

        {/* Main Panel */}
        <Grid item xs={8}>
          <Paper
            elevation={4}
            sx={{
              height: '100%',
              p: 3,
              borderRadius: 6,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
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
                    textAlign: 'center',
                    backgroundColor: '#f0f4f9',
                    borderRadius: 4,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {year}
                  </Typography>
                  {globalElements
                    .flatMap((element) => element.tasks)
                    .filter((task) => task.year === year)
                    .map((task) => (
                      <Typography key={task.id} variant="body2" sx={{ mt: 1 }}>
                        {task.name} - ${task.cost}
                      </Typography>
                    ))}
                </Paper>
              ))}
            </Box>

            {/* Groups Overview */}
            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Groups
              </Typography>
              {offerGroups.length > 0 ? (
                offerGroups.map((group) => (
                  <Paper
                    key={group.id}
                    elevation={3}
                    sx={{ p: 2, mb: 2, borderRadius: 4 }}
                  >
                    <Box display="flex" alignItems="center" mb={1}>
                      <TextField
                        value={group.name}
                        onChange={(e) => editGroupName(group.id, e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 2, flexGrow: 1 }}
                      />
                      <Tooltip title="Delete Group">
                        <IconButton
                          size="small"
                          sx={{ color: 'red' }}
                          onClick={() => deleteGroup(group.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box>
                      {group.tasks.map((task) => (
                        <Typography key={task.id} variant="body2" sx={{ ml: 2 }}>
                          {task.name} - {task.description}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No groups created yet.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Task Button */}
      <Button
        variant="contained"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'linear-gradient(135deg, #1e90ff, #87cefa)',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: 50,
          boxShadow: '0px 8px 20px rgba(0,0,0,0.2)',
          padding: '10px 30px',
          display: 'flex',
          alignItems: 'center',
          '&:hover': {
            background: 'linear-gradient(135deg, #00a8ff, #74d1f7)',
            transform: 'translateY(-3px)',
            boxShadow: '0px 10px 25px rgba(0,0,0,0.3)',
          },
        }}
        onClick={() => {
          if (selectedElements.length === 0) {
            setSnackbarMessage('Please select at least one element to add a task!');
            setSnackbarOpen(true);
            return;
          }
          setIsTaskDialogOpen(true);
        }}
      >
        <AddIcon sx={{ mr: 1 }} /> Add Task
      </Button>

      {/* Create Group Button */}
      {selectedTasks.length > 0 && (
        <Button
          variant="contained"
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            background: 'linear-gradient(135deg, #e74c3c, #ff6f61)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: 50,
            boxShadow: '0px 8px 20px rgba(0,0,0,0.2)',
            padding: '10px 30px',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff6f61, #fa5252)',
              transform: 'translateY(-3px)',
              boxShadow: '0px 10px 25px rgba(0,0,0,0.3)',
            },
          }}
          onClick={() => setIsGroupDialogOpen(true)}
        >
          <GroupIcon sx={{ mr: 1 }} /> Create Group
        </Button>
      )}

      {/* Add Task Dialog */}
      <Dialog
        open={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
      >
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          {/* Task Form Fields */}
          <TextField
            label="Task Name"
            fullWidth
            margin="dense"
            value={newTaskDetails.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            multiline
            value={newTaskDetails.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
          />
          <TextField
            label="Cost"
            fullWidth
            margin="dense"
            type="number"
            value={newTaskDetails.cost}
            onChange={(e) => handleFieldChange('cost', e.target.value)}
          />
          <TextField
            label="Duration"
            fullWidth
            margin="dense"
            value={newTaskDetails.duration}
            onChange={(e) => handleFieldChange('duration', e.target.value)}
          />
          <TextField
            label="Square Meters"
            fullWidth
            margin="dense"
            type="number"
            value={newTaskDetails.squareMeters}
            onChange={(e) => handleFieldChange('squareMeters', e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Urgency</InputLabel>
            <Select
              value={newTaskDetails.urgency}
              onChange={(e) => handleFieldChange('urgency', e.target.value)}
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
              onChange={(e) => handleFieldChange('year', e.target.value)}
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
          <Button onClick={() => setIsTaskDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={addTask} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog
        open={isGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
      >
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            label="Group Name"
            fullWidth
            margin="dense"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsGroupDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={createGroup} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
