// TaskGroupManager.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';
import { format, addMonths, differenceInYears } from 'date-fns';

// Import custom components
import TaskTimeline from './TaskTimeline';
import Sidebar from './Sidebar'; // Import Sidebar

const TaskGroupManager = () => {
  const {
    state,
    setGlobalElements,
    saveData,
    addOfferGroup,
    editOfferGroup,
    deleteOfferGroup,
  } = useMjopContext();

  // State management
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    id: null,
    name: '',
    groupDate: new Date(),
    cost: 0,
    amount: 0,
    duration: 'days',
    totalSquareMeters: 0,
    urgency: 1,
    periodic: false,
    periodicityMonths: '',
    totalYears: '',
    indexation: false,
    indexationRate: '',
    assignPricesIndividually: false,
    individualCosts: {},
    selectedElementIds: [],
    elementNames: {},
    elementSpaces: {},
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);

  // State for Element Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  // State for Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Year range for TaskTimeline
  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Memoized taskGroups map
  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  // Categorize elements
  const categorizedElements = useMemo(() => {
    return state.globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      const spaceName =
        state.globalSpaces.find((space) => space.id === element.spaceId)?.name ||
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
  }, [state.globalElements, state.globalSpaces]);

  // Handlers
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

  const openAddDialog = (category) => {
    if (
      !selectedElementsByCategory[category] ||
      selectedElementsByCategory[category].length === 0
    ) {
      setSnackbarMessage('Selecteer ten minste één element om taken toe te voegen!');
      setSnackbarOpen(true);
      return;
    }

    // Prepare element names and spaces for dialog
    const elementNames = {};
    const elementSpaces = {};
    selectedElementsByCategory[category].forEach((elementId) => {
      const element = state.globalElements.find((el) => el.id === elementId);
      if (element) {
        elementNames[elementId] = element.name;
        elementSpaces[elementId] =
          state.globalSpaces.find((space) => space.id === element.spaceId)?.name ||
          'Onbekende Ruimte';
      }
    });

    setDialogMode('add');
    setCurrentCategory(category);
    setTaskProperties({
      id: null,
      name: category,
      groupDate: new Date(),
      cost: 0,
      amount: 0,
      duration: 'days',
      totalSquareMeters: 0,
      urgency: 1,
      periodic: false,
      periodicityMonths: '',
      totalYears: '',
      indexation: false,
      indexationRate: '',
      assignPricesIndividually: false,
      individualCosts: {},
      selectedElementIds: selectedElementsByCategory[category],
      elementNames,
      elementSpaces,
    });
  };

  const openEditDialog = (group) => {
    // Prepare element names and spaces for dialog
    const elementNames = {};
    const elementSpaces = {};
    group.subtasks.forEach((subtask) => {
      elementNames[subtask.id] = subtask.name;
      elementSpaces[subtask.id] =
        state.globalSpaces.find((space) => space.id === subtask.spaceId)?.name ||
        'Onbekende Ruimte';
    });

    setDialogMode('edit');
    setTaskProperties({
      id: group.id,
      name: group.name,
      groupDate: new Date(group.groupDate),
      cost: group.cost,
      amount: group.amount,
      duration: group.duration,
      totalSquareMeters: group.totalSquareMeters,
      urgency: group.urgency,
      periodic: group.periodic,
      periodicityMonths: group.periodicityMonths || '',
      totalYears: group.totalYears || '',
      indexation: group.indexation,
      indexationRate: group.indexationRate || '',
      assignPricesIndividually: group.assignPricesIndividually,
      individualCosts: group.subtasks.reduce((acc, subtask) => {
        acc[subtask.id] = subtask.individualCost || 0;
        return acc;
      }, {}),
      selectedElementIds: group.subtasks.map((subtask) => subtask.id),
      elementNames,
      elementSpaces,
    });
  };

  const addOrUpdateTaskGroup = useCallback(() => {
    // Extract properties
    const {
      id,
      name,
      groupDate,
      cost,
      amount,
      duration,
      totalSquareMeters,
      urgency,
      periodic,
      periodicityMonths,
      totalYears,
      indexation,
      indexationRate,
      assignPricesIndividually,
      individualCosts,
      selectedElementIds,
    } = taskProperties;

    if (dialogMode === 'add') {
      if (periodic) {
        // Validation
        if (!periodicityMonths || periodicityMonths <= 0) {
          setSnackbarMessage('Voer een geldige periodiciteit in maanden in!');
          setSnackbarOpen(true);
          return;
        }
        if (!totalYears || totalYears <= 0) {
          setSnackbarMessage('Voer een geldig aantal totale jaren in!');
          setSnackbarOpen(true);
          return;
        }
        if (indexation && (!indexationRate || indexationRate < 0)) {
          setSnackbarMessage('Voer een geldige indexatievoet in!');
          setSnackbarOpen(true);
          return;
        }

        // Calculate total periods
        const totalPeriods = Math.floor(
          (parseInt(totalYears, 10) * 12) / parseInt(periodicityMonths, 10)
        );
        const indexRate = indexation ? parseFloat(indexationRate) / 100 : 0;

        const newTaskGroups = [];
        const newOfferGroups = [];
        const tasksByElementId = {};

        for (let i = 0; i < totalPeriods; i++) {
          // Calculate period date
          const periodDate = addMonths(new Date(groupDate), i * parseInt(periodicityMonths, 10));

          // Calculate adjusted cost with indexation
          const fullYearsElapsed = differenceInYears(periodDate, new Date(groupDate));
          const adjustedCost = indexation
            ? parseFloat((parseFloat(cost) * Math.pow(1 + indexRate, fullYearsElapsed)).toFixed(2))
            : parseFloat(cost.toFixed(2));

          selectedElementIds.forEach((elementId) => {
            const element = state.globalElements.find((el) => el.id === elementId);
            if (!element) return;

            const groupId = uuidv4();
            const offerGroupId = uuidv4();

            // Create new task group for this element and period
            const newTaskGroup = {
              id: groupId,
              name: `${name} - Period ${i + 1} - ${element.name}`,
              groupDate: periodDate,
              cost: adjustedCost,
              amount: parseInt(amount, 10),
              duration,
              totalSquareMeters: parseFloat(totalSquareMeters).toFixed(2),
              urgency: parseInt(urgency, 10),
              periodic: false,
              periodicityMonths: null,
              totalYears: null,
              indexation: false,
              indexationRate: null,
              assignPricesIndividually,
              subtasks: [
                {
                  ...element,
                  individualCost: assignPricesIndividually
                    ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                    : 0,
                  endDate: new Date(periodDate),
                  offerGroupId,
                },
              ],
            };

            newTaskGroups.push(newTaskGroup);

            // Create new offerGroup
            const newOfferGroup = {
              offerGroupId,
              invoicePrice: "",
              offerPrice: "",
              estimatedValue: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : parseFloat(cost.toFixed(2)),
              name: `Offertegroep ${i + 1} - ${element.name}`,
              offerAccepted: false,
              groupWorkDate: format(periodDate, 'yyyy-MM-dd'),
            };

            newOfferGroups.push(newOfferGroup);

            // Create new task and add to tasksByElementId
            const newTask = {
              id: uuidv4(),
              name: `${name} - Period ${i + 1} - ${element.name}`,
              description: element.description || '',
              endDate: new Date(periodDate),
              cost: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : parseFloat(cost.toFixed(2)),
              isGrouped: true,
              elementName: element.name,
              groupId: groupId,
              offerGroupId: offerGroupId,
              planned: {
                workDate: null,
                startDate: null,
                endDate: null,
                offerAccepted: false,
                comment: "",
                contractCost: 0,
                contractDuration: 0,
                useInterval: false,
                intervalYears: 0,
                totalYears: 0,
                inflationRate: 0,
                offerFiles: [],
                invoiceFiles: [],
              },
            };

            if (!tasksByElementId[elementId]) {
              tasksByElementId[elementId] = [];
            }
            tasksByElementId[elementId].push(newTask);
          });
        }

        // Update globalElements with new tasks
        const updatedGlobalElements = state.globalElements.map((el) => {
          if (tasksByElementId[el.id]) {
            return {
              ...el,
              tasks: [...(el.tasks || []), ...tasksByElementId[el.id]],
            };
          }
          return el;
        });

        setGlobalElements(updatedGlobalElements);

        // Add new task groups and offer groups
        setTaskGroups((prev) => [...prev, ...newTaskGroups]);
        newOfferGroups.forEach((og) => addOfferGroup(og));

        // Clear selections and close dialog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Periodieke taakgroepen succesvol toegevoegd!');
        setSnackbarOpen(true);
      } else if (amount <= 0) {
        setSnackbarMessage('Voer een geldige tijd in maanden in!');
        setSnackbarOpen(true);
        return;
      } else {
        // Handle non-periodic task group addition
        const groupId = uuidv4();
        const newTaskGroup = {
          id: groupId,
          name,
          groupDate,
          cost: parseFloat(cost.toFixed(2)),
          amount: parseInt(amount, 10),
          duration,
          totalSquareMeters: parseFloat(totalSquareMeters).toFixed(2),
          urgency: parseInt(urgency, 10),
          periodic: false,
          periodicityMonths: null,
          totalYears: null,
          indexation: false,
          indexationRate: null,
          assignPricesIndividually,
          subtasks: selectedElementIds.map((elementId) => {
            const element = state.globalElements.find((el) => el.id === elementId);
            return {
              ...element,
              individualCost: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : 0,
              endDate: new Date(groupDate),
            };
          }),
        };

        // Add new task group
        setTaskGroups((prev) => [...prev, newTaskGroup]);

        // Clear selections and close dialog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Taakgroep succesvol toegevoegd!');
        setSnackbarOpen(true);
      }
    } else if (dialogMode === 'edit') {
      // Handle task group editing
      setTaskGroups((prevGroups) =>
        prevGroups.map((group) => (group.id === id ? { ...group, ...taskProperties } : group))
      );

      setDialogMode(null);
      setSnackbarMessage('Taakgroep succesvol bijgewerkt!');
      setSnackbarOpen(true);
    }
  }, [
    dialogMode,
    taskProperties,
    state.globalElements,
    addOfferGroup,
    currentCategory,
    setGlobalElements,
  ]);

  const handleDeleteTaskGroup = () => {
    const { id, name, offerGroupId } = taskProperties;
    if (!id) return;

    // Remove task group
    setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));

    // Remove associated offer group
    if (offerGroupId) {
      deleteOfferGroup(offerGroupId);
    }

    // Update globalElements by removing groupId and offerGroupId from tasks
    const updatedGlobalElements = state.globalElements.map((element) => {
      if (element.tasks && element.tasks.length > 0) {
        const updatedTasks = element.tasks.filter((task) => task.groupId !== id);
        return { ...element, tasks: updatedTasks };
      }
      return element;
    });

    setGlobalElements(updatedGlobalElements);

    // Close dialogs and show success message
    setDeleteConfirmOpen(false);
    setDialogMode(null);
    setSnackbarMessage(`Taakgroep "${name}" succesvol verwijderd!`);
    setSnackbarOpen(true);
  };

  // Group task groups by year for the timeline
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
        costPerYear[year] = (costPerYear[year] || 0) + parseFloat(group.cost);
      }
    });
    // Round to 2 decimals
    Object.keys(costPerYear).forEach((year) => {
      costPerYear[year] = parseFloat(costPerYear[year].toFixed(2));
    });
    return costPerYear;
  }, [taskGroups]);

  const handleOpenInfoDialog = (element) => {
    setCurrentElementInfo(element);
    setInfoDialogOpen(true);
  };

  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setCurrentElementInfo(null);
  };

  const handleSaveData = async () => {
    try {
      await saveData();
      if (state.success) {
        setSnackbarMessage(state.success);
      } else {
        setSnackbarMessage('Data successfully saved.');
      }
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to save data. Please try again.');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (state.success) {
      setSnackbarMessage(state.success);
      setSnackbarOpen(true);
    }
    if (state.errors.general) {
      setSnackbarMessage(state.errors.general);
      setSnackbarOpen(true);
    }
  }, [state.success, state.errors]);

  if (!state.isDataLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Save Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Task Timeline
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveData}
          disabled={state.isSaving}
          startIcon={state.isSaving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {state.isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Sidebar
            categorizedElements={categorizedElements}
            selectedElementsByCategory={selectedElementsByCategory}
            toggleElementSelection={toggleElementSelection}
            toggleSelectAll={toggleSelectAll}
            openAddDialog={openAddDialog}
            handleOpenInfoDialog={handleOpenInfoDialog}
            taskGroupsMap={taskGroupsMap}
          />
        </Grid>

        {/* Task Timeline */}
        <Grid item xs={12} md={8}>
          <TaskTimeline
            years={years}
            taskGroupsByYear={taskGroupsByYear}
            totalCostPerYear={totalCostPerYear}
            handleOpenTaskGroupInfoDialog={openEditDialog}
          />
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={state.errors.general ? 'error' : 'success'}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskGroupManager;
