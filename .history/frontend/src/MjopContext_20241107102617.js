// MjopContext.js

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchMJOPData,
  saveMJOPData,
  calculateCurrentCash,
  getSaldoColor,
} from './dataHandling';
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
      console.log('Reducer - Setting General Info:', action.payload);
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };
    case 'SET_DATA':
      console.log('Reducer - Setting Data:', action.payload);
      return {
        ...state,
        generalInfo: action.payload.generalInfo || state.generalInfo,
        cashInfo: action.payload.cashInfo || state.cashInfo,
        mjop: action.payload.mjop || state.mjop,
        globalElements: action.payload.globalElements || state.globalElements,
        globalSpaces: action.payload.globalSpaces || state.globalSpaces,
        globalDocuments: action.payload.globalDocuments || state.globalDocuments,
        offerGroups: action.payload.offerGroups || state.offerGroups,
      };
    case 'SET_ERRORS':
      console.log('Reducer - Setting Errors:', action.payload);
      return { ...state, errors: action.payload };
    case 'SET_TAB_ERRORS':
      console.log('Reducer - Setting Tab Errors:', action.payload);
      return { ...state, tabErrors: action.payload };
    case 'SET_SAVING':
      console.log('Reducer - Setting Saving Status:', action.payload);
      return { ...state, isSaving: action.payload };
    case 'SET_SUCCESS':
      console.log('Reducer - Setting Success:', action.payload);
      return { ...state, success: action.payload };
    case 'SET_ERROR_MESSAGE':
      console.log('Reducer - Setting Error Message:', action.payload);
      return { ...state, errorMessage: action.payload, openErrorDialog: true };
    case 'ADD_GLOBAL_ELEMENT':
      console.log('Reducer - Adding Global Element:', action.payload);
      return { ...state, globalElements: [...state.globalElements, action.payload] };
    case 'EDIT_GLOBAL_ELEMENT':
      console.log('Reducer - Editing Global Element:', action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((el) =>
          el.id === action.payload.id ? action.payload : el
        ),
      };
    case 'DELETE_GLOBAL_ELEMENT':
      console.log('Reducer - Deleting Global Element:', action.payload);
      return {
        ...state,
        globalElements: state.globalElements.filter((el) => el.id !== action.payload),
      };
    case 'ADD_TASK':
      console.log('Reducer - Adding Task:', action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((element) =>
          element.id === action.payload.elementId
            ? {
                ...element,
                tasks: [...(element.tasks || []), ...action.payload.tasks],
              }
            : element
        ),
      };
    case 'UPDATE_TASK':
      console.log('Reducer - Updating Task:', action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((element) => ({
          ...element,
          inspectionReport: element.inspectionReport.map((report) => ({
            ...report,
            tasks: report.tasks.map((task) =>
              task.id === action.payload.taskId
                ? {
                    ...task,
                    plannedData: {
                      ...task.plannedData,
                      [action.payload.field]: action.payload.value,
                    },
                  }
                : task
            ),
          })),
        })),
      };
    case 'DELETE_TASK':
      console.log('Reducer - Deleting Task:', action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((element) => ({
          ...element,
          inspectionReport: element.inspectionReport.map((report) => ({
            ...report,
            tasks: report.tasks.map((task) =>
              task.id === action.payload
                ? {
                    ...task,
                    planned: false,
                    plannedData: {},
                  }
                : task
            ),
          })),
        })),
      };
    case 'ADD_CUSTOM_ITEM':
      console.log('Reducer - Adding Custom Item:', action.payload);
      const item = action.payload.item;
      const generalElementIndex = state.globalElements.findIndex(
        (el) => el.name === 'Algemeneen'
      );
      if (generalElementIndex !== -1) {
        // 'Algemeneen' exists
        const updatedGlobalElements = [...state.globalElements];
        const generalElement = updatedGlobalElements[generalElementIndex];
        const updatedInspectionReport = [...(generalElement.inspectionReport || [])];
        if (updatedInspectionReport.length > 0) {
          // Assuming first inspection report
          const updatedTasks = [
            ...updatedInspectionReport[0].tasks,
            {
              ...item,
              id: uuidv4(),
              planned: true,
              plannedData: {
                workDate: item.workDate,
                estimatedPrice: item.estimatedPrice,
                comment: item.comment,
                files: item.files || [],
              },
            },
          ];
          updatedInspectionReport[0] = {
            ...updatedInspectionReport[0],
            tasks: updatedTasks,
          };
        } else {
          // No inspection report exists
          updatedInspectionReport.push({
            id: uuidv4(),
            element: 'Algemeneen',
            description: '',
            tasks: [
              {
                ...item,
                id: uuidv4(),
                planned: true,
                plannedData: {
                  workDate: item.workDate,
                  estimatedPrice: item.estimatedPrice,
                  comment: item.comment,
                  files: item.files || [],
                },
              },
            ],
          });
        }
        updatedGlobalElements[generalElementIndex] = {
          ...generalElement,
          inspectionReport: updatedInspectionReport,
        };
        return {
          ...state,
          globalElements: updatedGlobalElements,
        };
      } else {
        // 'Algemeneen' doesn't exist
        const newElement = {
          id: uuidv4(),
          name: 'Algemeneen',
          description: '',
          inspectionReport: [
            {
              id: uuidv4(),
              element: 'Algemeneen',
              description: '',
              tasks: [
                {
                  ...item,
                  id: uuidv4(),
                  planned: true,
                  plannedData: {
                    workDate: item.workDate,
                    estimatedPrice: item.estimatedPrice,
                    comment: item.comment,
                    files: item.files || [],
                  },
                },
              ],
            },
          ],
        };
        return {
          ...state,
          globalElements: [...state.globalElements, newElement],
        };
      }
    case 'ADD_GLOBAL_SPACE':
      console.log('Reducer - Adding Global Space:', action.payload);
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };
    case 'EDIT_GLOBAL_SPACE':
      console.log('Reducer - Editing Global Space:', action.payload);
      return {
        ...state,
        globalSpaces: state.globalSpaces.map((space) =>
          space.id === action.payload.id ? action.payload : space
        ),
      };
    case 'DELETE_GLOBAL_SPACE':
      console.log('Reducer - Deleting Global Space:', action.payload);
      return {
        ...state,
        globalSpaces: state.globalSpaces.filter((space) => space.id !== action.payload),
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
  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
    photos: [],
    documents: [],
    image: '',
    annotations: [],
  });

  const logAction = useCallback((action, data) => {
    console.log(
      `[${new Date().toISOString()}] ${action}:`,
      JSON.stringify(data, null, 2)
    );
  }, []);

  const setOfferGroups = useCallback(
    (offerGroups) => {
      logAction('Setting Offer Groups', offerGroups);
      dispatch({ type: 'SET_DATA', payload: { offerGroups } });
    },
    [logAction, dispatch]
  );

  const setGlobalElements = useCallback(
    (globalElements) => {
      logAction('Setting Global Elements', globalElements);
      dispatch({ type: 'SET_DATA', payload: { globalElements } });
    },
    [logAction, dispatch]
  );

  const setGlobalSpaces = useCallback(
    (globalSpaces) => {
      logAction('Setting Global Spaces', globalSpaces);
      dispatch({ type: 'SET_DATA', payload: { globalSpaces } });
    },
    [logAction, dispatch]
  );

  useEffect(() => {
    console.log('State updated:', state);
  }, [state]);

  const setGeneralInfo = useCallback(
    (updatedFields) => {
      logAction('Setting General Info', updatedFields);
      dispatch({ type: 'SET_GENERAL_INFO', payload: updatedFields });
    },
    [logAction, dispatch]
  );

  const initializeData = useCallback(
    async (id) => {
      if (isDataLoaded) return; // Prevent fetching data again if already loaded
      console.log('Reinstalling data');
      try {
        console.log(`[initializeData] Fetching data for ID: ${id}`);
        const data = await fetchMJOPData(id);
        console.log('[initializeData] Raw fetched data:', data);

        const payload = {
          generalInfo: data.generalInfo || initialState.generalInfo,
          cashInfo: data.cashInfo || initialState.cashInfo,
          mjop: data.mjop || initialState.mjop,
          globalElements: Array.isArray(data.globalElements) ? data.globalElements : [],
          globalSpaces: Array.isArray(data.globalSpaces) ? data.globalSpaces : [],
          globalDocuments: Array.isArray(data.globalDocuments)
            ? data.globalDocuments
            : [],
          offerGroups: Array.isArray(data.offerGroups) ? data.offerGroups : [],
        };

        dispatch({ type: 'SET_DATA', payload });
        setIsDataLoaded(true); // Mark data as loaded after fetching

        console.log('[initializeData] Data dispatched successfully.');
      } catch (err) {
        console.error('[initializeData] Error fetching MJOP data:', err);
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Error fetching data' });
      }
    },
    [dispatch, isDataLoaded]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('mjop-id');

    if (id && id !== mjopId) {
      setIsDataLoaded(false); // Reset data loaded flag on ID change
      console.log('useEffect - Detected ID Change:', id);
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
      console.log('Validation - Errors found:', newErrors, newTabErrors);
      dispatch({ type: 'SET_ERRORS', payload: newErrors });
      dispatch({ type: 'SET_TAB_ERRORS', payload: newTabErrors });
    }
    return isValid;
  }, [state]);

  const saveData = useCallback(async () => {
    if (!handleValidation()) return;

    try {
      console.log('Saving Data:', state);
      const formData = new FormData();
      formData.append('mjop', JSON.stringify(state.mjop));
      formData.append('generalInfo', JSON.stringify(state.generalInfo));
      formData.append('cashInfo', JSON.stringify(state.cashInfo));
      formData.append('globalElements', JSON.stringify(state.globalElements));
      formData.append('globalSpaces', JSON.stringify(state.globalSpaces));
      formData.append('globalDocuments', JSON.stringify(state.globalDocuments));
      formData.append('offerGroups', JSON.stringify(state.offerGroups));

      if (
        state.generalInfo.propertyImage &&
        typeof state.generalInfo.propertyImage !== 'string'
      ) {
        formData.append('propertyImage', state.generalInfo.propertyImage);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      };
      await saveMJOPData(mjopId, formData, config);
      dispatch({ type: 'SET_SUCCESS', payload: 'Data saved successfully.' });
    } catch (err) {
      console.error('Error saving data:', err);
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Error saving data' } });
    }
  }, [state, mjopId, navigate, handleValidation]);

  const calculateCurrentCashValue = useCallback(() => {
    const cashValue = calculateCurrentCash(state.cashInfo, state.globalElements);
    console.log('Calculated Current Cash Value:', cashValue);
    return cashValue;
  }, [state.cashInfo, state.globalElements]);

  const getSaldoColorValue = useCallback(() => {
    const saldoColor = getSaldoColor(
      calculateCurrentCashValue(),
      state.cashInfo.totalWorth
    );
    console.log('Calculated Saldo Color:', saldoColor);
    return saldoColor;
  }, [calculateCurrentCashValue, state.cashInfo.totalWorth]);

  // Global Elements Management Functions
  const handleAddElement = useCallback(
    (element) => {
      const elementWithId = { ...element, id: uuidv4() };
      logAction('Handle add element', { elementWithId });
      dispatch({ type: 'ADD_GLOBAL_ELEMENT', payload: elementWithId });
    },
    [dispatch, logAction]
  );

  const handleEditElement = useCallback(
    (element) => {
      logAction('Handle edit element', { element });
      dispatch({ type: 'EDIT_GLOBAL_ELEMENT', payload: element });
    },
    [dispatch, logAction]
  );

  const handleDeleteElement = useCallback(
    (id) => {
      logAction('Handle delete element', { id });
      dispatch({ type: 'DELETE_GLOBAL_ELEMENT', payload: id });
    },
    [dispatch, logAction]
  );

  // Global Spaces Management Functions
  const handleAddSpace = useCallback(
    (space) => {
      const spaceWithId = { ...space, id: uuidv4() };
      logAction('Handle add space', { spaceWithId });
      dispatch({ type: 'ADD_GLOBAL_SPACE', payload: spaceWithId });
    },
    [dispatch, logAction]
  );

  const handleEditSpace = useCallback(
    (space) => {
      logAction('Handle edit space', { space });
      dispatch({ type: 'EDIT_GLOBAL_SPACE', payload: space });
    },
    [dispatch, logAction]
  );

  const handleDeleteSpace = useCallback(
    (id) => {
      logAction('Handle delete space', { id });
      dispatch({ type: 'DELETE_GLOBAL_SPACE', payload: id });
    },
    [dispatch, logAction]
  );

  const handleAddItemToPlanning = useCallback(
    (task, elementId) => {
      logAction('Add item to planning', { task, elementId });
      dispatch({ type: 'ADD_ITEM_TO_PLANNING', payload: { task, elementId } });
    },
    [dispatch, logAction]
  );

  const handleItemChange = useCallback(
    (taskId, field, value) => {
      logAction('Handle item change', { taskId, field, value });
      dispatch({ type: 'UPDATE_TASK', payload: { taskId, field, value } });
    },
    [dispatch, logAction]
  );

  const handleDeleteItem = useCallback(
    (taskId) => {
      logAction('Handle delete item', { taskId });
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    },
    [dispatch, logAction]
  );

  const handleAddCustomItem = useCallback(
    (item) => {
      logAction('Handle add custom item', { item });
      dispatch({ type: 'ADD_CUSTOM_ITEM', payload: { item } });
    },
    [dispatch, logAction]
  );

  const contextValue = useMemo(
    () => ({
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
      handleAddElement,
      handleEditElement,
      handleDeleteElement,
      handleAddItemToPlanning,
      handleItemChange,
      handleDeleteItem,
      handleAddCustomItem,
      newSpace,
      setNewSpace,
    }),
    [
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
      handleAddElement,
      handleEditElement,
      handleDeleteElement,
      handleAddItemToPlanning,
      handleItemChange,
      handleDeleteItem,
      handleAddCustomItem,
      newSpace,
      setNewSpace,
    ]
  );

  return <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>;
};
