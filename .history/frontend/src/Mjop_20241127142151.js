// FullTaskManager.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { format, addMonths, differenceInYears } from 'date-fns';
import { useMjopContext } from './MjopContext';
import Sidebar from './Sidebar';
import TaskTimeline from './TaskTimeline';
import TaskGroupDialog from './TaskGroupDialog';
import ElementInfoDialog from './ElementInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed

const FullTaskManager = () => {
  const {
    state,
    isDataLoaded,
    setGlobalElements,
    saveData,
    addOfferGroup,
    editOfferGroup,
    deleteOfferGroup,
  } = useMjopContext();

  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null); // 'add' or 'edit'
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

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: yearRange }, (_, i) => startYear + i),
    [startYear, yearRange]
  );

  // Mapping of groupId to group for easy lookup
  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  // Categorize elements per category and space
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

  // Handler for element selection
  const toggleElementSelection = useCallback(
    (category, elementId) => {
      setSelectedElementsByCategory((prev) => {
        const selected = prev[category] || [];
        const isSelected = selected.includes(elementId);
        const updatedSelected = isSelected
          ? selected.filter((id) => id !== elementId)
          : [...selected, elementId];
        return { ...prev, [category]: updatedSelected };
      });
    },
    []
  );

  // Handler for 'Select All' toggle
  const toggleSelectAll = useCallback(
    (category) => {
      const allElementIds = Object.values(categorizedElements[category] || {})
        .flat()
        .map((el) => el.id);
      const selected = selectedElementsByCategory[category] || [];
      const isAllSelected = selected.length === allElementIds.length;

      setSelectedElementsByCategory((prev) => ({
        ...prev,
        [category]: isAllSelected ? [] : allElementIds,
      }));
    },
    [categorizedElements, selectedElementsByCategory]
  );

  // Open Add Task dialog for a category
  const openAddDialog = useCallback(
    (category) => {
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
    },
    [selectedElementsByCategory, state.globalElements, state.globalSpaces]
  );

  // Open Edit Task dialog for a specific task group
  const openEditDialog = useCallback(
    (group) => {
      // Prepare element names and spaces for display in the dialog
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
        totalSquareMeters: parseFloat(group.totalSquareMeters), // Ensure it's a number
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
    },
    [state.globalSpaces]
  );

  // Add or update task group
  const addOrUpdateTaskGroup = useCallback(() => {
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
      elementNames,
      elementSpaces,
    } = taskProperties;

    if (dialogMode === 'add') {
      if (periodic) {
        // **Handle Periodic Task Group Addition**

        // Validation of input fields
        if (!periodicityMonths || periodicityMonths <= 0 || isNaN(periodicityMonths)) { // FIX: Check for NaN
          setSnackbarMessage('Voer een geldige periodiciteit in maanden in!');
          setSnackbarOpen(true);
          return;
        }
        if (!totalYears || totalYears <= 0 || isNaN(totalYears)) { // FIX: Check for NaN
          setSnackbarMessage('Voer een geldig aantal totale jaren in!');
          setSnackbarOpen(true);
          return;
        }
        if (indexation && (!indexationRate || indexationRate < 0 || isNaN(indexationRate))) { // FIX: Check for NaN
          setSnackbarMessage('Voer een geldige indexatievoet in!');
          setSnackbarOpen(true);
          return;
        }

        // Calculate total number of periods
        const totalPeriods = Math.floor(
          (Number(totalYears) * 12) / Number(periodicityMonths)
        );
        const indexRate = indexation ? Number(indexationRate) / 100 : 0;

        const newTaskGroups = [];
        const newOfferGroups = [];
        const tasksByElementId = {};

        for (let i = 0; i < totalPeriods; i++) {
          // Calculate the date for this period
          const periodDate = addMonths(new Date(groupDate), i * Number(periodicityMonths));

          // Calculate the cost with indexation
          const fullYearsElapsed = differenceInYears(periodDate, new Date(groupDate));
          const adjustedCost = indexation
            ? parseFloat((Number(cost) * Math.pow(1 + indexRate, fullYearsElapsed)).toFixed(2))
            : parseFloat(Number(cost).toFixed(2));

          selectedElementIds.forEach((elementId) => {
            const element = state.globalElements.find((el) => el.id === elementId);
            if (!element) return;

            const groupId = uuidv4();
            const offerGroupId = uuidv4();

            // Create a new task group for this element and this period
            const newTaskGroup = {
              id: groupId,
              name: `${name} - Period ${i + 1} - ${element.name}`,
              groupDate: periodDate,
              cost: adjustedCost,
              amount: Number(amount), // FIX: Ensure it's a number
              duration,
              totalSquareMeters: parseFloat(Number(totalSquareMeters).toFixed(2)), // FIX: Ensure it's a number
              urgency: Number(urgency), // FIX: Ensure it's a number
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
                    ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
                    : 0,
                  endDate: periodDate,
                  offerGroupId,
                },
              ],
            };

            newTaskGroups.push(newTaskGroup);

            // Create a new offerGroup for this element and this period
            const newOfferGroup = {
              offerGroupId,
              invoicePrice: "",
              offerPrice: "",
              estimatedValue: assignPricesIndividually
                ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
                : parseFloat(Number(cost).toFixed(2)),
              name: `Offertegroep ${i + 1} - ${element.name}`,
              offerAccepted: false,
              groupWorkDate: format(periodDate, 'yyyy-MM-dd'),
            };

            newOfferGroups.push(newOfferGroup);

            // Create a new task and add it to the specific element
            const newTask = {
              id: uuidv4(),
              name: `${name} - Period ${i + 1} - ${element.name}`,
              description: element.description || '',
              endDate: periodDate,
              cost: assignPricesIndividually
                ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
                : parseFloat(Number(cost).toFixed(2)),
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

            // Collect tasks per element
            if (!tasksByElementId[elementId]) {
              tasksByElementId[elementId] = [];
            }
            tasksByElementId[elementId].push(newTask);
          });
        }

        // Update globalElements after collecting all tasks
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

        // Add all new task groups and offerGroups to the state
        setTaskGroups((prev) => [...prev, ...newTaskGroups]);
        newOfferGroups.forEach((og) => addOfferGroup(og));

        // Clear selections and close dialog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Periodieke taakgroepen succesvol toegevoegd!');
        setSnackbarOpen(true);
      } else {
        // **Handle Non-Periodic Task Group Addition**

        // Validation
        if (!groupDate || isNaN(new Date(groupDate).getTime())) { // FIX: Check for valid date
          setSnackbarMessage('Voer een geldige datum in!');
          setSnackbarOpen(true);
          return;
        }

        if (amount <= 0 || isNaN(amount)) { // FIX: Check for valid number
          setSnackbarMessage('Voer een geldige hoeveelheid in!');
          setSnackbarOpen(true);
          return;
        }

        // Initialize Arrays to Collect New Task Groups and Offer Groups
        const newTaskGroups = [];
        const newOfferGroups = [];
        const tasksByElementId = {};

        selectedElementIds.forEach((elementId) => {
          const element = state.globalElements.find((el) => el.id === elementId);
          if (!element) return;

          const groupId = uuidv4();
          const offerGroupId = uuidv4();

          // Create a new task group for this element
          const newTaskGroup = {
            id: groupId,
            name: `${name} - ${element.name}`,
            groupDate: groupDate,
            cost: parseFloat(cost),
            amount: Number(amount), // FIX: Ensure it's a number
            duration,
            totalSquareMeters: parseFloat(Number(totalSquareMeters).toFixed(2)), // FIX: Ensure it's a number
            urgency: Number(urgency), // FIX: Ensure it's a number
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
                  ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
                  : 0,
                endDate: groupDate,
                offerGroupId,
              },
            ],
          };

          newTaskGroups.push(newTaskGroup);

          // Create a new offerGroup for this element
          const newOfferGroup = {
            offerGroupId,
            invoicePrice: "",
            offerPrice: "",
            estimatedValue: assignPricesIndividually
              ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
              : parseFloat(Number(cost).toFixed(2)),
            name: `Offertegroep - ${element.name}`,
            offerAccepted: false,
            groupWorkDate: format(groupDate, 'yyyy-MM-dd'),
          };

          newOfferGroups.push(newOfferGroup);

          // Create a new task and add it to the specific element
          const newTask = {
            id: uuidv4(),
            name: `${name} - ${element.name}`,
            description: element.description || '',
            endDate: groupDate,
            cost: assignPricesIndividually
              ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
              : parseFloat(Number(cost).toFixed(2)),
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

          // Collect tasks per element
          if (!tasksByElementId[elementId]) {
            tasksByElementId[elementId] = [];
          }
          tasksByElementId[elementId].push(newTask);
        });

        // Update globalElements after collecting all tasks
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

        // Add all new task groups and offerGroups to the state
        setTaskGroups((prev) => [...prev, ...newTaskGroups]);
        newOfferGroups.forEach((og) => addOfferGroup(og));

        // Clear selections and close dialog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Taakgroepen succesvol toegevoegd!');
        setSnackbarOpen(true);
      }, [
        dialogMode,
        taskProperties,
        state.globalElements,
        addOfferGroup,
        setGlobalElements,
        currentCategory,
        state.globalSpaces,
        // Removed state.globalDocuments as it's unused
      ]);

    // Handle Edit Task Group
    const editTaskGroup = useCallback(() => {
      const {
        id,
        name,
        groupDate,
        cost,
        amount,
        duration,
        totalSquareMeters,
        urgency,
        assignPricesIndividually,
        individualCosts,
        selectedElementIds,
        elementNames,
        elementSpaces,
      } = taskProperties;

      if (!id) {
        setSnackbarMessage('Geen taakgroep geselecteerd om te bewerken.');
        setSnackbarOpen(true);
        return;
      }

      // Validation
      if (!groupDate || isNaN(new Date(groupDate).getTime())) { // FIX: Check for valid date
        setSnackbarMessage('Voer een geldige datum in!');
        setSnackbarOpen(true);
        return;
      }

      if (amount <= 0 || isNaN(amount)) { // FIX: Check for valid number
        setSnackbarMessage('Voer een geldige hoeveelheid in!');
        setSnackbarOpen(true);
        return;
      }

      // Initialize arrays to collect updated task groups and offer groups
      const updatedTaskGroups = [];
      const updatedOfferGroups = [];
      const updatedTasksByElementId = {};

      selectedElementIds.forEach((elementId) => {
        const element = state.globalElements.find((el) => el.id === elementId);
        if (!element) return;

        // Find the existing task group
        const existingTaskGroup = taskGroups.find((tg) => tg.id === id);
        if (!existingTaskGroup) return;

        // Find the subtask related to this element
        const existingSubtask = existingTaskGroup.subtasks.find(
          (st) => st.id === elementId
        );
        if (!existingSubtask) return;

        // Update offer group details
        const existingOfferGroup = state.globalOfferGroups.find(
          (og) => og.offerGroupId === existingSubtask.offerGroupId
        );
        if (!existingOfferGroup) return;

        const updatedOfferGroup = {
          ...existingOfferGroup,
          estimatedValue: assignPricesIndividually
            ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
            : parseFloat(Number(cost).toFixed(2)),
          name: `Offertegroep - ${element.name}`,
          groupWorkDate: format(new Date(groupDate), 'yyyy-MM-dd'),
        };

        updatedOfferGroups.push(updatedOfferGroup);

        // Update task group details
        const updatedTaskGroup = {
          ...existingTaskGroup,
          name: `${name} - ${element.name}`,
          groupDate: groupDate,
          cost: parseFloat(cost),
          amount: Number(amount), // FIX: Ensure it's a number
          duration,
          totalSquareMeters: parseFloat(Number(totalSquareMeters).toFixed(2)), // FIX: Ensure it's a number
          urgency: Number(urgency), // FIX: Ensure it's a number
          assignPricesIndividually,
          subtasks: [
            {
              ...existingSubtask,
              individualCost: assignPricesIndividually
                ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
                : 0,
              endDate: new Date(groupDate),
              offerGroupId: updatedOfferGroup.offerGroupId,
            },
          ],
        };

        updatedTaskGroups.push(updatedTaskGroup);

        // Update the task
        const existingTask = state.globalElements
          .find((el) => el.id === elementId)
          .tasks.find((t) => t.groupId === id);

        if (existingTask) {
          const updatedTask = {
            ...existingTask,
            name: `${name} - ${element.name}`,
            endDate: new Date(groupDate),
            cost: assignPricesIndividually
              ? parseFloat((Number(individualCosts[elementId]) || 0).toFixed(2))
              : parseFloat(Number(cost).toFixed(2)),
          };

          if (!updatedTasksByElementId[elementId]) {
            updatedTasksByElementId[elementId] = [];
          }
          updatedTasksByElementId[elementId].push(updatedTask);
        }
      });

      // Update globalElements with updated tasks
      const updatedGlobalElements = state.globalElements.map((el) => {
        if (updatedTasksByElementId[el.id]) {
          return {
            ...el,
            tasks: el.tasks.map((task) =>
              task.groupId === id
                ? updatedTasksByElementId[el.id].find((t) => t.id === task.id) || task
                : task
            ),
          };
        }
        return el;
      });

      setGlobalElements(updatedGlobalElements);

      // Update task groups
      setTaskGroups((prevGroups) =>
        prevGroups.map((tg) =>
          tg.id === id
            ? updatedTaskGroups.find((utg) => utg.id === tg.id) || tg
            : tg
        )
      );

      // Update offer groups
      updatedOfferGroups.forEach((og) => editOfferGroup(og));

      // Clear selections and close dialog
      setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
      setDialogMode(null);
      setSnackbarMessage('Taakgroep succesvol bijgewerkt!');
      setSnackbarOpen(true);
    }, [
      taskProperties,
      state.globalElements,
      state.globalOfferGroups,
      taskGroups,
      editOfferGroup,
      setGlobalElements,
      currentCategory,
    ]);

    // Unified handler for adding and editing task groups
    const addOrUpdateTaskGroupHandler = useCallback(() => {
      if (dialogMode === 'add') {
        addOrUpdateTaskGroup();
      } else if (dialogMode === 'edit') {
        editTaskGroup();
      }
    }, [dialogMode, addOrUpdateTaskGroup, editTaskGroup]);

    // Function to delete a task group
    const handleDeleteTaskGroup = useCallback(() => {
      const { id, name } = taskProperties;
      if (!id) {
        setSnackbarMessage('Geen taakgroep geselecteerd om te verwijderen.');
        setSnackbarOpen(true);
        return;
      }

      // Remove the task group from state
      setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));

      // Remove the corresponding offerGroups
      const offerGroupsToDelete = taskGroups
        .find((group) => group.id === id)
        ?.subtasks.map((subtask) => subtask.offerGroupId) || [];

      offerGroupsToDelete.forEach((offerGroupId) => {
        deleteOfferGroup(offerGroupId);
      });

      // Update globalElements by removing groupId and offerGroupId from tasks
      const updatedGlobalElements = state.globalElements.map((element) => {
        if (element.tasks && element.tasks.length > 0) {
          const updatedTasks = element.tasks.map((task) => {
            if (task.groupId === id) {
              const { groupId, offerGroupId, ...rest } = task;
              return rest;
            }
            return task;
          });
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
    }, [taskProperties, deleteOfferGroup, state.globalElements, taskGroups]);

    // Fetch task groups per year for the timeline
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

    // Calculate total costs per year
    const totalCostPerYear = useMemo(() => {
      const costPerYear = {};
      taskGroups.forEach((group) => {
        const year = group.groupDate ? new Date(group.groupDate).getFullYear() : null;
        if (year) {
          costPerYear[year] = (costPerYear[year] || 0) + parseFloat(group.cost);
        }
      });
      // Round total costs per year to 2 decimal places
      Object.keys(costPerYear).forEach((year) => {
        costPerYear[year] = parseFloat(costPerYear[year].toFixed(2));
      });
      return costPerYear;
    }, [taskGroups]);

    // Handler to open Element Info Dialog
    const handleOpenInfoDialog = useCallback((element) => {
      setCurrentElementInfo(element);
      setInfoDialogOpen(true);
    }, []);

    // Handler to close Element Info Dialog
    const handleCloseInfoDialog = useCallback(() => {
      setInfoDialogOpen(false);
      setCurrentElementInfo(null);
    }, []);

    // Handler to call saveData
    const handleSaveData = useCallback(async () => {
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
    }, [saveData, state.success]);

    // Effect to handle success and error messages from context
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

    // **Data Loading Check**
    // Ensure that data is loaded before rendering the component
    if (!isDataLoaded) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#f4f6f8', p: 3 }}>
        <Grid container spacing={4} sx={{ height: '100%' }}>
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

          {/* Main Panel */}
          <Grid item xs={12} md={8}>
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

            {/* Task Timeline */}
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
          onSubmit={addOrUpdateTaskGroupHandler}
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

        {/* Snackbar for feedback messages */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={state.errors.general ? 'error' : state.success ? 'success' : 'info'}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  };

  export default FullTaskManager;
