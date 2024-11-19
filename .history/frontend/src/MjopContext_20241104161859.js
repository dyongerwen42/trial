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

// In MjopContext.js
const setGlobalSpaces = (globalSpaces) => {
    dispatch({ type: 'SET_DATA', payload: { globalSpaces } });
  };
  
  const setGlobalElements = (globalElements) => {
    dispatch({ type: 'SET_DATA', payload: { globalElements } });
  };
  

const mjopReducer = (state, action) => {
  switch (action.type) {
    case 'SET_GENERAL_INFO':
      return {
        ...state,
        generalInfo: {
          ...state.generalInfo,
          ...action.payload,
        },
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
      return {
        ...state,
        globalElements: [...state.globalElements, action.payload],
      };
    case 'ADD_TASK':
      return {
        ...state,
        globalElements: state.globalElements.map((element) =>
          element.id === action.payload.elementId
            ? {
                ...element,
                tasks: [...(element.tasks || []), action.payload.task],
              }
            : element
        ),
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

  const logAction = useCallback((action, data) => {
    console.log(`[${new Date().toISOString()}] ${action}:`, JSON.stringify(data, null, 2));
  }, []);

  const setOfferGroups = (offerGroups) => {
    dispatch({ type: 'SET_DATA', payload: { offerGroups } });
  };

  const setGlobalElements = (globalElements) => {
    dispatch({ type: 'SET_DATA', payload: { globalElements } });
  };

  const setGeneralInfo = (updatedFields) => {
    dispatch({ type: 'SET_GENERAL_INFO', payload: updatedFields });
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('mjop-id');

    const initializeData = async () => {
      try {
        await fetchMJOPData(
          id,
          (mjop) => dispatch({ type: 'SET_DATA', payload: { mjop } }),
          (generalInfo) => dispatch({ type: 'SET_GENERAL_INFO', payload: generalInfo }),
          (cashInfo) => dispatch({ type: 'SET_DATA', payload: { cashInfo } }),
          (offerGroups) => setOfferGroups(offerGroups),
          (totalWorth) => dispatch({ type: 'SET_DATA', payload: { cashInfo: { totalWorth } } }),
          (globalElements) => setGlobalElements(globalElements),
          (globalSpaces) => dispatch({ type: 'SET_DATA', payload: { globalSpaces } }),
          (globalDocuments) => dispatch({ type: 'SET_DATA', payload: { globalDocuments } })
        );
      } catch (err) {
        console.error('Error fetching MJOP data:', err);
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Error fetching data' });
      }
    };

    if (id && id !== mjopId) {
      setMjopId(id);
      initializeData();
    }
  }, [location.search, mjopId]);

  const handleValidation = () => {
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

  const calculateCurrentCashValue = () => {
    if (!state.cashInfo || !state.globalElements) return 0;
    return calculateCurrentCash(state.cashInfo, state.globalElements);
  };

  const getSaldoColorValue = () => {
    if (!state.cashInfo) return 'grey';
    return getSaldoColor(calculateCurrentCashValue(), state.cashInfo.totalWorth);
  };

  const addGlobalElement = (element) => {
    const elementWithId = { ...element, id: uuidv4() };
    logAction('Add element', elementWithId);
    dispatch({ type: 'ADD_GLOBAL_ELEMENT', payload: elementWithId });
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
    dispatch({ type: 'ADD_TASK', payload: { task: newTask, elementId } });
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
        calculateCurrentCashValue,
        getSaldoColorValue,
        addTaskToPlanning,
        setOfferGroups,
        setGlobalElements,
        setGeneralInfo,
        setGlobalSpaces,
        setGlobalElements
      }}
    >
      {children}
    </MjopContext.Provider>
  );
};
