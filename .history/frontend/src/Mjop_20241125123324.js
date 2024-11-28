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
  Chip,
  DialogContentText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Search as SearchIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state: { globalElements, globalSpaces },
  } = useMjopContext();

  // Local state variables
  const [selectedCategories, setSelectedCategories] = useState([]);
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

  // State for Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentCategoryInfo, setCurrentCategoryInfo] = useState(null);

  // New state for tasks by category
  const [tasksByCategory, setTasksByCategory] = useState({});

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Categorizing elements by category
  const categorizedElements = useMemo(() => {
    return globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      elementCategories.forEach((category) => {
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

  // Handle category selection
  const toggleCategorySelection = (category) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        return prev.filter((cat) => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Open Add Task dialog for a category
  const openAddDialog = (category) => {
    setCurrentCategory(category);
    setIsAddDialogOpen(true);
  };

  // Add task to category
  const addTaskToCategory = () => {
    const { year, urgency, cost } = taskProperties;

    if (!year) {
      setSnackbarMessage('Please select a year!');
      setSnackbarOpen(true);
      return;
    }

    const newTask = {
      id: uuidv4(),
      name: currentCategory,
      description: '',
      urgency: Number(urgency),
      year,
      cost,
      isGrouped: false,
    };

    setTasksByCategory((prev) => ({
      ...prev,
      [currentCategory]: [...(prev[currentCategory] || []), newTask],
    }));

    setIsAddDialogOpen(false);
    setSnackbarMessage('Task added successfully to category!');
    setSnackbarOpen(true);
    // Reset task properties
    setTaskProperties({
      year: new Date().getFullYear(),
      urgency: 3,
      cost: 0,
    });
  };

  // Filtering categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return Object.keys(categorizedElements);

    return Object.keys(categorizedElements).filter((category) =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categorizedElements, searchTerm]);

  // Get tasks organized by year and category for timeline
  const tasksByYearAndCategory = useMemo(() => {
    const mapping = {};

    Object.entries(tasksByCategory).forEach(([category, tasks]) => {
      tasks.forEach((task) => {
        const { year } = task;
        if (!year) return;

        if (!mapping[year]) {
          mapping[year] = {};
        }

        if (!mapping[year][category]) {
          mapping[year][category] = [];
        }

        mapping[year][category].push(task);
      });
    });

    return mapping;
  }, [tasksByCategory]);

  // Handle Info Dialog Open
  const handleOpenInfoDialog = (category) => {
    setCurrentCategoryInfo(category);
    setInfoDialogOpen(true);
  };

  // Handle Info Dialog Close
  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setCurrentCategoryInfo(null);
  };

  return (
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#e0e0e0', p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 2,
              overflowY: 'auto',
              borderRadius: 2,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Search */}
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                placeholder="Search Categories..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 1 }}
              />
              <Tooltip title="Search">
                <IconButton aria-label="search">
                  <SearchIcon color="action" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Categories Header */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Categories
            </Typography>

            {/* Displaying Categories */}
            {filteredCategories.map((category) => {
              const elements = categorizedElements[category] || [];
              const isSelected = selectedCategories.includes(category);

              return (
                <Accordion key={category} sx={{ mb: 1, boxShadow: 'none' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: '#e0e0e0' },
                    }}
                  >
                    {/* Select Category Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleCategorySelection(category)}
                      sx={{ mr: 1 }}
                      color="primary"
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* List of Elements */}
                    {elements.map((element) => (
                      <Box key={element.id} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          {element.name} ({element.spaceName})
                        </Typography>
                      </Box>
                    ))}
                    {/* Add Task Button for this category */}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{
                        mt: 1,
                        textTransform: 'none',
                        borderRadius: 1,
                        backgroundColor: '#1976d2',
                        '&:hover': {
                          backgroundColor: '#115293',
                        },
                      }}
                      onClick={() => openAddDialog(category)}
                    >
                      Add Task to Category
                    </Button>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Paper>
        </Grid>

        {/* Main Panel */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 2,
              borderRadius: 2,
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Timeline
            </Typography>
            <Box
              display="flex"
              gap={2}
              overflow="auto"
              sx={{ flexGrow: 1, mt: 1, pb: 2 }}
            >
              {years.map((year) => (
                <Paper
                  key={year}
                  elevation={1}
                  sx={{
                    p: 2,
                    minWidth: 220,
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                    {year}
                  </Typography>
                  {tasksByYearAndCategory[year] ? (
                    Object.entries(tasksByYearAndCategory[year]).map(([category, tasks]) => (
                      <Box key={category} sx={{ mb: 2, textAlign: 'left' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {category}
                        </Typography>
                        {tasks.map((task) => (
                          <Paper
                            key={task.id}
                            elevation={0}
                            sx={{
                              p: 1,
                              mt: 1,
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {category}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Urgency: {task.urgency}, Cost: ${task.cost}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No tasks for this year.
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add Task to Category</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Year</InputLabel>
            <Select
              value={taskProperties.year}
              label="Year"
              onChange={(e) =>
                setTaskProperties((prev) => ({ ...prev, year: Number(e.target.value) }))
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
              label="Urgency"
              onChange={(e) =>
                setTaskProperties((prev) => ({
                  ...prev,
                  urgency: Number(e.target.value),
                }))
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
              setTaskProperties((prev) => ({ ...prev, cost: Number(e.target.value) }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsAddDialogOpen(false)}
            color="secondary"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={addTaskToCategory}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="md" fullWidth>
        <DialogTitle>Category Details</DialogTitle>
        <DialogContent>
          {currentCategoryInfo ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {currentCategoryInfo}
              </Typography>
              {/* Display Elements */}
              <Typography variant="subtitle1">Elements:</Typography>
              {categorizedElements[currentCategoryInfo]?.map((element) => (
                <Typography key={element.id} variant="body2">
                  {element.name} ({element.spaceName})
                </Typography>
              ))}
              {/* Display Tasks */}
              {tasksByCategory[currentCategoryInfo]?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Tasks:</Typography>
                  {tasksByCategory[currentCategoryInfo].map((task) => (
                    <Box
                      key={task.id}
                      sx={{
                        mt: 1,
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Year: {task.year}, Urgency: {task.urgency}, Cost: ${task.cost}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <DialogContentText>No category data available.</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfoDialog} color="primary" sx={{ textTransform: 'none' }}>
            Close
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
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
