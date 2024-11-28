// Bestaande imports
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
  // Voeg hier de ontbrekende componenten toe
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
  Edit as EditIcon,
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
    const allElementIds = Object.values(categorizedElements[category] || {}).flat().map((el) => el.id);
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
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#e0e0e0', p: 1 }}>
      <Grid container spacing={1} sx={{ height: '100%' }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 1,
              overflowY: 'auto',
              borderRadius: 1,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Elements Header */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Elementen
            </Typography>

            {/* Displaying Elements by Category and Space */}
            {Object.entries(categorizedElements).map(([category, spaces]) => {
              const allElementIds = Object.values(spaces).flat().map((el) => el.id);
              const selected = selectedElementsByCategory[category] || [];
              const isAllSelected = selected.length === allElementIds.length;

              return (
                <Box key={category} sx={{ mb: 1 }}>
                  {/* Category Header */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 0.5 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={selected.length > 0 && !isAllSelected}
                          onChange={() => toggleSelectAll(category)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {category}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                    <Tooltip title={`Toevoegen aan ${category}`} arrow>
                      <IconButton
                        aria-label="add"
                        size="small"
                        onClick={() => openAddDialog(category)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* List of Spaces and Elements */}
                  {Object.entries(spaces).map(([spaceName, elements]) => (
                    <Box key={spaceName} sx={{ pl: 2, mb: 0.5 }}>
                      {/* Space Header */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.85rem', mb: 0.3 }}>
                        {spaceName}
                      </Typography>
                      {/* List of Elements */}
                      <List dense>
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
                            <ListItem key={element.id} disablePadding sx={{ mb: 0.3 }}>
                              <ListItemButton
                                onClick={() => handleOpenInfoDialog(element)}
                                sx={{
                                  p: 0.5,
                                  borderRadius: 0.5,
                                  '&:hover': { backgroundColor: '#f5f5f5' },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                                  <Checkbox
                                    checked={selected.includes(element.id)}
                                    onChange={() => toggleElementSelection(category, element.id)}
                                    color="primary"
                                    size="small"
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                      {element.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box display="flex" flexWrap="wrap" gap={0.3} mt={0.2}>
                                      {plannedYears.map((year) => (
                                        <Chip
                                          key={year}
                                          label={year}
                                          size="small"
                                          color="secondary"
                                          sx={{ fontSize: '0.7rem', height: '16px' }}
                                        />
                                      ))}
                                    </Box>
                                  }
                                  sx={{ '& .MuiListItemText-secondary': { display: 'flex', flexWrap: 'wrap' } }}
                                />
                                <Tooltip title="Details bekijken" arrow>
                                  <IconButton
                                    edge="end"
                                    aria-label="info"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent ListItemButton click
                                      handleOpenInfoDialog(element);
                                    }}
                                  >
                                    <InfoOutlinedIcon fontSize="small" color="action" />
                                  </IconButton>
                                </Tooltip>
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  ))}
                </Box>
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
              borderRadius: 1,
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Timeline Header */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
              Tijdlijn
            </Typography>
            <Box
              display="flex"
              gap={2}
              overflow="auto"
              sx={{ flexGrow: 1, mt: 1, pb: 1 }}
            >
              {years.map((year) => (
                <Card
                  key={year}
                  variant="outlined"
                  sx={{
                    minWidth: 220,
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    },
                  }}
                  onClick={() => handleOpenTaskGroupInfoDialog(taskGroupsByYear[year] ? taskGroupsByYear[year][0] : null)}
                >
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                        {year}
                      </Typography>
                    }
                  />
                  <CardContent>
                    {/* Weergave van totale kosten per jaar */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
                      Totale Kosten: €{totalCostPerYear[year] || 0}
                    </Typography>
                    {taskGroupsByYear[year] && taskGroupsByYear[year].length > 0 ? (
                      taskGroupsByYear[year].map((group) => (
                        <Box key={group.id} sx={{ mb: 0.5 }}>
                          <Card
                            variant="outlined"
                            sx={{
                              borderRadius: 1,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              transition: 'background-color 0.3s',
                              '&:hover': {
                                backgroundColor: '#f0f0f0',
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering parent onClick
                              handleOpenTaskGroupInfoDialog(group);
                            }}
                          >
                            <CardHeader
                              title={
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                  {group.name}
                                </Typography>
                              }
                              subheader={
                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                  Kosten: €{group.assignPricesIndividually ? 'Variabel' : group.cost}
                                </Typography>
                              }
                              sx={{ p: 0.5 }}
                            />
                          </Card>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                        Geen taken voor dit jaar.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
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
        <DialogTitle>{isEditDialogOpen ? 'Taakgroep bewerken' : 'Taakgroep toevoegen'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Taaknaam"
            fullWidth
            margin="dense"
            value={taskProperties.name}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, name: e.target.value }))
            }
            size="small"
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Datum Taakgroep"
            type="date"
            fullWidth
            margin="dense"
            value={taskProperties.groupDate.toISOString().substr(0, 10)}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, groupDate: new Date(e.target.value) }))
            }
            size="small"
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Kostprijs"
            fullWidth
            margin="dense"
            type="number"
            value={taskProperties.cost}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, cost: e.target.value }))
            }
            size="small"
            variant="outlined"
            sx={{ mb: 1 }}
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
                size="small"
              />
            }
            label="Prijzen per element toewijzen"
            sx={{ mt: 1, fontSize: '0.8rem' }}
          />
          {/* Display selected elements */}
          <Box sx={{ mt: 1 }}>
            {taskProperties.selectedElementIds.map((elementId) => {
              const element = globalElements.find((el) => el.id === elementId);
              return (
                <Box key={elementId} sx={{ mb: 1, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                    {element.name} ({element.spaceName})
                  </Typography>
                  {taskProperties.assignPricesIndividually && (
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
                      size="small"
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{ mt: 0.5, mb: 0.5 }}
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
                        ? taskProperties.individualDates[elementId].toISOString().substr(0, 10)
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
                    size="small"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}
            color="secondary"
            sx={{ textTransform: 'none', fontSize: '0.85rem' }}
          >
            Annuleren
          </Button>
          <Button
            onClick={isEditDialogOpen ? saveEditedTaskGroup : addTasksToElements}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none', fontSize: '0.85rem' }}
          >
            {isEditDialogOpen ? 'Taakgroep bijwerken' : 'Taakgroep toevoegen'}
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
        <DialogTitle>Details van Taakgroep: {currentTaskGroupInfo?.name}</DialogTitle>
        <DialogContent>
          {currentTaskGroupInfo ? (
            <Box>
              <Typography variant="body1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                <strong>Kosten:</strong> €{currentTaskGroupInfo.assignPricesIndividually ? 'Variabel' : currentTaskGroupInfo.cost}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                <strong>Datum:</strong> {new Date(currentTaskGroupInfo.groupDate).toLocaleDateString()}
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontSize: '1rem' }}>
                Subtaken:
              </Typography>
              {currentTaskGroupInfo.subtasks.map((element) => (
                <Box key={element.id} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                      {element.name}
                    </Typography>
                    <Tooltip title="Bekijk details" arrow>
                      <IconButton
                        aria-label="info"
                        onClick={() => handleOpenInfoDialog(element)}
                        size="small"
                      >
                        <InfoOutlinedIcon fontSize="small" color="action" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.3 }}>
                    <strong>Datum:</strong> {new Date(element.endDate).toLocaleDateString()}
                  </Typography>
                  {currentTaskGroupInfo.assignPricesIndividually && (
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      <strong>Kosten:</strong> €{element.individualCost}
                    </Typography>
                  )}
                </Box>
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
                  sx={{ textTransform: 'none', fontSize: '0.85rem' }}
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
          <Button onClick={handleCloseTaskGroupInfoDialog} color="primary" sx={{ textTransform: 'none', fontSize: '0.85rem' }}>
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* **Uitgebreide Info Dialog** */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Elementdetails: {currentElementInfo?.name}</DialogTitle>
        <DialogContent dividers>
          {currentElementInfo ? (
            <Box>
              {/* Basale Informatie */}
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                {currentElementInfo.name}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ fontSize: '0.85rem' }}>
                {currentElementInfo.description || 'Geen beschrijving beschikbaar.'}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                <strong>Type:</strong> {currentElementInfo.type || 'Onbekend'}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                <strong>Materiaal:</strong> {currentElementInfo.material || 'Onbepaald'}
              </Typography>
              {currentElementInfo.customMaterial && (
                <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                  <strong>Aangepast Materiaal:</strong> {currentElementInfo.customMaterial}
                </Typography>
              )}

              {/* Foto's */}
              {currentElementInfo.photos && currentElementInfo.photos.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                    Foto's:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                    {currentElementInfo.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.replace('\\\\', '/')}
                        alt={`${currentElementInfo.name} ${index + 1}`}
                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: 6 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Documenten */}
              {currentElementInfo.documents && currentElementInfo.documents.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                    Documenten:
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
                    {currentElementInfo.documents.map((doc, idx) => (
                      <a key={idx} href={`/${doc}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem' }}>
                        {doc.split('\\').pop()}
                      </a>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Gebreken */}
              {currentElementInfo.gebreken && Object.keys(currentElementInfo.gebreken).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                    Gebreken:
                  </Typography>
                  {Object.entries(currentElementInfo.gebreken).map(([severity, issues]) => (
                    <Box key={severity} sx={{ mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}:
                      </Typography>
                      <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                        {issues.map((issue, idx) => (
                          <li key={idx} style={{ fontSize: '0.75rem' }}>{issue}</li>
                        ))}
                      </ul>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Inspectierapporten */}
              {currentElementInfo.inspectionReport && currentElementInfo.inspectionReport.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                    Inspectierapporten:
                  </Typography>
                  {currentElementInfo.inspectionReport.map((report) => (
                    <Card key={report.id} variant="outlined" sx={{ mb: 1, borderRadius: 1 }}>
                      <CardHeader
                        title={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {report.name || 'Inspectie'}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                            Datum Inspectie: {report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString() : 'Nog niet uitgevoerd'}
                          </Typography>
                        }
                        sx={{ p: 0.5 }}
                      />
                      <CardContent sx={{ p: 0.5 }}>
                        <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                          {report.description || 'Geen beschrijving beschikbaar.'}
                        </Typography>

                        {/* Gebreken in Inspectierapport */}
                        {report.mistakes && report.mistakes.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              Gebreken:
                            </Typography>
                            {report.mistakes.map((mistake) => (
                              <Box key={mistake.id} sx={{ mb: 0.5, pl: 1 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                  <strong>Categorie:</strong> {mistake.category} | <strong>Ernst:</strong> {mistake.severity} | <strong>Omvang:</strong> {mistake.omvang}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{mistake.description}</Typography>
                                {/* Mistake Images */}
                                {mistake.images && mistake.images.length > 0 && (
                                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.3}>
                                    {mistake.images.map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img.replace('\\\\', '/')}
                                        alt={`Mistake ${mistake.category} ${idx + 1}`}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 4 }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}

                        {/* Opmerkingen */}
                        {report.remarks && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              Opmerkingen:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{report.remarks}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Taken */}
              {currentElementInfo.tasks && currentElementInfo.tasks.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                    Taken:
                  </Typography>
                  {currentElementInfo.tasks.map((task) => (
                    <Card key={task.id} variant="outlined" sx={{ mb: 1, borderRadius: 1 }}>
                      <CardHeader
                        title={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {task.name}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                            Urgentie: {task.urgency}
                          </Typography>
                        }
                        sx={{ p: 0.5 }}
                      />
                      <CardContent sx={{ p: 0.5 }}>
                        <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                          {task.description || 'Geen beschrijving beschikbaar.'}
                        </Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                          <strong>Geschatte Prijs:</strong> €{task.estimatedPrice || 'Onbekend'}
                        </Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                          <strong>Ultimate Datum:</strong> {task.ultimateDate ? new Date(task.ultimateDate).toLocaleDateString() : 'Onbekend'}
                        </Typography>

                        {/* Geplande Werkdata */}
                        {task.planned && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              Geplande Werkdatum:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {task.planned.workDate ? new Date(task.planned.workDate).toLocaleDateString() : 'Nog niet gepland'}
                            </Typography>
                          </Box>
                        )}

                        {/* Afbeeldingen */}
                        {task.images && task.images.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              Afbeeldingen:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.3}>
                              {task.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.replace('\\\\', '/')}
                                  alt={`${task.name} ${idx + 1}`}
                                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 4 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Documenten */}
                        {task.documents && task.documents.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              Documenten:
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={0.3} mt={0.3}>
                              {task.documents.map((doc, idx) => (
                                <a key={idx} href={`/${doc}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>
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

              {/* Annotaties */}
              {currentElementInfo.annotations && currentElementInfo.annotations.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                    Annotaties:
                  </Typography>
                  {currentElementInfo.annotations.map((annotation, idx) => (
                    <Box key={idx} sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        Annotatie {idx + 1}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
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
          <Button onClick={handleCloseInfoDialog} color="primary" sx={{ textTransform: 'none', fontSize: '0.85rem' }}>
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
          sx={{ width: '100%', fontSize: '0.85rem' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
