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
    case 'SET_GENERAL_INFO': return { ...state, generalInfo: { ...state.generalInfo, ...action.payload } };
    case 'SET_DATA': return { ...state, ...action.payload };
    case 'SET_ERRORS': return { ...state, errors: action.payload };
    case 'SET_TAB_ERRORS': return { ...state, tabErrors: action.payload };
    case 'SET_SAVING': return { ...state, isSaving: action.payload };
    case 'SET_SUCCESS': return { ...state, success: action.payload };
    case 'SET_ERROR_MESSAGE': return { ...state, errorMessage: action.payload, openErrorDialog: true };
    case 'ADD_GLOBAL_ELEMENT': return { ...state, globalElements: [...state.globalElements, action.payload] };
    case 'ADD_TASK': return {
      ...state,
      globalElements: state.globalElements.map((element) =>
        element.id === action.payload.elementId
          ? { ...element, tasks: [...(element.tasks || []), ...action.payload.tasks] }
          : element
      ),
    };
    case 'ADD_GLOBAL_SPACE': return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };
    case 'EDIT_GLOBAL_SPACE': return { ...state, globalSpaces: state.globalSpaces.map(space => space.id === action.payload.id ? action.payload : space) };
    case 'DELETE_GLOBAL_SPACE': return { ...state, globalSpaces: state.globalSpaces.filter(space => space.id !== action.payload) };
    default: return state;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'SET_ERRORS', payload: {} });
    dispatch({ type: 'SET_SUCCESS', payload: null });

    if (!handleValidation()) {
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Er zijn validatiefouten die moeten worden opgelost.' } });
      return;
    }

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

      await saveMJOPData(mjopId, formData, { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true });
      dispatch({ type: 'SET_SUCCESS', payload: 'Data saved successfully.' });
    } catch (err) {
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Error saving data' } });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const calculateCurrentCashValue = useCallback(() => calculateCurrentCash(state.cashInfo, state.globalElements), [state.cashInfo, state.globalElements]);

  const getSaldoColorValue = useCallback(() => getSaldoColor(calculateCurrentCashValue(), state.cashInfo.totalWorth), [calculateCurrentCashValue, state.cashInfo.totalWorth]);

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

  const handleAddItemToPlanning = useCallback((task, elementId) => {
    dispatch({ type: 'ADD_TASK', payload: { elementId, tasks: [{ ...task, planned: true, plannedData: task }] } });
  }, [dispatch]);

  const handleItemChange = useCallback((taskId, field, value) => {
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        inspectionReport: element.inspectionReport.map((report) => ({
          ...report,
          tasks: report.tasks.map((task) =>
            task.id === taskId ? { ...task, plannedData: { ...task.plannedData, [field]: value } } : task
          ),
        })),
      }))
    );
  }, [setGlobalElements]);

  const handleDeleteItem = useCallback((taskId) => {
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        inspectionReport: element.inspectionReport.map((report) => ({
          ...report,
          tasks: report.tasks.map((task) =>
            task.id === taskId ? { ...task, planned: false, plannedData: {} } : task
          ),
        })),
      }))
    );
  }, [setGlobalElements]);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    saveData: handleSubmit,
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
    handleAddItemToPlanning,
    handleItemChange,
    handleDeleteItem,
  }), [state, dispatch, handleSubmit, calculateCurrentCashValue, getSaldoColorValue, setOfferGroups, setGlobalElements, setGeneralInfo, handleAddSpace, handleEditSpace, handleDeleteSpace, handleValidation, handleAddElement, handleEditElement, handleDeleteElement, handleAddItemToPlanning, handleItemChange, handleDeleteItem]);

  return <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>;
};
