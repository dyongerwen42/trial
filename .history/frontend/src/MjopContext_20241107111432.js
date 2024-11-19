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
C

