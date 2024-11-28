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
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state: { globalElements, globalSpaces },
    setGlobalElements,
  } = useMjopContext();

  // Local state variables
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    year: new Date().getFullYear(),
    urgency: 3,
    cost: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Categorizing elements by category
  const categorizedElements = useMemo(() => {
    return globalElements.reduce((acc, element) => {
      element.categories.forEach((category) => {
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          ...element,
          spaceName:
            globalSpaces.find((space) => space.id === element.spaceId)?.name ||
            'Unknown Space',
        });
      });
      return acc;
    }, {});
  }, [globalElements, globalSpaces]);

  // Handle element selection
  const toggleElementSelection = (category, elementId) => {
    setSelectedElementsByCategory((prev) => {
      const selected = prev[category] || [];
      const isSelected = selected.includes(elementId);
      const updatedSelected = isSelected
        ? selected.filter((id) => id !== elementId)
        : [...selected, elementId];
      return { ...prev, [category]: updatedSelected };
    });
  };

  // Open Add Task dialog for a category
  const openAddDialog = (category) => {
    if (!selectedElementsByCategory[category] || selectedElementsByCategory[category].length === 0) {
      setSnackbarMessage('Please select at least one element to add tasks!');
      setSnackbarOpen(true);
      return;
    }
    setCurrentCategory(category);
    setIsAddDialogOpen(true);
  };

  // Add tasks to selected elements
  const addTasksToElements = () => {
    const selectedElementIds = selectedElementsByCategory[currentCategory];
    const { year, urgency, cost } = taskProperties;

    if (!year) {
      setSnackbarMessage('Please select a year!');
      setSnackbarOpen(true);
      return;
    }

    setGlobalElements((prevElements) => {
      return prevElements.map((element) => {
        if (selectedElementIds.includes(element.id)) {
          const newTask = {
            id: uuidv4(),
            name: element.name,
            description: element.description || '',
            urgency,
            year,
            cost,
            isGrouped: false,
          };
          return {
            ...element,
            tasks: [...(element.tasks || []), newTask],
          };
        }
        return element;
      });
    });

    // Clear selections and close dialog
    setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
    setIsAddDialogOpen(false);
    setSnackbarMessage('Tasks added successfully!');
    setSnackbarOpen(true);
  };

  // Filtering elements based on search
  const filteredCategorizedElements = useMemo(() => {
    if (!searchTerm) return categorizedElements;

    return Object.entries(categorizedElements).reduce(
      (acc, [category, elements]) => {
        const filteredElements = elements.filter((element) =>
          element.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredElements.length > 0) {
          acc[category] = filteredElements;
        }
        return acc;
      },
      {}
    );
  }, [categorizedElements, searchTerm]);

  // Get tasks organized by year for timeline
  const tasksByYear = useMemo(() => {
    const tasks = globalElements.flatMap((element) => element.tasks || []);
    const tasksByYear = tasks.reduce((acc, task) => {
      const { year } = task;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(task);
      return acc;
    }, {});
    return tasksByYear;
  }, [globalElements]);

  return (
    <Box sx={{ position: 'relative', height: '100vh' }}>
      <Grid container spacing={2} sx={{ height: '100%', backgroundColor: '#f5f5f5' }}>
        {/* Sidebar */}
        <Grid item xs={4}>
          <Paper
            elevation={4}
            sx={{ height: '100%', p: 3, overflowY: 'auto', borderRadius: 6 }}
          >
            {/* Search */}
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                placeholder="Search Elements..."
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

            {/* Elements Header */}
            <Typography variant="h6" gutterBottom>
              Elements
            </Typography>

            {/* Displaying Elements by Category */}
            {Object.entries(filteredCategorizedElements).map(([category, elements]) => (
              <Accordion key={category} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {category}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {elements.map((element) => (
                    <Box key={element.id} sx={{ mb: 1 }}>
                      <Box display="flex" alignItems="center">
                        <Checkbox
                          checked={
                            selectedElementsByCategory[category]?.includes(element.id) || false
                          }
                          onChange={() => toggleElementSelection(category, element.id)}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {element.name} ({element.spaceName})
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {/* Add Button for this category */}
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => openAddDialog(category)}
                  >
                    Add Selected Elements
                  </Button>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        {/* Main Panel */}
        <Grid item xs={8}>
          <Paper
            elevation={4}
            sx={{ height: '100%', p: 3, borderRadius: 6, overflowY: 'auto' }}
          >
            <Typography variant="h5" gutterBottom>
              Timeline
            </Typography>
            <Box display="flex" gap={2} overflow="auto">
              {years.map((year) => (
                <Paper
                  key={year}
                  elevation={3}
                  sx={{
                    p: 2,
                    minWidth: 200,
                    textAlign: 'center',
                    backgroundColor: '#f0f4f9',
                    borderRadius: 4,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {year}
                  </Typography>
                  {tasksByYear[year]?.map((task) => (
                    <Paper
                      key={task.id}
                      elevation={2}
                      sx={{ p: 1, mt: 1, backgroundColor: '#fff' }}
                    >
                      <Typography variant="body2">{task.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Urgency: {task.urgency}, Cost: ${task.cost}
                      </Typography>
                    </Paper>
                  ))}
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add Tasks to Selected Elements</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Year</InputLabel>
            <Select
              value={taskProperties.year}
              onChange={(e) =>
                setTaskProperties((prev) => ({ ...prev, year: e.target.value }))
              }
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Urgency</InputLabel>
            <Select
              value={taskProperties.urgency}
              onChange={(e) =>
                setTaskProperties((prev) => ({ ...prev, urgency: e.target.value }))
              }
            >
              {[1, 2, 3, 4, 5].map((urgency) => (
                <MenuItem key={urgency} value={urgency}>
                  Urgency {urgency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Cost"
            fullWidth
            margin="dense"
            type="number"
            value={taskProperties.cost}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, cost: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={addTasksToElements} color="primary">
            Add Tasks
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
