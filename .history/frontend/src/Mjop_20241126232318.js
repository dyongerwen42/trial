// FullTaskManager.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Snackbar,
  Alert,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';
import { format, addMonths, differenceInYears } from 'date-fns';

// Import custom components
import Sidebar from './Sidebar';
import TaskGroupDialog from './TaskGroupDialog';
import ElementInfoDialog from './ElementInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import TaskTimeline from './TaskTimeline'; // Nieuwe import

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state,
    setGlobalElements,
    saveData,
    addOfferGroup,
    editOfferGroup,
    deleteOfferGroup,
  } = useMjopContext();

  // Local state variables
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    id: null,
    name: '',
    groupDate: new Date(),
    cost: 0,
    amount: 0, // Time per task group in months
    duration: 'days',
    totalSquareMeters: 0,
    urgency: 1, // Default urgency set to 1
    periodic: false,
    periodicityMonths: '',
    totalYears: '',
    indexation: false,
    indexationRate: '',
    assignPricesIndividually: false,
    individualCosts: {},
    selectedElementIds: [],
    // Additional properties for element names and spaces
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
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Mapping of groupId to group for easy lookup
  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  // Categorizing elements per category and space
  const categorizedElements = useMemo(() => {
    return state.globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      const spaceName =
        state.globalSpaces.find((space) => space.id === element.spaceId)?.name ||
        'Unknown Space';

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

  // Handler for 'Select All' toggle
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
      setSnackbarMessage('Select at least one element to add tasks!');
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
          'Unknown Space';
      }
    });

    setDialogMode('add');
    setCurrentCategory(category);
    setTaskProperties({
      id: null,
      name: category,
      groupDate: new Date(),
      cost: 0,
      amount: 0, // Time per task group in months
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

  // Open Edit Task dialog for a specific task group
  const openEditDialog = (group) => {
    // Prepare element names and spaces for display in the dialog
    const elementNames = {};
    const elementSpaces = {};
    group.subtasks.forEach((subtask) => {
      elementNames[subtask.id] = subtask.name;
      elementSpaces[subtask.id] =
        state.globalSpaces.find((space) => space.id === subtask.spaceId)?.name ||
        'Unknown Space';
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

  // Add or update task group
  const addOrUpdateTaskGroup = useCallback(() => {
    const {
      id,
      name,
      groupDate,
      cost,
      amount, // Time per task group in months
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
        // Validate input fields
        if (!periodicityMonths || periodicityMonths <= 0) {
          setSnackbarMessage('Please enter a valid periodicity in months!');
          setSnackbarOpen(true);
          return;
        }
        if (!totalYears || totalYears <= 0) {
          setSnackbarMessage('Please enter a valid total number of years!');
          setSnackbarOpen(true);
          return;
        }
        if (indexation && (!indexationRate || indexationRate < 0)) {
          setSnackbarMessage('Please enter a valid indexation rate!');
          setSnackbarOpen(true);
          return;
        }

        // Calculate the total number of periods
        const totalPeriods = Math.floor(
          (parseInt(totalYears, 10) * 12) / parseInt(periodicityMonths, 10)
        );
        const indexRate = indexation ? parseFloat(indexationRate) / 100 : 0;

        const newTaskGroups = [];
        const newOfferGroups = [];
        const tasksByElementId = {}; // Collect tasks per element

        for (let i = 0; i < totalPeriods; i++) {
          // Calculate the date for this period
          const periodDate = addMonths(new Date(groupDate), i * parseInt(periodicityMonths, 10));

          // Calculate the costs with indexation
          const fullYearsElapsed = differenceInYears(periodDate, new Date(groupDate));
          const adjustedCost = indexation
            ? parseFloat((parseFloat(cost) * Math.pow(1 + indexRate, fullYearsElapsed)).toFixed(2))
            : parseFloat(parseFloat(cost).toFixed(2));

          selectedElementIds.forEach((elementId) => {
            const element = state.globalElements.find((el) => el.id === elementId);
            if (!element) return;

            const groupId = uuidv4();
            const offerGroupId = uuidv4(); // Unique ID for each offerGroup

            // Create a new task group for this element and period
            const newTaskGroup = {
              id: groupId,
              name: `${name} - Period ${i + 1} - ${element.name}`,
              groupDate: periodDate,
              cost: adjustedCost,
              amount: parseInt(amount, 10),
              duration,
              totalSquareMeters: parseFloat(totalSquareMeters).toFixed(2),
              urgency: parseInt(urgency, 10),
              periodic: false, // Individual task groups are not periodic
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
                  offerGroupId, // Link to offerGroup
                },
              ],
            };

            newTaskGroups.push(newTaskGroup);

            // Create a new offerGroup for this element and period
            const newOfferGroup = {
              offerGroupId: offerGroupId,
              invoicePrice: "",
              offerPrice: "",
              estimatedValue: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : parseFloat(cost.toFixed(2)),
              name: `Offer Group ${i + 1} - ${element.name}`,
              offerAccepted: false,
              groupWorkDate: format(periodDate, 'yyyy-MM-dd'), // Use format here
            };

            newOfferGroups.push(newOfferGroup);

            // Create a new task and add it to the specific element
            const newTask = {
              id: uuidv4(),
              name: `${name} - Period ${i + 1} - ${element.name}`,
              description: element.description || '',
              endDate: new Date(periodDate),
              cost: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : parseFloat(parseFloat(cost).toFixed(2)),
              isGrouped: true,
              elementName: element.name,
              groupId: groupId,
              offerGroupId: offerGroupId, // Link to offerGroup
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
        setSnackbarMessage('Periodic task groups added successfully!');
        setSnackbarOpen(true);
      } else {
        // Non-periodic: Create one task group
        // Validate input fields
        if (amount <= 0) {
          setSnackbarMessage('Please enter a valid time in months!');
          setSnackbarOpen(true);
          return;
        }

        // Create tasks and update globalElements
        const updatedGlobalElements = state.globalElements.map((element) => {
          if (selectedElementIds.includes(element.id)) {
            // Set endDate to group date
            const endDate = new Date(groupDate);

            const newTask = {
              id: uuidv4(),
              name, // Task name from the dialog
              description: element.description || '',
              endDate,
              cost: assignPricesIndividually
                ? parseFloat((individualCosts[element.id] || 0).toFixed(2))
                : parseFloat(parseFloat(cost).toFixed(2)),
              isGrouped: true,
              elementName: element.name,
              groupId: null, // To be set later
              offerGroupId: null, // To be set later
            };
            // Ensure all properties are retained
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
        const offerGroupId = uuidv4(); // Unique ID for offerGroup

        const newTaskGroup = {
          id: groupId,
          name,
          groupDate: new Date(groupDate),
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
              offerGroupId: offerGroupId, // Link to offerGroup
            };
          }),
        };

        // Add new task group
        setTaskGroups((prev) => [...prev, newTaskGroup]);

        // Create a new offerGroup
        const newOfferGroup = {
          offerGroupId: offerGroupId,
          invoicePrice: "",
          offerPrice: "",
          estimatedValue: assignPricesIndividually
            ? selectedElementIds.reduce((sum, elId) => sum + parseFloat(individualCosts[elId] || 0), 0)
            : parseFloat(cost.toFixed(2)),
          name: `Offer Group - ${name}`,
          offerAccepted: false,
          groupWorkDate: format(new Date(groupDate), 'yyyy-MM-dd'), // Use format here
        };

        addOfferGroup(newOfferGroup);

        // Update tasks with groupId and offerGroupId
        const finalGlobalElements = updatedGlobalElements.map((element) => {
          if (selectedElementIds.includes(element.id)) {
            const updatedTasks = element.tasks.map((task) => ({
              ...task,
              groupId: task.groupId || groupId,
              offerGroupId: task.offerGroupId || offerGroupId,
            }));
            return { ...element, tasks: updatedTasks };
          }
          return element;
        });

        setGlobalElements(finalGlobalElements);

        // Clear selections and close dialog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Task group added successfully!');
        setSnackbarOpen(true);
      }
    }, [
      dialogMode,
      taskProperties,
      state.globalElements,
      addOfferGroup,
      currentCategory,
      setGlobalElements,
      state.globalSpaces,
      deleteOfferGroup,
      editOfferGroup,
      state.offerGroups,
      taskGroups,
    ]); // Correctly closed useCallback

  // Function to delete a task group
  const handleDeleteTaskGroup = () => {
    const { id, name, offerGroupId } = taskProperties;
    if (!id) return;

    // Remove the task group from state
    setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));

    // Remove the associated offerGroup
    if (offerGroupId) {
      deleteOfferGroup(offerGroupId);
    }

    // Update globalElements by removing groupId and offerGroupId from tasks
    const updatedGlobalElements = state.globalElements.map((element) => {
      if (element.tasks && element.tasks.length > 0) {
        const updatedTasks = element.tasks.map((task) => {
          if (task.groupId === id) {
            const { groupId, offerGroupId, ...rest } = task; // Remove groupId and offerGroupId
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
    setSnackbarMessage(`Task group "${name}" deleted successfully!`);
    setSnackbarOpen(true);
  };

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
  const handleOpenInfoDialog = (element) => {
    setCurrentElementInfo(element);
    setInfoDialogOpen(true);
  };

  // Handler to close Element Info Dialog
  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setCurrentElementInfo(null);
  };

  // Handler to call saveData
  const handleSaveData = async () => {
    try {
      await saveData();
      // Assuming saveData updates state.success or state.errors
      // If not, set a success message here
      if (state.success) {
        setSnackbarMessage(state.success);
      } else {
        setSnackbarMessage('Data saved successfully.');
      }
      setSnackbarOpen(true);
    } catch (error) {
      // Assuming saveData handles errors and sets state.errors
      // If not, set an error message here
      setSnackbarMessage('Failed to save data. Please try again.');
      setSnackbarOpen(true);
    }
  };

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

      {/* Snackbar for feedback messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={state.success ? 'success' : state.errors.general ? 'error' : 'info'}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
