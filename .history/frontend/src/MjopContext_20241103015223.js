import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
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
    currentCash: '',
    monthlyContribution: '',
    reserveDate: '',
    totalWorth: '',
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
  console.log('Reducer - Current state:', state);
  console.log('Reducer - Action:', action);
  switch (action.type) {
    case 'SET_DATA':
      console.log('Reducer - Setting data with payload:', action.payload);
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
      console.log('Reducer - Setting errors:', action.payload);
      return { ...state, errors: action.payload };
    case 'SET_TAB_ERRORS':
      console.log('Reducer - Setting tab errors:', action.payload);
      return { ...state, tabErrors: action.payload };
    case 'SET_ERROR_DIALOG':
      console.log('Reducer - Setting error dialog:', action.payload);
      return { ...state, openErrorDialog: action.payload.open, errorMessage: action.payload.message };
    case 'SET_SAVING':
      console.log('Reducer - Setting saving state:', action.payload);
      return { ...state, isSaving: action.payload };
    case 'SET_SUCCESS':
      console.log('Reducer - Setting success message:', action.payload);
      return { ...state, success: action.payload };
    case 'ADD_ELEMENT':
      console.log('Reducer - Adding element:', action.payload);
      return { ...state, globalElements: [...state.globalElements, action.payload] };
    case 'EDIT_ELEMENT':
      console.log('Reducer - Editing element:', action.payload);
      return { 
        ...state, 
        globalElements: state.globalElements.map(el => el.id === action.payload.id ? action.payload : el) 
      };
    case 'DELETE_ELEMENT':
      console.log('Reducer - Deleting element with id:', action.payload);
      return { ...state, globalElements: state.globalElements.filter(el => el.id !== action.payload) };
    case 'ADD_SPACE':
      console.log('Reducer - Adding space:', action.payload);
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };
    case 'EDIT_SPACE':
      console.log('Reducer - Editing space:', action.payload);
      return { 
        ...state, 
        globalSpaces: state.globalSpaces.map(sp => sp.id === action.payload.id ? action.payload : sp) 
      };
    case 'DELETE_SPACE':
      console.log('Reducer - Deleting space with id:', action.payload);
      return { ...state, globalSpaces: state.globalSpaces.filter(sp => sp.id !== action.payload) };
    default:
      console.log('Reducer - Unknown action type:', action.type);
      return state;
  }
};

export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = useState(null);

  // Log actions for debugging
  const logAction = useCallback((action, data) => {
    console.log(`[${new Date().toISOString()}] ${action}:`, JSON.stringify(data, null, 2));
  }, []);

  // Function to fetch data and update state
  const initializeData = useCallback(async (id) => {
    console.log('Fetching MJOP data with ID:', id);
    try {
      const data = await fetchMJOPData(id);
      console.log('Data fetched successfully:', data);

      dispatch({
        type: 'SET_DATA',
        payload: data,
      });
    } catch (err) {
      console.error('Error fetching MJOP data:', err);
    }
  }, []);

  // Check for `mjop-id` in query and fetch data if changed
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('mjop-id');
    console.log('Captured mjop-id from query:', id);

    if (id && id !== mjopId) {
      console.log(`Updating mjopId from ${mjopId} to ${id}`);
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData]);

  // Always log state after each update
  useEffect(() => {
    console.log('Updated state:', state);
  }, [state]);

  const handleValidation = () => {
    const { newErrors, newTabErrors, isValid } = validate({
      generalInfo: state.generalInfo,
      cashInfo: state.cashInfo,
      totalWorth: state.cashInfo.totalWorth,
      globalElements: state.globalElements,
    });
    dispatch({ type: 'SET_ERRORS', payload: newErrors });
    dispatch({ type: 'SET_TAB_ERRORS', payload: newTabErrors });
    logAction('Handle validation', { newErrors, newTabErrors, isValid });
    return isValid;
  };

  const saveData = async () => {
    if (!handleValidation()) {
      dispatch({
        type: 'SET_ERRORS',
        payload: { general: 'Er zijn validatiefouten die moeten worden opgelost.' },
      });
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

      const config = { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true };
      await saveMJOPData(mjopId, formData, config);
      dispatch({ type: 'SET_SUCCESS', payload: 'Data saved successfully.' });
      navigate(`/view-mjop?mjop-id=${mjopId}`);
    } catch (err) {
      console.error('Error saving data:', err);
      dispatch({ type: 'SET_ERRORS', payload: { general: 'Er is een fout opgetreden bij het opslaan van de gegevens.' } });
    }
  };

  return (
    <MjopContext.Provider
      value={{
        state,
        dispatch,
        saveData,
        addGlobalElement,
        editGlobalElement,
        deleteGlobalElement,
        addGlobalSpace,
        editGlobalSpace,
        deleteGlobalSpace,
        calculateCurrentCash,
        getSaldoColor,
        addTaskToPlanning,
      }}
    >
      {children}
    </MjopContext.Provider>
  );
};
