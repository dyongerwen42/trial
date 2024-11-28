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

  // State for Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Helper functie om categorieën te krijgen op basis van elementnaam
  const getCategoriesByElementName = (elementName) => {
    const element = globalElements.find((el) => el.name === elementName);
    return element && element.categories ? element.categories : [];
  };

  // Categorizing elements by category
  const categorizedElements = useMemo(() => {
    return globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || []; // Ensure categories exist
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

  // Handle select all toggle
  const toggleSelectAll = (category) => {
    const allElementIds = categorizedElements[category].map((el) => el.id);
    const selected = selectedElementsByCategory[category] || [];
    const isAllSelected = selected.length === allElementIds.length;
    const isIndeterminate =
      selected.length > 0 && selected.length < allElementIds.length;

    setSelectedElementsByCategory((prev) => ({
      ...prev,
      [category]: isAllSelected ? [] : allElementIds,
    }));
  };

  // Open Add Task dialog for a category
  const openAddDialog = (category) => {
    if (
      !selectedElementsByCategory[category] ||
      selectedElementsByCategory[category].length === 0
    ) {
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

    // Debugging: Log before update
    console.log('Before adding tasks:', globalElements);

    // Compute Updated Global Elements
    const updatedGlobalElements = globalElements.map((element) => {
      if (selectedElementIds.includes(element.id)) {
        const newTask = {
          id: uuidv4(),
          name: element.name,
          description: element.description || '',
          urgency: Number(urgency), // Zorg ervoor dat urgentie een nummer is
          year,
          cost,
          isGrouped: false,
          elementName: element.name, // Voeg elementName toe voor mapping
        };
        // Ensure all properties are preserved
        const updatedElement = {
          ...element,
          tasks: [...(element.tasks || []), newTask],
        };
        return updatedElement;
      }
      return element;
    });

    // Debugging: Log after update
    console.log('After adding tasks:', updatedGlobalElements);

    // Update Global Elements
    setGlobalElements(updatedGlobalElements);

    // Clear selections and close dialog
    setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
    setIsAddDialogOpen(false);
    setSnackbarMessage('Tasks added successfully!');
    setSnackbarOpen(true);
    // Reset task properties
    setTaskProperties({
      year: new Date().getFullYear(),
      urgency: 3,
      cost: 0,
    });
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

  // Get tasks organized by year and category for timeline
  const tasksByYearAndCategory = useMemo(() => {
    const tasks = globalElements.flatMap((element) => element.tasks || []);
    const mapping = {};

    tasks.forEach((task) => {
      const { year, elementName } = task;
      if (!year) return; // Sla taken zonder jaar over

      const categories = getCategoriesByElementName(elementName);
      if (categories.length === 0) return; // Sla taken zonder categorie over

      if (!mapping[year]) {
        mapping[year] = {};
      }

      categories.forEach((category) => {
        if (!mapping[year][category]) {
          mapping[year][category] = [];
        }
        mapping[year][category].push(task);
      });
    });

    return mapping;
  }, [globalElements, getCategoriesByElementName]);

  // Handle Info Dialog Open
  const handleOpenInfoDialog = (element) => {
    setCurrentElementInfo(element);
    setInfoDialogOpen(true);
  };

  // Handle Info Dialog Close
  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setCurrentElementInfo(null);
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
              borderRadius: 2, // Reduced border radius for sharper look
              backgroundColor: '#ffffff', // White background for clarity
            }}
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
                sx={{ mr: 1 }}
              />
              <Tooltip title="Search">
                <IconButton aria-label="search">
                  <SearchIcon color="action" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Elements Header */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Elements
            </Typography>

            {/* Displaying Elements by Category */}
            {Object.entries(filteredCategorizedElements).map(([category, elements]) => {
              const allElementIds = elements.map((el) => el.id);
              const selected = selectedElementsByCategory[category] || [];
              const isAllSelected = selected.length === allElementIds.length;
              const isIndeterminate =
                selected.length > 0 && selected.length < allElementIds.length;

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
                    {/* Select All Checkbox */}
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={() => toggleSelectAll(category)}
                      sx={{ mr: 1 }}
                      color="primary"
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {elements.map((element) => {
                      // Define conditions for displaying the year tag
                      // Example Condition: Task has a year and urgency >= 4
                      const plannedYears = Array.from(
                        new Set(
                          element.tasks
                            .filter((task) => {
                              // Zorg ervoor dat urgentie een nummer is
                              const urgencyNumber = Number(task.urgency);
                              return task.year && urgencyNumber >= 4;
                            })
                            .map((task) => task.year)
                        )
                      );

                      return (
                        <Box
                          key={element.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box display="flex" alignItems="center">
                            <Checkbox
                              checked={selected.includes(element.id)}
                              onChange={() => toggleElementSelection(category, element.id)}
                              color="primary"
                            />
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {element.name} ({element.spaceName})
                              </Typography>
                              {/* Conditional Year Tags */}
                              {plannedYears.length > 0 &&
                                plannedYears.map((year) => (
                                  <Chip
                                    key={year}
                                    label={year}
                                    size="small"
                                    color="secondary"
                                    sx={{ ml: 1 }}
                                  />
                                ))}
                            </Box>
                          </Box>
                          {/* Info Icon */}
                          <Tooltip title="View Details" arrow>
                            <IconButton
                              aria-label="info"
                              onClick={() => handleOpenInfoDialog(element)}
                            >
                              <InfoOutlinedIcon color="action" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    })}
                    {/* Add Button for this category */}
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
                      Add Selected Elements
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
              borderRadius: 2, // Reduced border radius for a cleaner look
              backgroundColor: '#ffffff', // White background
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
                              {task.name}
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
        <DialogTitle>Add Tasks to Selected Elements</DialogTitle>
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
            onClick={addTasksToElements}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Add Tasks
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="md" fullWidth>
        <DialogTitle>Element Details</DialogTitle>
        <DialogContent>
          {currentElementInfo ? (
            <Box>
              {/* Categorieën Weergeven */}
              <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                {currentElementInfo.categories && currentElementInfo.categories.length > 0 ? (
                  currentElementInfo.categories.map((category, index) => (
                    <Chip key={index} label={category} size="small" color="primary" />
                  ))
                ) : (
                  <Typography variant="h6" gutterBottom>
                    {currentElementInfo.name}
                  </Typography>
                )}
              </Box>
              <Typography variant="body1" gutterBottom>
                {currentElementInfo.description || 'No description available.'}
              </Typography>
              {/* Display Photos */}
              {currentElementInfo.photos && currentElementInfo.photos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Photos:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                    {currentElementInfo.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.replace('\\\\', '/')} // Pas padseparators aan indien nodig
                        alt={`${currentElementInfo.name} ${index + 1}`}
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {/* Display Tasks */}
              {currentElementInfo.tasks && currentElementInfo.tasks.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Tasks:</Typography>
                  {currentElementInfo.tasks.map((task) => {
                    const categories = getCategoriesByElementName(task.elementName);
                    return (
                      <Box key={task.id} sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle2">{task.name}</Typography>
                        {/* Weergave van Categorieën */}
                        {categories.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {categories.map((category, index) => (
                              <Chip
                                key={index}
                                label={category}
                                size="small"
                                color="primary"
                              />
                            ))}
                          </Box>
                        )}
                        <Typography variant="body2">{task.description}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Urgency: {task.urgency}, Estimated Price: ${task.estimatedPrice}
                        </Typography>
                        {/* Display Task Images */}
                        {task.images && task.images.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                            {task.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img.replace('\\\\', '/')} // Pas padseparators aan indien nodig
                                alt={`${task.name} ${idx + 1}`}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
              {/* Display Documents */}
              {currentElementInfo.documents && currentElementInfo.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Documents:</Typography>
                  <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    {currentElementInfo.documents.map((doc, idx) => (
                      <a key={idx} href={`/${doc}`} target="_blank" rel="noopener noreferrer">
                        {doc.split('\\').pop()}
                      </a>
                    ))}
                  </Box>
                </Box>
              )}
              {/* Display Other Data as Needed */}
              {/* Je kunt dit gedeelte uitbreiden om meer gegevensvelden op te nemen indien nodig */}
            </Box>
          ) : (
            <DialogContentText>No element data available.</DialogContentText>
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
