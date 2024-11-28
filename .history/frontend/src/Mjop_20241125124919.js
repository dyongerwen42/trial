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
  Switch,
  FormControlLabel,
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
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    name: '',
    year: new Date().getFullYear(),
    urgency: 3,
    cost: 0,
    assignPricesIndividually: false,
    individualCosts: {},
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);

  // State for Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

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
      setSnackbarMessage('Selecteer ten minste één element om taken toe te voegen!');
      setSnackbarOpen(true);
      return;
    }
    setCurrentCategory(category);
    setTaskProperties({
      name: category,
      year: new Date().getFullYear(),
      urgency: 3,
      cost: 0,
      assignPricesIndividually: false,
      individualCosts: {},
    });
    setIsAddDialogOpen(true);
  };

  // Add tasks to selected elements and create a task group
  const addTasksToElements = () => {
    const selectedElementIds = selectedElementsByCategory[currentCategory];
    const {
      name,
      year,
      urgency,
      cost,
      assignPricesIndividually,
      individualCosts,
    } = taskProperties;

    if (!name) {
      setSnackbarMessage('Vul een taaknaam in!');
      setSnackbarOpen(true);
      return;
    }

    if (!year) {
      setSnackbarMessage('Selecteer een jaar!');
      setSnackbarOpen(true);
      return;
    }

    // Create tasks and update globalElements
    const updatedGlobalElements = globalElements.map((element) => {
      if (selectedElementIds.includes(element.id)) {
        const newTask = {
          id: uuidv4(),
          name, // Taaknaam is de aangepaste naam uit het dialoog
          description: element.description || '',
          urgency: Number(urgency),
          year,
          cost: assignPricesIndividually
            ? Number(individualCosts[element.id] || 0)
            : Number(cost),
          isGrouped: true,
          elementName: element.name,
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

    // Update Global Elements
    setGlobalElements(updatedGlobalElements);

    // Create a new task group
    const newTaskGroup = {
      id: uuidv4(),
      name,
      year,
      urgency: Number(urgency),
      cost: Number(cost),
      assignPricesIndividually,
      subtasks: selectedElementIds.map((elementId) => {
        const element = globalElements.find((el) => el.id === elementId);
        return {
          ...element,
          individualCost: assignPricesIndividually
            ? Number(individualCosts[elementId] || 0)
            : 0,
        };
      }),
    };

    setTaskGroups((prev) => [...prev, newTaskGroup]);

    // Clear selections and close dialog
    setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
    setIsAddDialogOpen(false);
    setSnackbarMessage('Taakgroep succesvol toegevoegd!');
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
              borderRadius: 2,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Search */}
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                placeholder="Zoek elementen..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 1 }}
              />
              <Tooltip title="Zoeken">
                <IconButton aria-label="search">
                  <SearchIcon color="action" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Elements Header */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Elementen
            </Typography>

            {/* Displaying Elements by Category */}
            {Object.entries(filteredCategorizedElements).map(([category, elements]) => {
              const allElementIds = elements.map((el) => el.id);
              const selected = selectedElementsByCategory[category] || [];
              const isAllSelected = selected.length === allElementIds.length;

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
                      indeterminate={selected.length > 0 && !isAllSelected}
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
                      const plannedYears = Array.from(
                        new Set(
                          (element.tasks || [])
                            .filter((task) => task.year)
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
                          <Tooltip title="Details bekijken" arrow>
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
                      Toevoegen
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
              overflowY: 'auto',
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Takenoverzicht
            </Typography>

            {/* Task Groups */}
            {taskGroups.map((group) => (
              <Accordion key={group.id} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: '#f5f5f5',
                    '&:hover': { backgroundColor: '#e0e0e0' },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {group.name} (Jaar: {group.year})
                  </Typography>
                  {/* Cost Display */}
                  <Typography variant="subtitle1" sx={{ marginLeft: 'auto', fontWeight: 600 }}>
                    €{group.assignPricesIndividually ? 'Variabel' : group.cost}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {group.subtasks.map((element) => (
                    <Box key={element.id} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {element.name} ({element.spaceName})
                      </Typography>
                      {/* Display individual cost if applicable */}
                      {group.assignPricesIndividually && (
                        <Typography variant="body2">
                          Kosten: €{element.individualCost}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}

            {/* Timeline */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
              Tijdlijn
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
                  {tasksByYear[year] ? (
                    tasksByYear[year].map((task) => (
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
                          Urgentie: {task.urgency}, Kosten: €{task.cost}
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Geen taken voor dit jaar.
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Task Group Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Taakgroep toevoegen</DialogTitle>
        <DialogContent>
          <TextField
            label="Taaknaam"
            fullWidth
            margin="dense"
            value={taskProperties.name}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Jaar</InputLabel>
            <Select
              value={taskProperties.year}
              label="Jaar"
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
            <InputLabel>Urgentie</InputLabel>
            <Select
              value={taskProperties.urgency}
              label="Urgentie"
              onChange={(e) =>
                setTaskProperties((prev) => ({
                  ...prev,
                  urgency: Number(e.target.value),
                }))
              }
            >
              {[1, 2, 3, 4, 5].map((urgency) => (
                <MenuItem key={urgency} value={urgency}>
                  Urgentie {urgency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Kostprijs"
            fullWidth
            margin="dense"
            type="number"
            value={taskProperties.cost}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, cost: e.target.value }))
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={taskProperties.assignPricesIndividually}
                onChange={(e) =>
                  setTaskProperties((prev) => ({
                    ...prev,
                    assignPricesIndividually: e.target.checked,
                  }))
                }
                color="primary"
              />
            }
            label="Prijzen per element toewijzen"
          />
          {taskProperties.assignPricesIndividually && (
            <Box sx={{ mt: 2 }}>
              {selectedElementsByCategory[currentCategory].map((elementId) => {
                const element = globalElements.find((el) => el.id === elementId);
                return (
                  <Box key={elementId} sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {element.name} ({element.spaceName})
                    </Typography>
                    <TextField
                      label="Kostprijs"
                      type="number"
                      fullWidth
                      margin="dense"
                      value={taskProperties.individualCosts[elementId] || ''}
                      onChange={(e) =>
                        setTaskProperties((prev) => ({
                          ...prev,
                          individualCosts: {
                            ...prev.individualCosts,
                            [elementId]: e.target.value,
                          },
                        }))
                      }
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsAddDialogOpen(false)}
            color="secondary"
            sx={{ textTransform: 'none' }}
          >
            Annuleren
          </Button>
          <Button
            onClick={addTasksToElements}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Taakgroep toevoegen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="md" fullWidth>
        <DialogTitle>Elementdetails</DialogTitle>
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
                {currentElementInfo.description || 'Geen beschrijving beschikbaar.'}
              </Typography>
              {/* Display Photos */}
              {currentElementInfo.photos && currentElementInfo.photos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Foto's:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                    {currentElementInfo.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.replace('\\\\', '/')}
                        alt={`${currentElementInfo.name} ${index + 1}`}
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {/* Display Documents */}
              {currentElementInfo.documents && currentElementInfo.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Documenten:</Typography>
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
            </Box>
          ) : (
            <Typography>Geen gegevens beschikbaar.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfoDialog} color="primary" sx={{ textTransform: 'none' }}>
            Sluiten
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
