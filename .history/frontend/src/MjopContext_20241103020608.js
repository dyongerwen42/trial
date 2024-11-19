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
  console.log('Current state at reducer start:', state);
  console.log('Action received:', action);
  switch (action.type) {
    case 'SET_DATA':
      console.log('Setting data with payload:', action.payload);
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload.generalInfo },
        cashInfo: { ...state.cashInfo, ...action.payload.cashInfo },
        mjop: { ...state.mjop, ...action.payload.mjop },
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
    default:
      console.log('Unknown action type:', action.type);
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

  // Fetch MJOP data when mjopId is updated
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('mjop-id');

    const initializeData = async () => {
      console.log('Fetching MJOP data with ID:', id);
      try {
        const data = await fetchMJOPData(id);
        console.log('Data fetched successfully:', data);

        dispatch({
          type: 'SET_DATA',
          payload: {
            generalInfo: data.generalInfo,
            cashInfo: data.cashInfo,
            mjop: data.mjop,
            globalElements: data.globalElements,
            globalSpaces: data.globalSpaces,
            globalDocuments: data.globalDocuments,
            offerGroups: data.offerGroups,
          },
        });
      } catch (err) {
        console.error('Error fetching MJOP data:', err);
      }
    };

    if (id && id !== mjopId) {
      setMjopId(id);
      initializeData();
    }
  }, [location.search, mjopId]);

  // Log the current state after each render for debugging
  useEffect(() => {
    console.log('Updated state after dispatch:', state);
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

  const calculateCurrentCash = () => {
    const currentCash = calculateCurrentCash(state.cashInfo, state.globalElements);
    console.log('Calculated current cash:', currentCash);
    return currentCash;
  };

  const getSaldoColor = () => {
    const color = getSaldoColor(calculateCurrentCash(), state.cashInfo.totalWorth);
    console.log('Calculated saldo color:', color);
    return color;
  };

  const addGlobalElement = (element) => {
    const elementWithId = { ...element, id: uuidv4() };
    logAction('Add element', elementWithId);
    dispatch({ type: 'SET_DATA', payload: { globalElements: [...state.globalElements, elementWithId] } });
  };

  const editGlobalElement = (element) => {
    logAction('Edit element', element);
    dispatch({
      type: 'SET_DATA',
      payload: {
        globalElements: state.globalElements.map((el) => (el.id === element.id ? element : el)),
      },
    });
  };

  const deleteGlobalElement = (id) => {
    logAction('Delete element', { id });
    dispatch({
      type: 'SET_DATA',
      payload: { globalElements: state.globalElements.filter((el) => el.id !== id) },
    });
  };

  const addGlobalSpace = (space) => {
    const spaceWithId = { ...space, id: uuidv4() };
    logAction('Add space', spaceWithId);
    dispatch({ type: 'SET_DATA', payload: { globalSpaces: [...state.globalSpaces, spaceWithId] } });
  };

  const editGlobalSpace = (space) => {
    logAction('Edit space', space);
    dispatch({
      type: 'SET_DATA',
      payload: {
        globalSpaces: state.globalSpaces.map((sp) => (sp.id === space.id ? space : sp)),
      },
    });
  };

  const deleteGlobalSpace = (id) => {
    logAction('Delete space', { id });
    dispatch({
      type: 'SET_DATA',
      payload: { globalSpaces: state.globalSpaces.filter((sp) => sp.id !== id) },
    });
  };

  const addTaskToPlanning = (taskData, elementId) => {
    logAction('Add task to planning', { taskData, elementId });
    const updatedElements = state.globalElements.map((element) => {
      if (element.id === elementId) {
        const newTask = {
          id: uuidv4(),
          ...taskData,
          planned: true,
          plannedData: {
            workDate: taskData.workDate,
            estimatedPrice: taskData.estimatedPrice,
            comment: taskData.comment,
            files: taskData.files || [],
          },
        };
        return {
          ...element,
          tasks: [...(element.tasks || []), newTask],
        };
      }
      return element;
    });
    dispatch({ type: 'SET_DATA', payload: { globalElements: updatedElements } });
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
