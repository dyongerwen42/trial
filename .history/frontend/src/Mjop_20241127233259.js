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
import { v4 as uuidv4 } from 'uuid'; // Zorg ervoor dat uuid is geïnstalleerd via npm of yarn

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
  const [dialogMode, setDialogMode] = useState(null); // 'add' of 'edit'
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

  // State voor Element Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  // State voor Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: yearRange }, (_, i) => startYear + i),
    [startYear, yearRange]
  );

  // Mapping van groupId naar group voor gemakkelijke toegang
  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  // Categoriseer elementen per categorie en ruimte
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

  // Handler voor element selectie
  const toggleElementSelection = useCallback((category, elementId) => {
    setSelectedElementsByCategory((prev) => {
      const selected = prev[category] || [];
      const isSelected = selected.includes(elementId);
      const updatedSelected = isSelected
        ? selected.filter((id) => id !== elementId)
        : [...selected, elementId];
      return { ...prev, [category]: updatedSelected };
    });
  }, []);

  // Handler voor 'Select All' toggle
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

  // Open Add Task dialog voor een categorie
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

      // Bereid elementnamen en ruimtes voor weergave in de dialoog
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

  // Open Edit Task dialog voor een specifieke task group
  const openEditDialog = useCallback(
    (group) => {
      // Bereid elementnamen en ruimtes voor weergave in de dialoog
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
        totalSquareMeters: parseFloat(group.totalSquareMeters), // Zorg dat het een nummer is
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

  // Voeg een task group toe of werk deze bij
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
        // **Behandel Periodieke Task Group Toevoeging**

        // Validatie van invoervelden}
        if (!periodicityMonths || periodicityMonths <= 0 || isNaN(periodicityMonths)) {
          setSnackbarMessage('Voer een geldige periodiciteit in maanden in!');
          setSnackbarOpen(true);
          return;
        }
        if (!totalYears || totalYears <= 0 || isNaN(totalYears)) {
          setSnackbarMessage('Voer een geldig aantal totale jaren in!');
          setSnackbarOpen(true);
          return;
        }
        if (indexation && (!indexationRate || indexationRate < 0 || isNaN(indexationRate))) {
          setSnackbarMessage('Voer een geldige indexatievoet in!');
          setSnackbarOpen(true);
          return;
        }

        // Bereken het totale aantal perioden
        const totalPeriods = Math.floor((Number(totalYears) * 12) / Number(periodicityMonths));
        const indexRate = indexation ? Number(indexationRate) / 100 : 0;

        const newTaskGroups = [];
        const newOfferGroups = [];
        const tasksByElementId = {};

        for (let i = 0; i < totalPeriods; i++) {
          // Bereken de datum voor deze periode
          const periodDate = addMonths(new Date(groupDate), i * Number(periodicityMonths));

          // Bereken de kosten met indexatie
          const fullYearsElapsed = differenceInYears(periodDate, new Date(groupDate));
          const adjustedCost = indexation
            ? parseFloat((Number(cost) * Math.pow(1 + indexRate, fullYearsElapsed)).toFixed(2))
            : parseFloat(Number(cost).toFixed(2));

          selectedElementIds.forEach((elementId) => {
            const element = state.globalElements.find((el) => el.id === elementId);
            if (!element) return;

            const groupId = uuidv4();
            const offerGroupId = uuidv4();

            // Maak een nieuwe task group voor dit element en deze periode
            const newTaskGroup = {
              id: groupId,
              name: `${name} - Periode ${i + 1} - ${element.name}`,
              groupDate: periodDate,
              cost: adjustedCost,
              amount: Number(amount), // Zorg dat het een nummer is
              duration,
              totalSquareMeters: parseFloat(Number(totalSquareMeters).toFixed(2)), // Zorg dat het een nummer is
              urgency: Number(urgency), // Zorg dat het een nummer is
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

            // Maak een nieuwe offerGroup voor dit element en deze periode
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

            // Maak een nieuwe task en voeg deze toe aan het specifieke element
            const newTask = {
              id: uuidv4(),
              name: `${name} - Periode ${i + 1} - ${element.name}`,
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

            // Verzamel tasks per element
            if (!tasksByElementId[elementId]) {
              tasksByElementId[elementId] = [];
            }
            tasksByElementId[elementId].push(newTask);
          });
        }

        // Werk globalElements bij na het verzamelen van alle tasks
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

        // Voeg alle nieuwe task groups en offerGroups toe aan de state
        setTaskGroups((prev) => [...prev, ...newTaskGroups]);
        newOfferGroups.forEach((og) => addOfferGroup(og));

        // Wis selecties en sluit de dialoog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Periodieke taakgroepen succesvol toegevoegd!');
        setSnackbarOpen(true);
      } else {
        // **Behandel Niet-Periodieke Task Group Toevoeging**

        // Validatie
        if (!groupDate || isNaN(new Date(groupDate).getTime())) { // FIX: Controleer op geldige datum
          setSnackbarMessage('Voer een geldige datum in!');
          setSnackbarOpen(true);
          return;
        }

        if (amount <= 0 || isNaN(amount)) { // FIX: Controleer op geldig nummer
          setSnackbarMessage('Voer een geldige hoeveelheid in!');
          setSnackbarOpen(true);
          return;
        }

        // Initialiseer arrays om nieuwe task groups en offer groups te verzamelen
        const newTaskGroups = [];
        const newOfferGroups = [];
        const tasksByElementId = {};

        selectedElementIds.forEach((elementId) => {
          const element = state.globalElements.find((el) => el.id === elementId);
          if (!element) return;

          const groupId = uuidv4();
          const offerGroupId = uuidv4();

          // Maak een nieuwe task group voor dit element
          const newTaskGroup = {
            id: groupId,
            name: `${name} - ${element.name}`,
            groupDate: groupDate,
            cost: parseFloat(cost),
            amount: Number(amount), // FIX: Zorg dat het een nummer is
            duration,
            totalSquareMeters: parseFloat(Number(totalSquareMeters).toFixed(2)), // FIX: Zorg dat het een nummer is
            urgency: Number(urgency), // FIX: Zorg dat het een nummer is
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

          // Maak een nieuwe offerGroup voor dit element
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

          // Maak een nieuwe task en voeg deze toe aan het specifieke element
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

          // Verzamel tasks per element
          if (!tasksByElementId[elementId]) {
            tasksByElementId[elementId] = [];
          }
          tasksByElementId[elementId].push(newTask);
        });

        // Werk globalElements bij na het verzamelen van alle tasks
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

        // Voeg alle nieuwe task groups en offerGroups toe aan de state
        setTaskGroups((prev) => [...prev, ...newTaskGroups]);
        newOfferGroups.forEach((og) => addOfferGroup(og));

        // Wis selecties en sluit de dialoog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Taakgroepen succesvol toegevoegd!');
        setSnackbarOpen(true);
      }
    }, [
      dialogMode,
      taskProperties,
      state.globalElements,
      addOfferGroup,
      setGlobalElements,
      currentCategory,
      state.globalSpaces,
      // Verwijderde state.globalDocuments aangezien deze niet wordt gebruikt
    ]);

  // Behandel Edit Task Group
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

    // Validatie
    if (!groupDate || isNaN(new Date(groupDate).getTime())) { // FIX: Controleer op geldige datum
      setSnackbarMessage('Voer een geldige datum in!');
      setSnackbarOpen(true);
      return;
    }

    if (amount <= 0 || isNaN(amount)) { // FIX: Controleer op geldig nummer
      setSnackbarMessage('Voer een geldige hoeveelheid in!');
      setSnackbarOpen(true);
      return;
    }

    // Vind de bestaande task group
    const existingTaskGroup = taskGroups.find((tg) => tg.id === id);
    if (!existingTaskGroup) {
      setSnackbarMessage('Taakgroep niet gevonden.');
      setSnackbarOpen(true);
      return;
    }

    // Vind elementen om te verwijderen (gedeselecteerd)
    const previousElementIds = existingTaskGroup.subtasks.map((st) => st.id);
    const elementsToRemove = previousElementIds.filter((id) => !selectedElementIds.includes(id));

    // Verwijder task groups en offer groups voor gedeselecteerde elementen
    elementsToRemove.forEach((elementId) => {
      const subtask = existingTaskGroup.subtasks.find((st) => st.id === elementId);
      if (subtask) {
        // Verwijder offer group
        deleteOfferGroup(subtask.offerGroupId);

        // Verwijder task uit globalElements
        setGlobalElements((prevElements) =>
          prevElements.map((el) => {
            if (el.id === elementId) {
              return {
                ...el,
                tasks: el.tasks.filter((task) => task.groupId !== id),
              };
            }
            return el;
          })
        );

        // Verwijder de task group
        setTaskGroups((prevGroups) => prevGroups.filter((tg) => tg.id !== id));
      }
    });

    // Initialiseer arrays om bijgewerkte task groups en offer groups te verzamelen
    const updatedTaskGroups = [];
    const updatedOfferGroups = [];
    const updatedTasksByElementId = {};

    selectedElementIds.forEach((elementId) => {
      const element = state.globalElements.find((el) => el.id === elementId);
      if (!element) return;

      // Vind de bestaande subtask
      const existingSubtask = existingTaskGroup.subtasks.find((st) => st.id === elementId);

      if (existingSubtask) {
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
          amount: Number(amount), // FIX: Zorg dat het een nummer is
          duration,
          totalSquareMeters: parseFloat(Number(totalSquareMeters).toFixed(2)), // FIX: Zorg dat het een nummer is
          urgency: Number(urgency), // FIX: Zorg dat het een nummer is
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

        // Update de task
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
      } else {
        // Behandel nieuwe elementen toegevoegd tijdens bewerking
        const groupId = uuidv4();
        const offerGroupId = uuidv4();

        const newTaskGroup = {
          id: groupId,
          name: `${name} - ${element.name}`,
          groupDate: groupDate,
          cost: parseFloat(cost),
          amount: Number(amount),
          duration,
          totalSquareMeters: parseFloat(Number(totalSquareMeters).toFixed(2)),
          urgency: Number(urgency),
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

        updatedTaskGroups.push(newTaskGroup);

        // Maak een nieuwe offerGroup voor dit element
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

        updatedOfferGroups.push(newOfferGroup);

        // Maak een nieuwe task en voeg deze toe aan het specifieke element
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

        // Verzamel tasks per element
        if (!updatedTasksByElementId[elementId]) {
          updatedTasksByElementId[elementId] = [];
        }
        updatedTasksByElementId[elementId].push(newTask);
      }
    });

    // Werk globalElements bij met bijgewerkte tasks
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

    // Werk task groups bij
    setTaskGroups((prevGroups) =>
      prevGroups.map((tg) =>
        tg.id === id
          ? updatedTaskGroups.find((utg) => utg.id === tg.id) || tg
          : tg
      )
    );

    // Voeg nieuwe task groups en offer groups toe
    updatedTaskGroups.forEach((utg) => {
      setTaskGroups((prev) => [...prev, utg]);
    });
    updatedOfferGroups.forEach((og) => editOfferGroup(og));

    // Wis selecties en sluit de dialoog
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

  // Gecombineerde handler voor toevoegen en bewerken van task groups
  const addOrUpdateTaskGroupHandler = useCallback(() => {
    if (dialogMode === 'add') {
      addOrUpdateTaskGroup();
    } else if (dialogMode === 'edit') {
      editTaskGroup();
    }
  }, [dialogMode, addOrUpdateTaskGroup, editTaskGroup]);

  // Functie om een task group te verwijderen
  const handleDeleteTaskGroup = useCallback(() => {
    const { id, name } = taskProperties;
    if (!id) {
      setSnackbarMessage('Geen taakgroep geselecteerd om te verwijderen.');
      setSnackbarOpen(true);
      return;
    }

    // Vind de groep die verwijderd moet worden voordat deze wordt verwijderd
    const groupToDelete = taskGroups.find((group) => group.id === id);
    if (!groupToDelete) {
      setSnackbarMessage('Taakgroep niet gevonden.');
      setSnackbarOpen(true);
      return;
    }

    // Verwijder de task group uit de state
    setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));

    // Verwijder de bijbehorende offerGroups
    const offerGroupsToDelete = groupToDelete.subtasks.map((subtask) => subtask.offerGroupId);

    offerGroupsToDelete.forEach((offerGroupId) => {
      deleteOfferGroup(offerGroupId);
    });

    // Werk globalElements bij door groupId en offerGroupId uit tasks te verwijderen
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

    // Sluit dialogen en toon succesbericht
    setDeleteConfirmOpen(false);
    setDialogMode(null);
    setSnackbarMessage(`Taakgroep "${name}" succesvol verwijderd!`);
    setSnackbarOpen(true);
  }, [taskProperties, deleteOfferGroup, state.globalElements, taskGroups]);

  // Haal task groups per jaar op voor de timeline
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

  // Bereken totale kosten per jaar
  const totalCostPerYear = useMemo(() => {
    const costPerYear = {};
    taskGroups.forEach((group) => {
      const year = group.groupDate ? new Date(group.groupDate).getFullYear() : null;
      if (year) {
        costPerYear[year] = (costPerYear[year] || 0) + parseFloat(group.cost);
      }
    });
    // Rond totale kosten per jaar af op 2 decimalen
    Object.keys(costPerYear).forEach((year) => {
      costPerYear[year] = parseFloat(costPerYear[year].toFixed(2));
    });
    return costPerYear;
  }, [taskGroups]);

  // Handler om Element Info Dialog te openen
  const handleOpenInfoDialog = useCallback((element) => {
    setCurrentElementInfo(element);
    setInfoDialogOpen(true);
  }, []);

  // Handler om Element Info Dialog te sluiten
  const handleCloseInfoDialog = useCallback(() => {
    setInfoDialogOpen(false);
    setCurrentElementInfo(null);
  }, []);

  // Handler om saveData aan te roepen
  const handleSaveData = useCallback(async () => {
    try {
      await saveData();
      if (state.success) {
        setSnackbarMessage(state.success);
      } else {
        setSnackbarMessage('Data succesvol opgeslagen.');
      }
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Opslaan mislukt. Probeer het alstublieft opnieuw.');
      setSnackbarOpen(true);
    }
  }, [saveData, state.success]);

  // Effect om succes- en foutberichten van context te behandelen
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

  // **Controle op Data Laden**
  // Zorg ervoor dat data is geladen voordat het component wordt gerenderd
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
          {/* Header met Save Button */}
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
              aria-label="Opslaan van Task Data"
            >
              {state.isSaving ? 'Opslaan...' : 'Opslaan'}
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

      {/* Gecombineerde Add/Edit Task Group Dialoog */}
      <TaskGroupDialog
        open={dialogMode === 'add' || dialogMode === 'edit'}
        mode={dialogMode}
        onClose={() => setDialogMode(null)}
        taskProperties={taskProperties}
        setTaskProperties={setTaskProperties}
        onSubmit={addOrUpdateTaskGroupHandler}
        onDelete={() => setDeleteConfirmOpen(true)} // Open delete bevestiging
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
