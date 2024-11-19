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
      console.log("Reducer - Setting General Info:", action.payload);
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };
    case 'SET_DATA':
      console.log("Reducer - Setting Data:", action.payload);
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
      console.log("Reducer - Setting Errors:", action.payload);
      return { ...state, errors: action.payload };
    case 'SET_TAB_ERRORS':
      console.log("Reducer - Setting Tab Errors:", action.payload);
      return { ...state, tabErrors: action.payload };
    case 'SET_SAVING':
      console.log("Reducer - Setting Saving Status:", action.payload);
      return { ...state, isSaving: action.payload };
    case 'SET_SUCCESS':
      console.log("Reducer - Setting Success:", action.payload);
      return { ...state, success: action.payload };
    case 'SET_ERROR_MESSAGE':
      console.log("Reducer - Setting Error Message:", action.payload);
      return { ...state, errorMessage: action.payload, openErrorDialog: true };
    case 'ADD_GLOBAL_ELEMENT':
      console.log("Reducer - Adding Global Element:", action.payload);
      return { ...state, globalElements: [...state.globalElements, action.payload] };
    case 'ADD_TASK':
      console.log("Reducer - Adding Task:", action.payload);
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
    case 'ADD_GLOBAL_SPACE':
      console.log("Reducer - Adding Global Space:", action.payload);
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };
    case 'EDIT_GLOBAL_SPACE':
      console.log("Reducer - Editing Global Space:", action.payload);
      return {
        ...state,
        globalSpaces: state.globalSpaces.map(space =>
          space.id === action.payload.id ? action.payload : space
        ),
      };
    case 'DELETE_GLOBAL_SPACE':
      console.log("Reducer - Deleting Global Space:", action.payload);
      return {
        ...state,
        globalSpaces: state.globalSpaces.filter(space => space.id !== action.payload),
      };
    default:
      return state;
  }
};

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
import { fetchMJOPData, saveMJOPData, calculateCurrentCash, getSaldoColor } from './dataHandling';
import validate from './validation';

const MjopContext = createContext();
export const useMjopContext = () => useContext(MjopContext);

const initialState = {
  generalInfo: { /* initialize all fields like projectNumber, projectName, etc. */ },
  cashInfo: { currentCash: '', monthlyContribution: '', reserveDate: '', totalWorth: '' },
  mjop: {},
  globalElements: [],
  globalSpaces: [],
  globalDocuments: [],
  offerGroups: [],
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
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'ADD_GLOBAL_ELEMENT':
      return { ...state, globalElements: [...state.globalElements, action.payload] };
    case 'ADD_GLOBAL_SPACE':
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };
    // Add more cases as needed for handling spaces and elements
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
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Error fetching data' } });
    }
  }, [isDataLoaded]);

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
      await saveMJOPData(mjopId, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch({ type: 'SET_SUCCESS', payload: 'Data saved successfully.' });
    } catch (err) {
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Error saving data' } });
    }
  }, [state, mjopId, handleValidation]);

  // Additional functions from GenerateMJOP.js
  const handleAddElement = (element) => {
    const elementWithId = { ...element, id: uuidv4() };
    logAction('Handle add element', { elementWithId });
    dispatch({ type: 'ADD_GLOBAL_ELEMENT', payload: elementWithId });
  };

  const handleEditElement = (element) => {
    logAction('Handle edit element', { element });
    dispatch({
      type: 'SET_DATA',
      payload: { globalElements: state.globalElements.map((el) => (el.id === element.id ? element : el)) },
    });
  };

  const handleDeleteElement = (id) => {
    logAction('Handle delete element', { id });
    dispatch({ type: 'SET_DATA', payload: { globalElements: state.globalElements.filter((el) => el.id !== id) } });
  };

  const handleAddSpace = (space) => {
    const spaceWithId = { ...space, id: uuidv4() };
    logAction('Handle add space', { spaceWithId });
    dispatch({ type: 'ADD_GLOBAL_SPACE', payload: spaceWithId });
  };

  const handleEditSpace = (space) => {
    logAction('Handle edit space', { space });
    dispatch({
      type: 'SET_DATA',
      payload: { globalSpaces: state.globalSpaces.map((sp) => (sp.id === space.id ? space : sp)) },
    });
  };

  const handleDeleteSpace = (id) => {
    logAction('Handle delete space', { id });
    dispatch({ type: 'SET_DATA', payload: { globalSpaces: state.globalSpaces.filter((sp) => sp.id !== id) } });
  };

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    saveData,
    handleValidation,
    handleAddElement,
    handleEditElement,
    handleDeleteElement,
    handleAddSpace,
    handleEditSpace,
    handleDeleteSpace,
  }), [state, saveData, handleValidation]);

  return <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>;
};


