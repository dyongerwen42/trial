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
  switch (action.type) {
    case 'SET_DATA':
      console.log('Setting data:', action.payload);
      return { ...state, ...action.payload };
    case 'SET_FIELD':
      return { ...state, [action.section]: { ...state[action.section], [action.field]: action.value } };
    case 'SET_TAB_ERRORS':
      return { ...state, tabErrors: action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_ERROR_DIALOG':
      return { ...state, openErrorDialog: action.payload.open, errorMessage: action.payload.message };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'ADD_ELEMENT':
      return { ...state, globalElements: [...state.globalElements, action.payload] };
    case 'EDIT_ELEMENT':
      return { ...state, globalElements: state.globalElements.map(el => (el.id === action.payload.id ? action.payload : el)) };
    case 'DELETE_ELEMENT':
      return { ...state, globalElements: state.globalElements.filter(el => el.id !== action.payload) };
    case 'ADD_SPACE':
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };
    case 'EDIT_SPACE':
      return { ...state, globalSpaces: state.globalSpaces.map(sp => (sp.id === action.payload.id ? action.payload : sp)) };
    case 'DELETE_SPACE':
      return { ...state, globalSpaces: state.globalSpaces.filter(sp => sp.id !== action.payload) };
    default:
      return state;
  }
};

export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = useState(null);

  const logAction = useCallback((action, data) => {
    console.log(`[${new Date().toISOString()}] ${action}:`, JSON.stringify(data, null, 2));
  }, []);

  // Capture mjop-id from query parameters and set it
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('mjop-id');
    console.log("Captured mjop-id from query:", id);  // Log the captured ID from URL
    if (id && id !== mjopId) {
      setMjopId(id); // Update mjopId if it is different from the current value
      console.log(`Setting mjopId to ${id}`);
    }
  }, [location.search]);

  const initializeData = useCallback(async () => {
    if (mjopId) {
      console.log('Attempting to fetch MJOP data with ID:', mjopId);
      try {
        const {
          mjop,
          generalInfo,
          cashInfo,
          globalElements,
          globalSpaces,
          globalDocuments,
          offerGroups,
        } = await fetchMJOPData(mjopId);

        console.log('Data fetched successfully:', {
          mjop,
          generalInfo,
          cashInfo,
          globalElements,
          globalSpaces,
          globalDocuments,
          offerGroups,
        });

        dispatch({
          type: 'SET_DATA',
          payload: {
            mjop,
            generalInfo,
            cashInfo,
            globalElements,
            globalSpaces,
            globalDocuments,
            offerGroups,
          },
        });
      } catch (err) {
        console.error('Error fetching MJOP data:', err);
      }
    } else {
      console.log('No valid mjopId found, skipping fetch.');
    }
  }, [mjopId]);

  // Run initializeData only if mjopId has a value
  useEffect(() => {
    if (mjopId) {
      console.log("Triggering initializeData with mjopId:", mjopId);
      initializeData();
    }
  }, [initializeData, mjopId]);

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

  const calculateCurrentCash = () => calculateCurrentCash(state.cashInfo, state.globalElements);
  const getSaldoColor = () => getSaldoColor(calculateCurrentCash(), state.cashInfo.totalWorth);

  return (
    <MjopContext.Provider
      value={{
        state,
        dispatch,
        saveData,
        calculateCurrentCash,
        getSaldoColor,
        addGlobalElement: (element) => {
          const elementWithId = { ...element, id: uuidv4() };
          logAction('Add element', elementWithId);
          dispatch({ type: 'ADD_ELEMENT', payload: elementWithId });
        },
        editGlobalElement: (element) => {
          logAction('Edit element', element);
          dispatch({ type: 'EDIT_ELEMENT', payload: element });
        },
        deleteGlobalElement: (id) => {
          logAction('Delete element', { id });
          dispatch({ type: 'DELETE_ELEMENT', payload: id });
        },
        addGlobalSpace: (space) => {
          const spaceWithId = { ...space, id: uuidv4() };
          logAction('Add space', spaceWithId);
          dispatch({ type: 'ADD_SPACE', payload: spaceWithId });
        },
        editGlobalSpace: (space) => {
          logAction('Edit space', space);
          dispatch({ type: 'EDIT_SPACE', payload: space });
        },
        deleteGlobalSpace: (id) => {
          logAction('Delete space', { id });
          dispatch({ type: 'DELETE_SPACE', payload: id });
        },
      }}
    >
      {children}
    </MjopContext.Provider>
  );
};
