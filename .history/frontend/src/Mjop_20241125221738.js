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
  TextField,
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
  Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';

// Reusable Component for Year Card
const YearCard = ({ year, totalCost, taskGroups, handleOpenTaskGroupInfoDialog }) => {
  const hasTasks = taskGroups && taskGroups.length > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 220,
        textAlign: 'center',
        backgroundColor: hasTasks ? '#ffffff' : '#f5f5f5',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        cursor: hasTasks ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: hasTasks ? 'scale(1.02)' : 'none',
          boxShadow: hasTasks ? '0 4px 10px rgba(0,0,0,0.15)' : '0 2px 5px rgba(0,0,0,0.1)',
        },
        position: 'relative',
      }}
      onClick={() => {
        if (hasTasks) {
          handleOpenTaskGroupInfoDialog(taskGroups);
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: '#1976d2' }}>
            <CalendarTodayIcon />
          </Avatar>
        }
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {year}
          </Typography>
        }
      />
      <CardContent>
        {/* Total Cost Display */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Totale Kosten: €{totalCost || 0}
        </Typography>
        {/* Task Groups or No Tasks Message */}
        {hasTasks ? (
          taskGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 2 }}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent onClick
                  handleOpenTaskGroupInfoDialog(group);
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: '#ff9800' }}>
                      <AssignmentIcon />
                    </Avatar>
                  }
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {group.name}
                    </Typography>
                  }
                  subheader={
                    <Typography variant="body2" color="textSecondary">
                      Kosten: €{group.assignPricesIndividually ? 'Variabel' : group.cost}
                    </Typography>
                  }
                />
              </Card>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            Geen taken voor dit jaar.
          </Typography>
        )}
      </CardContent>
      {/* Tooltip for Non-Clickable Years */}
      {!hasTasks && (
        <Tooltip title="Geen taakgroepen beschikbaar voor dit jaar" placement="top">
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          />
        </Tooltip>
      )}
    </Card>
  );
};

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state: { globalElements, globalSpaces },
    setGlobalElements,
  } = useMjopContext();

  // Local state variables
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);

  // State for Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  // State for Task Group Info Dialog
  const [taskGroupInfoDialogOpen, setTaskGroupInfoDialogOpen] = useState(false);
  const [currentTaskGroupInfo, setCurrentTaskGroupInfo] = useState(null);

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
    });
    setIsAddDialogOpen(true);
  };

  // Add tasks to selected elements and create a task group
  const addTasksToElements = () => {
    const {
      name,
      groupDate,
      cost,
      assignPricesIndividually,
      individualCosts,
      individualDates,
      selectedElementIds,
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
    setIsAddDialogOpen(false);
    setSnackbarMessage('Taakgroep succesvol toegevoegd!');
    setSnackbarOpen(true);
  };

  // Edit Task Group
  const editTaskGroup = (group) => {
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
    });
    setCurrentCategory('');
    setIsEditDialogOpen(true);
  };

  const saveEditedTaskGroup = () => {
    const {
      id,
      name,
      groupDate,
      cost,
      assignPricesIndividually,
      individualCosts,
      individualDates,
      selectedElementIds,
    } = taskProperties;

    // Update taskGroups
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

    setIsEditDialogOpen(false);
    setSnackbarMessage('Taakgroep succesvol bijgewerkt!');
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

  // Handle Task Group Info Dialog Open
  const handleOpenTaskGroupInfoDialog = (group) => {
    setCurrentTaskGroupInfo(group);
    setTaskGroupInfoDialogOpen(true);
  };

  // Handle Task Group Info Dialog Close
  const handleCloseTaskGroupInfoDialog = () => {
    setTaskGroupInfoDialogOpen(false);
    setCurrentTaskGroupInfo(null);
  };

  return (
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#f4f6f8', p: 2 }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 3,
              overflowY: 'auto',
              borderRadius: 2,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Elements Header */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Elementen
            </Typography>

            {/* Displaying Elements by Category and Space */}
            {Object.entries(categorizedElements).map(([category, spaces]) => {
              const allElementIds = Object.values(spaces).flat().map((el) => el.id);
              const selected = selectedElementsByCategory[category] || [];
              const isAllSelected = selected.length === allElementIds.length;

              return (
                <Accordion key={category} sx={{ mb: 2, boxShadow: 'none' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: '#f0f0f0',
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
                      onClick={(e) => e.stopPropagation()} // Prevent Accordion toggle
                      inputProps={{ 'aria-label': `Selecteer alle elementen in ${category}` }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
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
                                    inputProps={{ 'aria-label': `Selecteer ${element.name}` }}
                                  />
                                }
                                action={
                                  <Tooltip title="Details bekijken" arrow>
                                    <IconButton
                                      aria-label={`Bekijk details van ${element.name}`}
                                      onClick={() => handleOpenInfoDialog(element)}
                                    >
                                      <InfoOutlinedIcon color="action" />
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
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 3,
              borderRadius: 2,
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Timeline Header */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              Tijdlijn
            </Typography>
            <Box
              display="flex"
              flexWrap="nowrap"
              gap={3}
              overflow="auto"
              sx={{ flexGrow: 1, mt: 2, pb: 2 }}
            >
              {years.map((year) => {
                const hasTasks = taskGroupsByYear[year] && taskGroupsByYear[year].length > 0;
                return (
                  <YearCard
                    key={year}
                    year={year}
                    totalCost={totalCostPerYear[year]}
                    taskGroups={taskGroupsByYear[year]}
                    handleOpenTaskGroupInfoDialog={handleOpenTaskGroupInfoDialog}
                  />
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Task Group Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditDialogOpen ? 'Taakgroep Bewerken' : 'Taakgroep Toevoegen'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              label="Taaknaam"
              fullWidth
              margin="dense"
              value={taskProperties.name}
              onChange={(e) =>
                setTaskProperties((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <TextField
              label="Datum Taakgroep"
              type="date"
              fullWidth
              margin="dense"
              value={taskProperties.groupDate.toISOString().substr(0, 10)}
              onChange={(e) =>
                setTaskProperties((prev) => ({
                  ...prev,
                  groupDate: new Date(e.target.value),
                }))
              }
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
            <TextField
              label="Kostprijs (€)"
              fullWidth
              margin="dense"
              type="number"
              value={taskProperties.cost}
              onChange={(e) =>
                setTaskProperties((prev) => ({ ...prev, cost: e.target.value }))
              }
              required
              inputProps={{ min: 0 }}
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
            {/* Display selected elements */}
            <Box sx={{ mt: 2 }}>
              {taskProperties.selectedElementIds.map((elementId) => {
                const element = globalElements.find((el) => el.id === elementId);
                return (
                  <Box
                    key={elementId}
                    sx={{ mb: 2, borderBottom: '1px solid #e0e0e0', pb: 1 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {element.name} ({element.spaceName})
                    </Typography>
                    {taskProperties.assignPricesIndividually && (
                      <TextField
                        label="Kostprijs (€)"
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
                        inputProps={{ min: 0 }}
                        required
                      />
                    )}
                    {/* Individual Date */}
                    <TextField
                      label="Individuele Datum"
                      type="date"
                      fullWidth
                      margin="dense"
                      value={
                        taskProperties.individualDates[elementId]
                          ? taskProperties.individualDates[elementId]
                              .toISOString()
                              .substr(0, 10)
                          : ''
                      }
                      onChange={(e) =>
                        setTaskProperties((prev) => ({
                          ...prev,
                          individualDates: {
                            ...prev.individualDates,
                            [elementId]: new Date(e.target.value),
                          },
                        }))
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                      required
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}
            color="secondary"
            sx={{ textTransform: 'none' }}
            startIcon={<CloseIcon />}
          >
            Annuleren
          </Button>
          <Button
            onClick={isEditDialogOpen ? saveEditedTaskGroup : addTasksToElements}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none' }}
            startIcon={<AddIcon />}
          >
            {isEditDialogOpen ? 'Bijwerken' : 'Toevoegen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Group Info Dialog */}
      <Dialog
        open={taskGroupInfoDialogOpen}
        onClose={handleCloseTaskGroupInfoDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Details van Taakgroep: {currentTaskGroupInfo?.name}
          <IconButton
            aria-label="close"
            onClick={handleCloseTaskGroupInfoDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {currentTaskGroupInfo ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Kosten:</strong>{' '}
                {currentTaskGroupInfo.assignPricesIndividually
                  ? 'Variabel'
                  : `€${currentTaskGroupInfo.cost}`}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Datum:</strong>{' '}
                {new Date(currentTaskGroupInfo.groupDate).toLocaleDateString()}
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Subtaken:
              </Typography>
              {currentTaskGroupInfo.subtasks.map((element) => (
                <Card key={element.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardHeader
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
                    action={
                      <Tooltip title="Bekijk details" arrow>
                        <IconButton
                          aria-label={`Bekijk details van ${element.name}`}
                          onClick={() => handleOpenInfoDialog(element)}
                        >
                          <InfoOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Datum:</strong>{' '}
                      {new Date(element.endDate).toLocaleDateString()}
                    </Typography>
                    {currentTaskGroupInfo.assignPricesIndividually && (
                      <Typography variant="body2">
                        <strong>Kosten:</strong> €{element.individualCost}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
              {/* Add "Edit" button to the popup */}
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    editTaskGroup(currentTaskGroupInfo);
                    handleCloseTaskGroupInfoDialog();
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Bewerk Taakgroep
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography>Geen gegevens beschikbaar.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseTaskGroupInfoDialog}
            color="primary"
            sx={{ textTransform: 'none' }}
          >
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Element Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={handleCloseInfoDialog}
        maxWidth="lg"
        fullWidth
        aria-labelledby="element-info-dialog-title"
      >
        <DialogTitle id="element-info-dialog-title">
          Elementdetails: {currentElementInfo?.name}
          <IconButton
            aria-label="close"
            onClick={handleCloseInfoDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {currentElementInfo ? (
            <Box>
              {/* Basic Information */}
              <Typography variant="h6" gutterBottom>
                {currentElementInfo.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {currentElementInfo.description || 'Geen beschrijving beschikbaar.'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Type:</strong> {currentElementInfo.type || 'Onbekend'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Materiaal:</strong> {currentElementInfo.material || 'Onbepaald'}
              </Typography>
              {currentElementInfo.customMaterial && (
                <Typography variant="body2" gutterBottom>
                  <strong>Aangepast Materiaal:</strong> {currentElementInfo.customMaterial}
                </Typography>
              )}

              {/* Photos */}
              {currentElementInfo.photos && currentElementInfo.photos.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Foto's:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                    {currentElementInfo.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.replace(/\\/g, '/')}
                        alt={`${currentElementInfo.name} ${index + 1}`}
                        style={{
                          width: '150px',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Documents */}
              {currentElementInfo.documents && currentElementInfo.documents.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Documenten:
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    {currentElementInfo.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={`/${doc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1976d2', textDecoration: 'none' }}
                      >
                        {doc.split('\\').pop()}
                      </a>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Defects */}
              {currentElementInfo.gebreken && Object.keys(currentElementInfo.gebreken).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Gebreken:
                  </Typography>
                  {Object.entries(currentElementInfo.gebreken).map(([severity, issues]) => (
                    <Box key={severity} sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}:
                      </Typography>
                      <ul>
                        {issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Inspection Reports */}
              {currentElementInfo.inspectionReport && currentElementInfo.inspectionReport.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Inspectierapporten:
                  </Typography>
                  {currentElementInfo.inspectionReport.map((report) => (
                    <Card key={report.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardHeader
                        title={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {report.name || 'Inspectie'}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" color="textSecondary">
                            Datum Inspectie:{' '}
                            {report.inspectionDate
                              ? new Date(report.inspectionDate).toLocaleDateString()
                              : 'Nog niet uitgevoerd'}
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          {report.description || 'Geen beschrijving beschikbaar.'}
                        </Typography>

                        {/* Defects in Inspection Report */}
                        {report.mistakes && report.mistakes.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Gebreken:
                            </Typography>
                            {report.mistakes.map((mistake) => (
                              <Box key={mistake.id} sx={{ mb: 1, pl: 2 }}>
                                <Typography variant="body2">
                                  <strong>Categorie:</strong> {mistake.category} |{' '}
                                  <strong>Ernst:</strong> {mistake.severity} |{' '}
                                  <strong>Omvang:</strong> {mistake.omvang}
                                </Typography>
                                <Typography variant="body2">{mistake.description}</Typography>
                                {/* Mistake Images */}
                                {mistake.images && mistake.images.length > 0 && (
                                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                    {mistake.images.map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img.replace(/\\/g, '/')}
                                        alt={`Mistake ${mistake.category} ${idx + 1}`}
                                        style={{
                                          width: '100px',
                                          height: '100px',
                                          objectFit: 'cover',
                                          borderRadius: 8,
                                        }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}

                        {/* Remarks */}
                        {report.remarks && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Opmerkingen:
                            </Typography>
                            <Typography variant="body2">{report.remarks}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Tasks */}
              {currentElementInfo.tasks && currentElementInfo.tasks.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Taken:
                  </Typography>
                  {currentElementInfo.tasks.map((task) => (
                    <Card key={task.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardHeader
                        title={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {task.name}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" color="textSecondary">
                            Urgentie: {task.urgency}
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          {task.description || 'Geen beschrijving beschikbaar.'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Geschatte Prijs:</strong> €{task.estimatedPrice || 'Onbekend'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Ultimate Datum:</strong>{' '}
                          {task.ultimateDate
                            ? new Date(task.ultimateDate).toLocaleDateString()
                            : 'Onbekend'}
                        </Typography>

                        {/* Planned Work Dates */}
                        {task.planned && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Geplande Werkdatum:
                            </Typography>
                            <Typography variant="body2">
                              {task.planned.workDate
                                ? new Date(task.planned.workDate).toLocaleDateString()
                                : 'Nog niet gepland'}
                            </Typography>
                          </Box>
                        )}

                        {/* Images */}
                        {task.images && task.images.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Afbeeldingen:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                              {task.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.replace(/\\/g, '/')}
                                  alt={`${task.name} ${idx + 1}`}
                                  style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Documents */}
                        {task.documents && task.documents.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Documenten:
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1} mt={0.5}>
                              {task.documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={`/${doc}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#1976d2', textDecoration: 'none' }}
                                >
                                  {doc.split('\\').pop()}
                                </a>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Annotations */}
              {currentElementInfo.annotations && currentElementInfo.annotations.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Annotaties:
                  </Typography>
                  {currentElementInfo.annotations.map((annotation, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Annotatie {idx + 1}:</strong>
                      </Typography>
                      <Typography variant="body2">
                        x: {annotation.x.toFixed(3)}, y: {annotation.y.toFixed(3)}, width: {annotation.width.toFixed(3)}, height: {annotation.height.toFixed(3)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Typography>Geen gegevens beschikbaar.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseInfoDialog}
            color="primary"
            sx={{ textTransform: 'none' }}
            startIcon={<CloseIcon />}
          >
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
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
