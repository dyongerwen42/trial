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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Search as SearchIcon,
  InfoOutlined as InfoOutlinedIcon,
  Edit as EditIcon,
  CalendarToday as CalendarTodayIcon,
  EuroSymbol as EuroSymbolIcon,
  Place as PlaceIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Aangepast thema met grijstinten en schaduwen
const theme = createTheme({
  palette: {
    primary: {
      main: '#424242', // Donkergrijs
    },
    secondary: {
      main: '#757575', // Middelgrijs
    },
    background: {
      default: '#f5f5f5', // Lichtgrijs
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial',
  },
  shadows: Array(25)
    .fill('none')
    .map((_, index) => {
      if (index === 1) return '0px 1px 3px rgba(0, 0, 0, 0.12)';
      if (index === 3) return '0px 3px 5px rgba(0, 0, 0, 0.2)';
      if (index === 8) return '0px 8px 10px rgba(0, 0, 0, 0.15)';
      return 'none';
    }),
});

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
    id: null, // Voeg id toe om te identificeren bij bewerken
    name: '',
    groupDate: new Date(),
    urgency: 3,
    cost: 0,
    assignPricesIndividually: false,
    individualCosts: {},
    individualDates: {},
    selectedElementIds: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

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
            'Onbekende Ruimte',
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
      id: null,
      name: category,
      groupDate: new Date(),
      urgency: 3,
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
      urgency,
      cost,
      assignPricesIndividually,
      individualCosts,
      individualDates,
      selectedElementIds,
    } = taskProperties;

    if (!name.trim()) {
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
        endDate.setMonth(0); // Januari
        endDate.setDate(1);

        const newTask = {
          id: uuidv4(),
          name, // Taaknaam is de aangepaste naam uit het dialoog
          description: element.description || '',
          urgency: Number(urgency),
          endDate,
          cost: assignPricesIndividually
            ? Number(individualCosts[element.id] || 0)
            : Number(cost),
          isGrouped: true,
          elementName: element.name,
          groupId: null, // We zullen dit later instellen
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
      urgency: group.urgency,
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
      urgency,
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
          urgency,
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
            endDate.setMonth(0); // Januari
            endDate.setDate(1);

            return {
              ...task,
              name,
              urgency: Number(urgency),
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

  const renderElementsTab = () => (
    <Box sx={{ p: 2 }}>
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
          <Accordion key={category} sx={{ mb: 1 }} elevation={1}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: '#f0f0f0',
                borderRadius: 2,
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
                '&:hover': { backgroundColor: '#e0e0e0' },
                '&.Mui-expanded': {
                  backgroundColor: '#e0e0e0',
                },
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
            <AccordionDetails
              sx={{
                backgroundColor: '#fafafa',
              }}
            >
              <List disablePadding>
                {elements.map((element) => {
                  // Define conditions for displaying the year tag
                  const plannedYears = Array.from(
                    new Set(
                      (element.tasks || [])
                        .filter((task) => task.endDate)
                        .map((task) => new Date(task.endDate).getFullYear())
                    )
                  );

                  return (
                    <React.Fragment key={element.id}>
                      <ListItem
                        alignItems="flex-start"
                        secondaryAction={
                          <Tooltip title="Details bekijken" arrow>
                            <IconButton
                              edge="end"
                              aria-label="info"
                              onClick={() => handleOpenInfoDialog(element)}
                            >
                              <InfoOutlinedIcon color="action" />
                            </IconButton>
                          </Tooltip>
                        }
                        sx={{
                          cursor: 'default',
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={selected.includes(element.id)}
                            onChange={() => toggleElementSelection(category, element.id)}
                            color="primary"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {element.name}
                            </Typography>
                          }
                          secondary={
                            <Box display="flex" alignItems="center" mt={0.5}>
                              <PlaceIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2" color="textSecondary">
                                {element.spaceName}
                              </Typography>
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
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  );
                })}
              </List>
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
                  backgroundColor: '#424242',
                  '&:hover': {
                    backgroundColor: '#616161',
                  },
                }}
                onClick={() => openAddDialog(category)}
              >
                Taakgroep maken
              </Button>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );

  const renderTasksTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Takenoverzicht
      </Typography>

      {/* Task Groups */}
      {taskGroups.length > 0 ? (
        taskGroups.map((group) => (
          <Paper
            key={group.id}
            elevation={3} // Verhoogde schaduw
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: '#ffffff',
            }}
          >
            <Box display="flex" alignItems="center">
              <AssignmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {group.name}
              </Typography>
              <Chip
                label={`Urgentie ${group.urgency}`}
                color="secondary"
                size="small"
                sx={{ ml: 2 }}
              />
              <Tooltip title="Taakgroep bewerken" arrow>
                <IconButton
                  aria-label="edit"
                  onClick={() => editTaskGroup(group)}
                  sx={{ ml: 'auto' }}
                >
                  <EditIcon color="action" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                {new Date(group.groupDate).toLocaleDateString()}
              </Typography>
              <EuroSymbolIcon fontSize="small" sx={{ ml: 2, mr: 0.5 }} />
              <Typography variant="body2">
                Totale kosten: €{group.assignPricesIndividually ? 'Variabel' : group.cost}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {group.subtasks.map((element) => (
                <Grid item xs={12} md={6} key={element.id}>
                  <Paper
                    elevation={2} // Schaduw toevoegen
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      height: '100%',
                      backgroundColor: '#fafafa',
                      position: 'relative',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {element.name}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <PlaceIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{element.spaceName}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mt={1}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {new Date(element.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {group.assignPricesIndividually && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <EuroSymbolIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          Kosten: €{element.individualCost}
                        </Typography>
                      </Box>
                    )}
                    <Tooltip title="Elementdetails bekijken" arrow>
                      <IconButton
                        aria-label="info"
                        onClick={() => handleOpenInfoDialog(element)}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        <InfoOutlinedIcon color="action" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        ))
      ) : (
        <Typography variant="body2" color="textSecondary">
          Geen taakgroepen beschikbaar.
        </Typography>
      )}
    </Box>
  );

  const renderTimelineTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
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
            elevation={3} // Verhoogde schaduw
            sx={{
              p: 2,
              minWidth: 250,
              textAlign: 'center',
              backgroundColor: '#fafafa', // Lichter grijs
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
              {year}
            </Typography>
            {taskGroupsByYear[year] ? (
              taskGroupsByYear[year].map((group) => (
                <Accordion
                  key={group.id}
                  elevation={1} // Schaduw toevoegen aan Accordion
                  sx={{
                    mt: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    '&:before': {
                      display: 'none',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 56,
                      backgroundColor: '#f0f0f0', // Lichtgrijs voor contrast
                      borderRadius: 2,
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)', // Schaduw
                      '&.Mui-expanded': {
                        minHeight: 56,
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {group.name}
                      </Typography>
                      <Box display="flex" alignItems="center" ml="auto">
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" sx={{ mr: 2 }}>
                          {new Date(group.groupDate).toLocaleDateString()}
                        </Typography>
                        <EuroSymbolIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          €{group.assignPricesIndividually ? 'Variabel' : group.cost}
                        </Typography>
                        {/* Edit Icon */}
                        <Tooltip title="Taakgroep bewerken" arrow>
                          <IconButton
                            aria-label="edit"
                            onClick={() => editTaskGroup(group)}
                            sx={{ ml: 1 }}
                          >
                            <EditIcon color="action" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: '#fafafa', // Achtergrondkleur voor diepte
                    }}
                  >
                    <List disablePadding>
                      {group.subtasks.map((element, index) => (
                        <React.Fragment key={element.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemIcon>
                              <CheckCircleIcon color="action" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {element.name}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Box display="flex" alignItems="center" mt={0.5}>
                                    <PlaceIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    <Typography variant="body2" color="textSecondary">
                                      {element.spaceName}
                                    </Typography>
                                  </Box>
                                  <Box display="flex" alignItems="center" mt={0.5}>
                                    <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    <Typography variant="body2" color="textSecondary">
                                      {new Date(element.endDate).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  {group.assignPricesIndividually && (
                                    <Box display="flex" alignItems="center" mt={0.5}>
                                      <EuroSymbolIcon fontSize="small" sx={{ mr: 0.5 }} />
                                      <Typography variant="body2" color="textSecondary">
                                        €{element.individualCost}
                                      </Typography>
                                    </Box>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                          {index < group.subtasks.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                Geen taken voor dit jaar.
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', backgroundColor: '#f5f5f5', display: 'flex' }}>
        {/* Sidebar with Tabs */}
        <Paper
          elevation={3}
          sx={{
            width: 300,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            backgroundColor: '#424242', // Donkergrijze achtergrond voor contrast
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={(e, newValue) => setTabIndex(newValue)}
            orientation="vertical"
            variant="fullWidth"
            sx={{
              borderRight: 1,
              borderColor: 'divider',
              '.MuiTab-root': {
                color: '#ffffff',
              },
              '.Mui-selected': {
                backgroundColor: '#616161',
              },
            }}
          >
            <Tab label="Elementen" />
            <Tab label="Takenoverzicht" />
            <Tab label="Tijdlijn" />
          </Tabs>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {tabIndex === 0 && renderElementsTab()}
          {tabIndex === 1 && renderTasksTab()}
          {tabIndex === 2 && renderTimelineTab()}
        </Box>
      </Box>

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
            InputLabelProps={{
              shrink: true,
            }}
          />
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
          {/* Display selected elements */}
          <Box sx={{ mt: 2 }}>
            {taskProperties.selectedElementIds.map((elementId) => {
              const element = globalElements.find((el) => el.id === elementId);
              return (
                <Paper
                  key={elementId}
                  elevation={1}
                  sx={{ p: 2, mb: 1, borderRadius: 2 }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Paper>
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
            sx={{ textTransform: 'none' }}
          >
            Annuleren
          </Button>
          <Button
            onClick={isEditDialogOpen ? saveEditedTaskGroup : addTasksToElements}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            {isEditDialogOpen ? 'Taakgroep bijwerken' : 'Taakgroep toevoegen'}
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
    </ThemeProvider>
  );
};

export default FullTaskManager;
