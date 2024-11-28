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
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon, // Import Delete Icon
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
          boxShadow: hasTasks
            ? '0 4px 10px rgba(0,0,0,0.15)'
            : '0 2px 5px rgba(0,0,0,0.1)',
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
          <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
            <CalendarTodayIcon fontSize="small" />
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
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
                    <Avatar sx={{ bgcolor: '#ff9800', width: 28, height: 28 }}>
                      <AssignmentIcon fontSize="small" />
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
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);

  // State for Info Dialog (Element Info)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  // State for Task Group Info Dialog
  // Removed: We'll use the unified dialog instead

  // State for Tabs in Task Group Info Dialog
  const [selectedTaskGroupTab, setSelectedTaskGroupTab] = useState(0);

  // State for Tabs in Element Info Dialog
  const [selectedElementTab, setSelectedElementTab] = useState(0);

  // State for Delete Confirmation Dialog
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
    });
    setDialogMode('add');
  };

  // Open Edit Task dialog for a specific task group
  const openEditDialog = (group) => {
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
    });
  };

  // Add tasks to selected elements and create a task group
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
  const deleteTaskGroup = () => {
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

  // Handle Info Dialog Open (Element Info)
  const handleOpenInfoDialog = (element) => {
    setCurrentElementInfo(element);
    setInfoDialogOpen(true);
    setSelectedElementTab(0); // Reset to first tab when opening
  };

  // Handle Info Dialog Close (Element Info)
  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setCurrentElementInfo(null);
    setSelectedElementTab(0);
  };

  // Handle Task Group Info Dialog Open
  // Removed: We'll use the unified dialog instead

  // Handle Task Group Info Dialog Close
  // Removed: We'll use the unified dialog instead

  // Handle Task Group Tab Change
  const handleTaskGroupTabChange = (event, newValue) => {
    setSelectedTaskGroupTab(newValue);
  };

  // Handle Element Info Tab Change
  const handleElementTabChange = (event, newValue) => {
    setSelectedElementTab(newValue);
  };

  // Categorize content into Task Group Info Tabs
  const renderTaskGroupInfoTabs = () => {
    if (!taskProperties) return null;

    return (
      <Box sx={{ width: '100%' }}>
        <Tabs
          value={selectedTaskGroupTab}
          onChange={handleTaskGroupTabChange}
          aria-label="Task Group Info Tabs"
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overzicht" id="taskgroup-tab-0" aria-controls="taskgroup-tabpanel-0" />
          <Tab label="Subtaken" id="taskgroup-tab-1" aria-controls="taskgroup-tabpanel-1" />
          <Tab label="Instellingen" id="taskgroup-tab-2" aria-controls="taskgroup-tabpanel-2" />
        </Tabs>
        <Box
          role="tabpanel"
          hidden={selectedTaskGroupTab !== 0}
          id="taskgroup-tabpanel-0"
          aria-labelledby="taskgroup-tab-0"
          sx={{ p: 2 }}
        >
          {selectedTaskGroupTab === 0 && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Kosten:</strong>{' '}
                {taskProperties.assignPricesIndividually
                  ? 'Variabel'
                  : `€${taskProperties.cost}`}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Datum:</strong>{' '}
                {new Date(taskProperties.groupDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedTaskGroupTab !== 1}
          id="taskgroup-tabpanel-1"
          aria-labelledby="taskgroup-tab-1"
          sx={{ p: 2 }}
        >
          {selectedTaskGroupTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Subtaken:
              </Typography>
              {taskProperties.subtasks.map((element) => (
                <Card key={element.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: '#ff9800', width: 28, height: 28 }}>
                        <AssignmentIcon fontSize="small" />
                      </Avatar>
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
                    action={
                      <Tooltip title="Bekijk details" arrow>
                        <IconButton
                          aria-label={`Bekijk details van ${element.name}`}
                          onClick={() => handleOpenInfoDialog(element)}
                          size="small"
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Datum:</strong>{' '}
                      {new Date(element.endDate).toLocaleDateString()}
                    </Typography>
                    {taskProperties.assignPricesIndividually && (
                      <Typography variant="body2">
                        <strong>Kosten:</strong> €{element.individualCost}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedTaskGroupTab !== 2}
          id="taskgroup-tabpanel-2"
          aria-labelledby="taskgroup-tab-2"
          sx={{ p: 2 }}
        >
          {selectedTaskGroupTab === 2 && (
            <Box>
              {/* Settings or Additional Actions */}
              <Typography variant="h6" gutterBottom>
                Instellingen
              </Typography>
              {/* Example: Toggle for assigning prices individually */}
              <FormControlLabel
                control={
                  <Switch
                    checked={taskProperties.assignPricesIndividually}
                    onChange={(e) => {
                      const updatedTaskGroups = taskGroups.map((group) => {
                        if (group.id === taskProperties.id) {
                          return { ...group, assignPricesIndividually: e.target.checked };
                        }
                        return group;
                      });
                      setTaskGroups(updatedTaskGroups);
                      setTaskProperties((prev) => ({
                        ...prev,
                        assignPricesIndividually: e.target.checked,
                      }));
                    }}
                    color="primary"
                    aria-label="Prijzen per element toewijzen"
                  />
                }
                label="Prijzen per element toewijzen"
              />
              {/* Additional settings can be added here */}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Categorize content into Element Info Tabs
  const renderElementInfoTabs = () => {
    if (!currentElementInfo) return null;

    return (
      <Box sx={{ width: '100%' }}>
        <Tabs
          value={selectedElementTab}
          onChange={handleElementTabChange}
          aria-label="Element Info Tabs"
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Details" id="element-tab-0" aria-controls="element-tabpanel-0" />
          <Tab label="Foto's" id="element-tab-1" aria-controls="element-tabpanel-1" />
          <Tab label="Documenten" id="element-tab-2" aria-controls="element-tabpanel-2" />
          <Tab label="Gebreken" id="element-tab-3" aria-controls="element-tabpanel-3" />
          <Tab label="Inspectierapporten" id="element-tab-4" aria-controls="element-tabpanel-4" />
          <Tab label="Taken" id="element-tab-5" aria-controls="element-tabpanel-5" />
          <Tab label="Annotaties" id="element-tab-6" aria-controls="element-tabpanel-6" />
        </Tabs>
        <Box
          role="tabpanel"
          hidden={selectedElementTab !== 0}
          id="element-tabpanel-0"
          aria-labelledby="element-tab-0"
          sx={{ p: 2 }}
        >
          {selectedElementTab === 0 && (
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
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedElementTab !== 1}
          id="element-tabpanel-1"
          aria-labelledby="element-tab-1"
          sx={{ p: 2 }}
        >
          {selectedElementTab === 1 && (
            <Box>
              {/* Photos */}
              {currentElementInfo.photos && currentElementInfo.photos.length > 0 ? (
                <Box>
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
              ) : (
                <Typography>Geen foto's beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedElementTab !== 2}
          id="element-tabpanel-2"
          aria-labelledby="element-tab-2"
          sx={{ p: 2 }}
        >
          {selectedElementTab === 2 && (
            <Box>
              {/* Documents */}
              {currentElementInfo.documents && currentElementInfo.documents.length > 0 ? (
                <Box>
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
              ) : (
                <Typography>Geen documenten beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedElementTab !== 3}
          id="element-tabpanel-3"
          aria-labelledby="element-tab-3"
          sx={{ p: 2 }}
        >
          {selectedElementTab === 3 && (
            <Box>
              {/* Defects */}
              {currentElementInfo.gebreken && Object.keys(currentElementInfo.gebreken).length > 0 ? (
                <Box>
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
              ) : (
                <Typography>Geen gebreken gemeld.</Typography>
              )}
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedElementTab !== 4}
          id="element-tabpanel-4"
          aria-labelledby="element-tab-4"
          sx={{ p: 2 }}
        >
          {selectedElementTab === 4 && (
            <Box>
              {/* Inspection Reports */}
              {currentElementInfo.inspectionReport && currentElementInfo.inspectionReport.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Inspectierapporten:
                  </Typography>
                  {currentElementInfo.inspectionReport.map((report) => (
                    <Card key={report.id} variant="outlined" sx={{ mb: 3 }}>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: '#3f51b5', width: 28, height: 28 }}>
                            <AssignmentIcon fontSize="small" />
                          </Avatar>
                        }
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
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Gebreken:
                            </Typography>
                            {report.mistakes.map((mistake) => (
                              <Box key={mistake.id} sx={{ mb: 2, pl: 2 }}>
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
                          <Box sx={{ mt: 2 }}>
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
              ) : (
                <Typography>Geen inspectierapporten beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedElementTab !== 5}
          id="element-tabpanel-5"
          aria-labelledby="element-tab-5"
          sx={{ p: 2 }}
        >
          {selectedElementTab === 5 && (
            <Box>
              {/* Tasks */}
              {currentElementInfo.tasks && currentElementInfo.tasks.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Taken:
                  </Typography>
                  {currentElementInfo.tasks.map((task) => (
                    <Card key={task.id} variant="outlined" sx={{ mb: 3 }}>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: '#4caf50', width: 28, height: 28 }}>
                            <AssignmentIcon fontSize="small" />
                          </Avatar>
                        }
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
                          <Box sx={{ mt: 2 }}>
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
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Afbeeldingen:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
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
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Documenten:
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1} mt={1}>
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
              ) : (
                <Typography>Geen taken beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={selectedElementTab !== 6}
          id="element-tabpanel-6"
          aria-labelledby="element-tab-6"
          sx={{ p: 2 }}
        >
          {selectedElementTab === 6 && (
            <Box>
              {/* Annotations */}
              {currentElementInfo.annotations && currentElementInfo.annotations.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Annotaties:
                  </Typography>
                  {currentElementInfo.annotations.map((annotation, idx) => (
                    <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Annotatie {idx + 1}:</strong>
                      </Typography>
                      <Typography variant="body2">
                        x: {annotation.x.toFixed(3)}, y: {annotation.y.toFixed(3)}, width: {annotation.width.toFixed(3)}, height: {annotation.height.toFixed(3)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography>Geen annotaties beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    );
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
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 4,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Timeline Header */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Tijdlijn
            </Typography>
            <Box
              display="flex"
              flexWrap="nowrap"
              gap={4}
              overflow="auto"
              sx={{ flexGrow: 1, mt: 1, pb: 2 }}
            >
              {years.map((year) => {
                const hasTasks = taskGroupsByYear[year] && taskGroupsByYear[year].length > 0;
                return (
                  <YearCard
                    key={year}
                    year={year}
                    totalCost={totalCostPerYear[year]}
                    taskGroups={taskGroupsByYear[year]}
                    handleOpenTaskGroupInfoDialog={(group) => {
                      // Instead of handling an array, pass a single group for editing
                      openEditDialog(group);
                      setDialogMode('edit');
                    }}
                  />
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Unified Add/Edit Task Group Dialog */}
      <Dialog
        open={dialogMode === 'add' || dialogMode === 'edit'}
        onClose={() => {
          setDialogMode(null);
        }}
        maxWidth="sm"
        fullWidth
        aria-labelledby="add-edit-task-group-dialog-title"
      >
        <DialogTitle id="add-edit-task-group-dialog-title">
          {dialogMode === 'edit' ? 'Taakgroep Bewerken' : 'Taakgroep Toevoegen'}
          <IconButton
            aria-label="close"
            onClick={() => setDialogMode(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
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
              InputLabelProps={{
                shrink: true,
              }}
              aria-label="Taaknaam"
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
              required
              aria-label="Datum Taakgroep"
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
              inputProps={{ min: 0, step: '0.01' }}
              aria-label="Kostprijs"
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
                  aria-label="Prijzen per element toewijzen"
                />
              }
              label="Prijzen per element toewijzen"
              sx={{ mt: 2 }}
            />
            {/* Display selected elements */}
            <Box sx={{ mt: 3 }}>
              {taskProperties.selectedElementIds.map((elementId) => {
                const element = globalElements.find((el) => el.id === elementId);
                return (
                  <Box
                    key={elementId}
                    sx={{
                      mb: 2,
                      borderBottom: '1px solid #e0e0e0',
                      pb: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
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
                        required
                        inputProps={{ min: 0, step: '0.01' }}
                        aria-label={`Kostprijs voor ${element.name}`}
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
                      required
                      aria-label={`Individuele datum voor ${element.name}`}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogMode(null)}
            color="secondary"
            sx={{ textTransform: 'none' }}
            startIcon={<CloseIcon fontSize="small" />}
            aria-label="Annuleren"
          >
            Annuleren
          </Button>
          <Button
            onClick={addOrUpdateTaskGroup}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none' }}
            startIcon={dialogMode === 'edit' ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
            aria-label={dialogMode === 'edit' ? 'Taakgroep bijwerken' : 'Taakgroep toevoegen'}
          >
            {dialogMode === 'edit' ? 'Bijwerken' : 'Toevoegen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Element Info Dialog with Tabs */}
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
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {currentElementInfo ? (
            <Box>
              {/* Render Element Info Tabs */}
              {renderElementInfoTabs()}
              {/* Additional Content if Needed */}
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
            startIcon={<CloseIcon fontSize="small" />}
            aria-label="Sluiten"
          >
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-confirmation-dialog-title"
        aria-describedby="delete-confirmation-dialog-description"
      >
        <DialogTitle id="delete-confirmation-dialog-title">
          Bevestig Verwijdering
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-confirmation-dialog-description">
            Weet je zeker dat je de taakgroep "{taskProperties.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            color="secondary"
            sx={{ textTransform: 'none' }}
            startIcon={<CloseIcon fontSize="small" />}
            aria-label="Annuleren"
          >
            Annuleren
          </Button>
          <Button
            onClick={deleteTaskGroup}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none' }}
            startIcon={<DeleteIcon fontSize="small" />}
            aria-label="Bevestig Verwijdering"
          >
            Verwijder
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
