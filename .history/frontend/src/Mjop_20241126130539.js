// FullTaskManager.jsx

import React, { useState, useMemo } from 'react';
import {
  Avatar,
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  Checkbox,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardHeader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';

// Importeer de nieuw gecreëerde componenten
import TaskGroupDialog from './TaskGroupDialog';
import ElementInfoDialog from './ElementInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import TaskTimeline from './TaskTimeline'; // Nieuwe import
import YearCard from './YearCard'; // Nieuwe import als nodig

// Reusable Component voor YearCard is nu in YearCard.jsx geplaatst

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state: { globalElements, globalSpaces },
    setGlobalElements,
  } = useMjopContext();

  // Lokale state variabelen
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    id: null, // Added for editing identification
    name: '',
    groupDate: new Date(),
    cost: 0,
    assignPricesIndividually: false,
    individualCosts: {},
    individualDates: {},
    selectedElementIds: [],
    // Additional properties for element names and spaces
    elementNames: {},
    elementSpaces: {},
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);

  // State voor Element Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  // State voor Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Mapping from groupId to group for easy lookup
  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  // Categorizing elements by category and space
  const categorizedElements = useMemo(() => {
    return globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      const spaceName =
        globalSpaces.find((space) => space.id === element.spaceId)?.name ||
        'Onbekende Ruimte';

      elementCategories.forEach((category) => {
        if (!acc[category]) {
          acc[category] = {};
        }
        if (!acc[category][spaceName]) {
          acc[category][spaceName] = [];
        }
        acc[category][spaceName].push({
          ...element,
          spaceName,
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
    const allElementIds = Object.values(categorizedElements[category] || {})
      .flat()
      .map((el) => el.id);
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

    // Prepare element names and spaces for display in the dialog
    const elementNames = {};
    const elementSpaces = {};
    selectedElementsByCategory[category].forEach((elementId) => {
      const element = globalElements.find((el) => el.id === elementId);
      if (element) {
        elementNames[elementId] = element.name;
        elementSpaces[elementId] = globalSpaces.find((space) => space.id === element.spaceId)?.name || 'Onbekende Ruimte';
      }
    });

    setDialogMode('add');
    setCurrentCategory(category);
    setTaskProperties({
      id: null,
      name: category,
      groupDate: new Date(),
      cost: 0,
      assignPricesIndividually: false,
      individualCosts: {},
      individualDates: {},
      selectedElementIds: selectedElementsByCategory[category],
      elementNames,
      elementSpaces,
    });
  };

  // Open Edit Task dialog for a specific task group
  const openEditDialog = (group) => {
    // Prepare element names and spaces for display in the dialog
    const elementNames = {};
    const elementSpaces = {};
    group.subtasks.forEach((subtask) => {
      elementNames[subtask.id] = subtask.name;
      elementSpaces[subtask.id] = globalSpaces.find((space) => space.id === subtask.spaceId)?.name || 'Onbekende Ruimte';
    });

    setDialogMode('edit');
    setTaskProperties({
      id: group.id,
      name: group.name,
      groupDate: group.groupDate,
      cost: group.cost,
      assignPricesIndividually: group.assignPricesIndividually,
      individualCosts: group.subtasks.reduce((acc, subtask) => {
        acc[subtask.id] = subtask.individualCost || 0;
        return acc;
      }, {}),
      individualDates: group.subtasks.reduce((acc, subtask) => {
        acc[subtask.id] = subtask.endDate || new Date();
        return acc;
      }, {}),
      selectedElementIds: group.subtasks.map((subtask) => subtask.id),
      elementNames,
      elementSpaces,
    });
  };

  // Add or Update tasks in the selected elements and manage task groups
  const addOrUpdateTaskGroup = () => {
    const {
      id,
      name,
      groupDate,
      cost,
      assignPricesIndividually,
      individualCosts,
      individualDates,
      selectedElementIds,
      elementNames,
      elementSpaces,
    } = taskProperties;

    if (!name) {
      setSnackbarMessage('Vul een taaknaam in!');
      setSnackbarOpen(true);
      return;
    }

    if (!groupDate) {
      setSnackbarMessage('Selecteer een datum voor de taakgroep!');
      setSnackbarOpen(true);
      return;
    }

    if (dialogMode === 'add') {
      // Create tasks and update globalElements
      const updatedGlobalElements = globalElements.map((element) => {
        if (selectedElementIds.includes(element.id)) {
          // Determine end date for the task
          let endDate = individualDates[element.id]
            ? new Date(individualDates[element.id])
            : new Date(groupDate);
          endDate = new Date(endDate.getFullYear(), 0, 1); // January 1st

          const newTask = {
            id: uuidv4(),
            name, // Task name from the dialog
            description: element.description || '',
            endDate,
            cost: assignPricesIndividually
              ? Number(individualCosts[element.id] || 0)
              : Number(cost),
            isGrouped: true,
            elementName: element.name,
            groupId: null, // To be set later
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

      // Create a new task group
      const groupId = uuidv4();
      const newTaskGroup = {
        id: groupId,
        name,
        groupDate: new Date(groupDate),
        cost: Number(cost),
        assignPricesIndividually,
        subtasks: selectedElementIds.map((elementId) => {
          const element = globalElements.find((el) => el.id === elementId);
          return {
            ...element,
            individualCost: assignPricesIndividually
              ? Number(individualCosts[elementId] || 0)
              : 0,
            endDate: individualDates[elementId]
              ? new Date(individualDates[elementId])
              : new Date(groupDate),
          };
        }),
      };

      // Update tasks with groupId
      const finalGlobalElements = updatedGlobalElements.map((element) => {
        if (selectedElementIds.includes(element.id)) {
          const updatedTasks = element.tasks.map((task) => ({
            ...task,
            groupId: task.groupId || groupId,
          }));
          return { ...element, tasks: updatedTasks };
        }
        return element;
      });

      setGlobalElements(finalGlobalElements);

      setTaskGroups((prev) => [...prev, newTaskGroup]);

      // Clear selections and close dialog
      setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
      setDialogMode(null);
      setSnackbarMessage('Taakgroep succesvol toegevoegd!');
      setSnackbarOpen(true);
    } else if (dialogMode === 'edit') {
      // Update existing task group
      const updatedTaskGroups = taskGroups.map((group) => {
        if (group.id === id) {
          return {
            ...group,
            name,
            groupDate,
            cost,
            assignPricesIndividually,
            subtasks: selectedElementIds.map((elementId) => {
              const element = globalElements.find((el) => el.id === elementId);
              return {
                ...element,
                individualCost: assignPricesIndividually
                  ? Number(individualCosts[elementId] || 0)
                  : 0,
                endDate: individualDates[elementId]
                  ? new Date(individualDates[elementId])
                  : new Date(groupDate),
              };
            }),
          };
        }
        return group;
      });

      setTaskGroups(updatedTaskGroups);

      // Update globalElements
      const updatedGlobalElements = globalElements.map((element) => {
        if (selectedElementIds.includes(element.id)) {
          const updatedTasks = (element.tasks || []).map((task) => {
            if (task.groupId === id) {
              let endDate = individualDates[element.id]
                ? new Date(individualDates[element.id])
                : new Date(groupDate);
              endDate = new Date(endDate.getFullYear(), 0, 1); // January 1st

              return {
                ...task,
                name,
                endDate,
                cost: assignPricesIndividually
                  ? Number(individualCosts[element.id] || 0)
                  : Number(cost),
              };
            }
            return task;
          });
          return { ...element, tasks: updatedTasks };
        }
        return element;
      });

      setGlobalElements(updatedGlobalElements);

      setDialogMode(null);
      setSnackbarMessage('Taakgroep succesvol bijgewerkt!');
      setSnackbarOpen(true);
    }
  };

  // Function to handle deletion of a task group
  const handleDeleteTaskGroup = () => {
    const { id, name } = taskProperties;
    if (!id) return;

    // Remove the task group from taskGroups state
    setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));

    // Update globalElements by removing the groupId from tasks
    const updatedGlobalElements = globalElements.map((element) => {
      if (element.tasks && element.tasks.length > 0) {
        const updatedTasks = element.tasks.map((task) => {
          if (task.groupId === id) {
            const { groupId, ...rest } = task; // Remove groupId
            return rest;
          }
          return task;
        });
        return { ...element, tasks: updatedTasks };
      }
      return element;
    });

    setGlobalElements(updatedGlobalElements);

    // Close dialogs and show a success message
    setDeleteConfirmOpen(false);
    setDialogMode(null);
    setSnackbarMessage(`Taakgroep "${name}" succesvol verwijderd!`);
    setSnackbarOpen(true);
  };

  // Get task groups organized by year for timeline
  const taskGroupsByYear = useMemo(() => {
    const groupsByYear = taskGroups.reduce((acc, group) => {
      const year = group.groupDate ? new Date(group.groupDate).getFullYear() : null;
      if (year) {
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push(group);
      }
      return acc;
    }, {});
    return groupsByYear;
  }, [taskGroups]);

  // Calculate total cost per year
  const totalCostPerYear = useMemo(() => {
    const costPerYear = {};
    taskGroups.forEach((group) => {
      const year = group.groupDate ? new Date(group.groupDate).getFullYear() : null;
      if (year) {
        costPerYear[year] = (costPerYear[year] || 0) + Number(group.cost || 0);
      }
    });
    return costPerYear;
  }, [taskGroups]);

  // Handle Element Info Dialog Open
  const handleOpenInfoDialog = (element) => {
    setCurrentElementInfo(element);
    setInfoDialogOpen(true);
  };

  // Handle Element Info Dialog Close
  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setCurrentElementInfo(null);
  };

  return (
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#f4f6f8', p: 3 }}>
      <Grid container spacing={4} sx={{ height: '100%' }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 4,
              overflowY: 'auto',
              borderRadius: 3,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Elements Header */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
              Elementen
            </Typography>

            {/* Displaying Elements by Category and Space */}
            {Object.entries(categorizedElements).map(([category, spaces]) => {
              const allElementIds = Object.values(spaces).flat().map((el) => el.id);
              const selected = selectedElementsByCategory[category] || [];
              const isAllSelected = selected.length === allElementIds.length;

              return (
                <Accordion key={category} sx={{ mb: 3, boxShadow: 'none' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: '#f0f0f0',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: '#e0e0e0' },
                      px: 2,
                      py: 1,
                    }}
                  >
                    {/* Select All Checkbox */}
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={selected.length > 0 && !isAllSelected}
                      onChange={() => toggleSelectAll(category)}
                      sx={{ mr: 1 }}
                      color="primary"
                      onClick={(e) => e.stopPropagation()} // Prevent Accordion toggle
                      inputProps={{ 'aria-label': `Selecteer alle elementen in ${category}` }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, py: 1 }}>
                    {/* Spaces within the category */}
                    {Object.entries(spaces).map(([spaceName, elements]) => (
                      <Box key={spaceName} sx={{ mb: 2 }}>
                        {/* Space Header */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {spaceName}
                        </Typography>
                        {/* Elements within the space */}
                        {elements.map((element) => {
                          // Calculate plannedYears per element within the current category
                          const plannedYears = Array.from(
                            new Set(
                              (element.tasks || [])
                                .filter(
                                  (task) =>
                                    task.endDate &&
                                    taskGroupsMap[task.groupId]?.name === category
                                )
                                .map((task) => new Date(task.endDate).getFullYear())
                            )
                          ).sort((a, b) => a - b); // Sort years ascending

                          return (
                            <Card
                              key={element.id}
                              variant="outlined"
                              sx={{
                                mb: 2,
                                borderRadius: 2,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                backgroundColor: selected.includes(element.id)
                                  ? '#e3f2fd'
                                  : '#ffffff',
                                transition: 'background-color 0.3s',
                              }}
                            >
                              <CardHeader
                                avatar={
                                  <Checkbox
                                    checked={selected.includes(element.id)}
                                    onChange={() => toggleElementSelection(category, element.id)}
                                    color="primary"
                                    size="small"
                                    inputProps={{ 'aria-label': `Selecteer ${element.name}` }}
                                  />
                                }
                                action={
                                  <Tooltip title="Details bekijken" arrow>
                                    <IconButton
                                      aria-label={`Bekijk details van ${element.name}`}
                                      onClick={() => handleOpenInfoDialog(element)}
                                      size="small"
                                    >
                                      <InfoOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                }
                                title={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {element.name}
                                  </Typography>
                                }
                                subheader={
                                  <Typography variant="body2" color="textSecondary">
                                    {element.spaceName}
                                  </Typography>
                                }
                              />
                              <CardContent>
                                {/* Display Photos in Sidebar */}
                                {element.photos && element.photos.length > 0 && (
                                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                    {element.photos.map((photo, index) => (
                                      <img
                                        key={index}
                                        src={photo.replace(/\\/g, '/')}
                                        alt={`${element.name} ${index + 1}`}
                                        style={{
                                          width: '80px',
                                          height: '80px',
                                          objectFit: 'cover',
                                          borderRadius: 8,
                                        }}
                                      />
                                    ))}
                                  </Box>
                                )}
                                {/* Conditional Year Tags */}
                                {plannedYears.length > 0 && (
                                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                                    {plannedYears.map((year) => (
                                      <Chip
                                        key={year}
                                        label={year}
                                        size="small"
                                        color="secondary"
                                        sx={{ mt: 0.5 }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    ))}
                    {/* Add Button for this category */}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddIcon fontSize="small" />}
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
                      aria-label={`Voeg taakgroep toe aan ${category}`}
                    >
                      Taakgroep Toevoegen
                    </Button>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Paper>
        </Grid>

        {/* Main Panel */}
        <Grid item xs={12} md={8}>
          <TaskTimeline
            years={years}
            taskGroupsByYear={taskGroupsByYear}
            totalCostPerYear={totalCostPerYear}
            handleOpenTaskGroupInfoDialog={openEditDialog}
          />
        </Grid>
      </Grid>

      {/* Unified Add/Edit Task Group Dialog */}
      <TaskGroupDialog
        open={dialogMode === 'add' || dialogMode === 'edit'}
        mode={dialogMode}
        onClose={() => setDialogMode(null)}
        taskProperties={taskProperties}
        setTaskProperties={setTaskProperties}
        onSubmit={addOrUpdateTaskGroup}
        onDelete={() => setDeleteConfirmOpen(true)} // Open delete confirmation
      />

      {/* Element Info Dialog */}
      <ElementInfoDialog
        open={infoDialogOpen}
        onClose={handleCloseInfoDialog}
        elementInfo={currentElementInfo}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTaskGroup}
        taskGroupName={taskProperties.name}
      />

      {/* Snackbar voor feedback berichten */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
