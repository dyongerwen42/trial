import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { fetchMJOPData, saveMJOPData, calculateCurrentCash, getSaldoColor } from './dataHandling';
import validate from './validation';

const MjopContext = createContext();

export const useMjopContext = () => useContext(MjopContext);

const initialState = {
  generalInfo: {
    projectNumber: '',
    projectName: '',
    address: '',
    contactPerson: '',
    inspectionDate: '',
    propertyImage: null,
    opdrachtgeverNaam: '',
    opdrachtgeverAdres: '',
    opdrachtgeverPostcode: '',
    opdrachtgeverPlaats: '',
    opdrachtgeverTelefoon: '',
    opdrachtgeverEmail: '',
    inspecteur: '',
    inspectiedatum: '',
    opmerkingen: '',
  },
  cashInfo: {
    currentCash: 0,
    monthlyContribution: 0,
    reserveDate: new Date(),
    totalWorth: 0,
  },
  mjop: {},
  globalElements: [],
  globalSpaces: [],
  globalDocuments: [],
  offerGroups: [],
  isSaving: false,
  errors: {},
  success: null,
  tabErrors: {
    generalInfo: false,
    cashInfo: false,
    globalSpaces: false,
    globalElements: false,
    inspectionReport: false,
    planning: false,
    globalDocuments: false,
  },
  openErrorDialog: false,
  errorMessage: '',
};

const mjopReducer = (state, action) => {
  switch (action.type) {
    case 'SET_GENERAL_INFO':
      return { ...state, generalInfo: { ...state.generalInfo, ...action.payload } };
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_TAB_ERRORS':
      return { ...state, tabErrors: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'SET_ERROR_MESSAGE':
      return { ...state, errorMessage: action.payload, openErrorDialog: true };
    case 'ADD_GLOBAL_ELEMENT':
      return { ...state, globalElements: [...state.globalElements, action.payload] };
    case 'ADD_TASK':
      return {
        ...state,
        globalElements: state.globalElements.map((element) =>
          element.id === action.payload.elementId
            ? { ...element, tasks: [...(element.tasks || []), ...action.payload.tasks] }
            : element
        ),
      };
    case 'ADD_GLOBAL_SPACE':
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };
    case 'EDIT_GLOBAL_SPACE':
      return {
        ...state,
        globalSpaces: state.globalSpaces.map(space =>
          space.id === action.payload.id ? action.payload : space
        ),
      };
    case 'DELETE_GLOBAL_SPACE':
      return {
        ...state,
        globalSpaces: state.globalSpaces.filter(space => space.id !== action.payload),
      };
    default:
      return state;
  }
};

