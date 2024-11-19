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
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };
    case 'SET_DATA':
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
      console.error("[initializeData] Error fetching MJOP data:", err);
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
      console.error("Error saving data:", err);
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Error saving data' } });
    }
  }, [state, mjopId, navigate, handleValidation]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'SET_ERRORS', payload: {} });
    dispatch({ type: 'SET_SUCCESS', payload: null });

    if (!handleValidation()) {
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({
        type: 'SET_ERRORS',
        payload: { general: 'Validation errors need to be resolved.' },
      });
      return;
    }
    await saveData();
  }, [handleValidation, saveData]);

  const handleAddSpace = useCallback((space) => {
    const spaceWithId = { ...space, id: uuidv4() };
    logAction('Handle add space', { spaceWithId });
    dispatch({ type: 'ADD_GLOBAL_SPACE', payload: spaceWithId });
  }, [dispatch, logAction]);

  const handleEditSpace = useCallback((space) => {
    logAction('Handle edit space', { space });
    dispatch({ type: 'EDIT_GLOBAL_SPACE', payload: space });
  }, [dispatch, logAction]);

  const handleDeleteSpace = useCallback((id) => {
    logAction('Handle delete space', { id });
    dispatch({ type: 'DELETE_GLOBAL_SPACE', payload: id });
  }, [dispatch, logAction]);

  const handleAddElement = useCallback((element) => {
    const elementWithId = { ...element, id: uuidv4() };
    logAction('Handle add element', { elementWithId });
    dispatch({ type: 'ADD_GLOBAL_ELEMENT', payload: elementWithId });
  }, [dispatch, logAction]);

  const handleEditElement = useCallback((element) => {
    logAction('Handle edit element', { element });
    dispatch({
      type: 'SET_DATA',
      payload: { globalElements: state.globalElements.map((el) => (el.id === element.id ? element : el)) },
    });
  }, [state.globalElements, logAction, dispatch]);

  const handleDeleteElement = useCallback((id) => {
    logAction('Handle delete element', { id });
    dispatch({ type: 'SET_DATA', payload: { globalElements: state.globalElements.filter((el) => el.id !== id) } });
  }, [state.globalElements, logAction, dispatch]);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    saveData,
    setOfferGroups,
    setGlobalElements,
    setGeneralInfo,
    setGlobalSpaces,
    handleAddSpace,
    handleEditSpace,
    handleDeleteSpace,
    handleValidation,
    handleSubmit,
    handleAddElement,
    handleEditElement,
    handleDeleteElement,
  }), [
    state,
    dispatch,
    saveData,
    setOfferGroups,
    setGlobalElements,
    setGeneralInfo,
    setGlobalSpaces,
    handleAddSpace,
    handleEditSpace,
    handleDeleteSpace,
    handleValidation,
    handleSubmit,
    handleAddElement,
    handleEditElement,
    handleDeleteElement,
  ]);

  return <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>;
};

export default MjopProvider;