export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const logAction = useCallback((action, data) => {
    console.log(`[${new Date().toISOString()}] ${action}:`, JSON.stringify(data, null, 2));
  }, []);

  const setOfferGroups = useCallback((offerGroups) => {
    logAction("Setting Offer Groups", offerGroups);
    dispatch({ type: 'SET_DATA', payload: { offerGroups } });
  }, [logAction, dispatch]);

  const setGlobalElements = useCallback((globalElements) => {
    logAction("Setting Global Elements", globalElements);
    dispatch({ type: 'SET_DATA', payload: { globalElements } });
  }, [logAction, dispatch]);

  const setGlobalSpaces = useCallback((globalSpaces) => {
    logAction("Setting Global Spaces", globalSpaces);
    dispatch({ type: 'SET_DATA', payload: { globalSpaces } });
  }, [logAction, dispatch]);

  const setGeneralInfo = useCallback((updatedFields) => {
    logAction("Setting General Info", updatedFields);
    dispatch({ type: 'SET_GENERAL_INFO', payload: updatedFields });
  }, [logAction, dispatch]);

  const initializeData = useCallback(async (id) => {
    if (isDataLoaded) return;
    try {
      const data = await fetchMJOPData(id);
      const payload = {
        generalInfo: data.generalInfo || initialState.generalInfo,
        cashInfo: data.cashInfo || initialState.cashInfo,
        mjop: data.mjop || initialState.mjop,
        globalElements: Array.isArray(data.globalElements) ? data.globalElements : [],
        globalSpaces: Array.isArray(data.globalSpaces) ? data.globalSpaces : [],
        globalDocuments: Array.isArray(data.globalDocuments) ? data.globalDocuments : [],
        offerGroups: Array.isArray(data.offerGroups) ? data.offerGroups : [],
      };

      dispatch({ type: 'SET_DATA', payload });
      setIsDataLoaded(true);
    } catch (err) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Error fetching data' });
    }
  }, [dispatch, isDataLoaded]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('mjop-id');

    if (id && id !== mjopId) {
      setIsDataLoaded(false);
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData]);

  const handleValidation = useCallback(() => {
    const { newErrors, newTabErrors, isValid } = validate({
      generalInfo: state.generalInfo,
      cashInfo: state.cashInfo,
      totalWorth: state.cashInfo.totalWorth,
      globalElements: state.globalElements,
    });
    if (!isValid) {
      dispatch({ type: 'SET_ERRORS', payload: newErrors });
      dispatch({ type: 'SET_TAB_ERRORS', payload: newTabErrors });
    }
    return isValid;
  }, [state]);

  const saveData = useCallback(async () => {
    if (!handleValidation()) return;

    try {
      const formData = new FormData();
      formData.append('mjop', JSON.stringify(state.mjop));
      formData.append('generalInfo', JSON.stringify(state.generalInfo));
      formData.append('cashInfo', JSON.stringify(state.cashInfo));
      formData.append('globalElements', JSON.stringify(state.globalElements));
      formData.append('globalSpaces', JSON.stringify(state.globalSpaces));
      formData.append('globalDocuments', JSON.stringify(state.globalDocuments));
      formData.append('offerGroups', JSON.stringify(state.offerGroups));

      if (state.generalInfo.propertyImage && typeof state.generalInfo.propertyImage !== 'string') {
        formData.append('propertyImage', state.generalInfo.propertyImage);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true };
      await saveMJOPData(mjopId, formData, config);
      dispatch({ type: 'SET_SUCCESS', payload: 'Data saved successfully.' });
  
    } catch (err) {
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Error saving data' } });
    }
  }, [state, mjopId, navigate, handleValidation]);

  const calculateCurrentCashValue = useCallback(() => {
    const cashValue = calculateCurrentCash(state.cashInfo, state.globalElements);
    return cashValue;
  }, [state.cashInfo, state.globalElements]);

  const getSaldoColorValue = useCallback(() => {
    const saldoColor = getSaldoColor(calculateCurrentCashValue(), state.cashInfo.totalWorth);
    return saldoColor;
  }, [calculateCurrentCashValue, state.cashInfo.totalWorth]);

  const handleAddSpace = useCallback((space) => {
    const spaceWithId = { ...space, id: uuidv4() };
    dispatch({ type: 'ADD_GLOBAL_SPACE', payload: spaceWithId });
  }, [dispatch]);

  const handleEditSpace = useCallback((space) => {
    dispatch({ type: 'EDIT_GLOBAL_SPACE', payload: space });
  }, [dispatch]);

  const handleDeleteSpace = useCallback((id) => {
    dispatch({ type: 'DELETE_GLOBAL_SPACE', payload: id });
  }, [dispatch]);

  const handleAddElement = useCallback((element) => {
    const elementWithId = { ...element, id: uuidv4() };
    dispatch({ type: 'ADD_GLOBAL_ELEMENT', payload: elementWithId });
  }, [dispatch]);

  const handleEditElement = useCallback((element) => {
    dispatch({ type: 'EDIT_GLOBAL_ELEMENT', payload: element });
  }, [dispatch]);

  const handleDeleteElement = useCallback((id) => {
    dispatch({ type: 'DELETE_GLOBAL_ELEMENT', payload: id });
  }, [dispatch]);

  const handleAddTask = useCallback((taskData, useInterval) => {
    const updatedTasks = [];
    let currentStartDate = new Date(taskData.startDate);
    let currentEstimatedPrice = parseFloat(taskData.estimatedPrice);

    if (useInterval) {
      for (let i = 0; i < taskData.totalYears; i += taskData.intervalYears) {
        const newTask = {
          id: uuidv4(),
          name: taskData.name,
          description: taskData.description,
          urgency: taskData.urgency,
          planned: {
            workDate: new Date(currentStartDate).toISOString(),
            estimatedPrice: currentEstimatedPrice.toFixed(2),
            offerPrice: '',
            invoicePrice: '',
            comment: '',
            offerFiles: [],
            invoiceFiles: [],
            offerAccepted: false,
          },
          ultimateDate: new Date(
            currentStartDate.getFullYear() + taskData.intervalYears,
            currentStartDate.getMonth(),
            currentStartDate.getDate()
          ).toISOString(),
        };

        updatedTasks.push(newTask);
        currentStartDate.setFullYear(currentStartDate.getFullYear() + taskData.intervalYears);
        currentEstimatedPrice *= 1 + taskData.inflationRate / 100;
      }
    } else {
      updatedTasks.push({
        id: uuidv4(),
        name: taskData.name,
        description: taskData.description,
        urgency: taskData.urgency,
        planned: {
          workDate: new Date(taskData.startDate).toISOString(),
          estimatedPrice: parseFloat(taskData.estimatedPrice).toFixed(2),
          offerPrice: '',
          invoicePrice: '',
          comment: '',
          offerFiles: [],
          invoiceFiles: [],
          offerAccepted: false,
        },
        ultimateDate: new Date(taskData.startDate).toISOString(),
      });
    }

    dispatch({ type: 'ADD_TASK', payload: { elementId: taskData.elementId, tasks: updatedTasks } });
  }, [dispatch]);

  // Additional new functions
  const handleAddItemToPlanning = useCallback((task, elementId) => {
    logAction('Add item to planning', { task, elementId });
    setGlobalElements((prevElements) =>
      prevElements.map((element) => {
        if (element.id === elementId) {
          return {
            ...element,
            inspectionReport: element.inspectionReport.map((report) =>
              report.tasks.map((t) =>
                t.id === task.id
                  ? {
                      ...t,
                      planned: true,
                      plannedData: {
                        workDate: task.workDate,
                        estimatedPrice: task.estimatedPrice,
                        comment: task.comment,
                        files: task.files || [],
                      },
                    }
                  : t
              )
            ),
          };
        }
        return element;
      })
    );
  }, [logAction]);

  const handleItemChange = useCallback((taskId, field, value) => {
    logAction('Handle item change', { taskId, field, value });
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        inspectionReport: element.inspectionReport.map((report) => ({
          ...report,
          tasks: report.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  plannedData: {
                    ...task.plannedData,
                    [field]: value,
                  },
                }
              : task
          ),
        })),
      }))
    );
  }, [logAction]);

  const handleDeleteItem = useCallback((taskId) => {
    logAction('Handle delete item', { taskId });
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        inspectionReport: element.inspectionReport.map((report) => ({
          ...report,
          tasks: report.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  planned: false,
                  plannedData: {},
                }
              : task
          ),
        })),
      }))
    );
  }, [logAction]);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    saveData,
    calculateCurrentCashValue,
    getSaldoColorValue,
    setOfferGroups,
    setGlobalElements,
    setGeneralInfo,
    setGlobalSpaces,
    handleAddSpace,
    handleEditSpace,
    handleDeleteSpace,
    handleValidation,
    handleAddElement,
    handleEditElement,
    handleDeleteElement,
    handleAddTask,
    handleAddItemToPlanning,
    handleItemChange,
    handleDeleteItem,
  }), [
    state,
    dispatch,
    saveData,
    calculateCurrentCashValue,
    getSaldoColorValue,
    setOfferGroups,
    setGlobalElements,
    setGeneralInfo,
    setGlobalSpaces,
    handleAddSpace,
    handleEditSpace,
    handleDeleteSpace,
    handleValidation,
    handleAddElement,
    handleEditElement,
    handleDeleteElement,
    handleAddTask,
    handleAddItemToPlanning,
    handleItemChange,
    handleDeleteItem,
  ]);

  return <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>;
};
