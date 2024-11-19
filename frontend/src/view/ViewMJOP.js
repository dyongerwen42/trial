import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Tabs,
  Tab,
  Typography,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useParams } from "react-router-dom";

import GeneralInfo from "./GeneralInfo";
import Spaces from "./Spaces";
import Elements from "./Elements";
import Documents from "./Documents";
import InspectionReportView from "./InspectionReportView";
import ElementsConditions from "./ElementsConditions";
import PlanningView from "./PlanningView";
import CashFlowChart from "./CashFlowChart";
import FacturenEnOffertes from "./FacturenEnOffertes";
import TaskCalendar from "./TaskCalendar";
import SustainabilityWidget from "./SustainabilityWidget";
import ContractsTable from "./ContractsTable";
import BudgetOverzicht from "./BudgetOverzicht";
import LifespanTable from "./LifespanTable";
import ComplaintsBoard from "./ComplaintsBoard"; // Import the ComplaintsBoard component

import {
  fetchMJOPData,
  calculateCurrentCash,
  getSaldoColor,
} from "../dataHandling";

const ViewMJOP = () => {
  const { id } = useParams();
  const [value, setValue] = useState(0);
  const [data, setData] = useState({});
  const [offerGroups, setOfferGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabErrors, setTabErrors] = useState({
    generalInfo: false,
    cashInfo: false,
    globalSpaces: false,
    globalElements: false,
    inspectionReport: false,
    planning: false,
    globalDocuments: false,
  });
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMJOPData(
          id,
          setData,
          (generalInfo) => setData((prev) => ({ ...prev, generalInfo })),
          (cashInfo) => setData((prev) => ({ ...prev, cashInfo })),
          setOfferGroups,
          (totalWorth) => setData((prev) => ({ ...prev, totalWorth })),
          (globalElements) => setData((prev) => ({ ...prev, globalElements })),
          (globalSpaces) => setData((prev) => ({ ...prev, globalSpaces })),
          (globalDocuments) => setData((prev) => ({ ...prev, globalDocuments }))
        );
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    const { cashInfo, globalSpaces, globalElements } = data;

    const checkCashFields = () => {
      const { currentCash, monthlyContribution, reserveDate, totalWorth } =
        cashInfo || {};
      return currentCash && monthlyContribution && reserveDate && totalWorth;
    };

    if (newValue === 1 && !checkCashFields()) {
      setErrorMessage("Vul de financiële informatie in.");
      setOpenErrorDialog(true);
      return;
    }

    if (newValue === 2 && (!globalSpaces || globalSpaces.length === 0)) {
      setErrorMessage("Definieer ruimtes voordat u verder gaat.");
      setOpenErrorDialog(true);
      return;
    }

    if (newValue === 3 && (!globalElements || globalElements.length === 0)) {
      setErrorMessage("Definieer elementen voordat u verder gaat.");
      setOpenErrorDialog(true);
      return;
    }

    setValue(newValue);
  };

  const {
    generalInfo,
    cashInfo,
    globalElements,
    globalSpaces,
    globalDocuments,
  } = data;

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="h6">
        Fout bij het laden van gegevens: {error.message}
      </Typography>
    );
  }

  if (!data || !generalInfo) {
    return <Typography>Geen gegevens beschikbaar</Typography>;
  }

  const sections = [
    "Algemene Informatie",
    "Planning",
    "Kalender",
    "Ruimtes",
    "Elementen",
    "Documenten",
    "Inspectierapporten",
    "Facturen en Offertes",
    "Cash Flow",
    "Verduurzaming",
    "Contracten",
    "Begroting",
    "Levensduur Overzicht",
    "Klachten & Ideeën Bord", // New tab for ComplaintsBoard
  ];

  const renderSection = () => {
    switch (sections[value]) {
      case "Algemene Informatie":
        return <GeneralInfo generalInfo={generalInfo} />;
      case "Ruimtes":
        return (
          <Spaces globalSpaces={globalSpaces} globalElements={globalElements} />
        );
      case "Elementen":
        return (
          <Elements
            globalSpaces={globalSpaces}
            globalElements={globalElements}
          />
        );
      case "Documenten":
        return <Documents globalDocuments={globalDocuments} />;
      case "Begroting":
        return <BudgetOverzicht />;
      case "Inspectierapporten":
        return (
          <InspectionReportView
            globalElements={globalElements}
            globalSpaces={globalSpaces}
            setGlobalElements={setData}
          />
        );
      case "Elementen en Condities":
        return <ElementsConditions elementsData={globalElements} />;
      case "Planning":
        return (
          <PlanningView
            globalElements={globalElements}
            globalSpaces={globalSpaces}
            cashInfo={cashInfo}
            offerGroups={offerGroups}
            setOfferGroups={setOfferGroups}
          />
        );
      case "Facturen en Offertes":
        return <FacturenEnOffertes globalElements={globalElements} />;
      case "Cash Flow":
        const allTasks = globalElements.flatMap((element) =>
          element.inspectionReport.flatMap((report) => report.tasks || [])
        );
        return (
          <CashFlowChart
            cashInfo={cashInfo}
            globalElements={globalElements}
            offerGroups={offerGroups}
          />
        );
      case "Kalender":
        const tasks = globalElements.flatMap((element) => element.tasks || []);
        return <TaskCalendar tasks={tasks} />;
      case "Verduurzaming":
        return <SustainabilityWidget />;
      case "Contracten":
        return <ContractsTable />;
      case "Levensduur Overzicht":
        return <LifespanTable />;
      case "Klachten & Ideeën Bord": // Render ComplaintsBoard here
        return <ComplaintsBoard />;
      default:
        return null;
    }
  };

  return (
    <Box
      mx="auto"
    
 
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 3,
          borderRadius: 1,
          boxShadow: 2,
        }}
      >
        <Tabs
          value={value}
          onChange={handleTabChange}
          variant="scrollable" // Makes tabs scrollable
          scrollButtons="auto" // Auto-hides scroll buttons when not needed
          aria-label="scrollable tabs"
        >
          {sections.map((section) => (
            <Tab
              key={section}
              label={
                <Badge
                  color="error"
                  variant="dot"
                  invisible={
                    !tabErrors[section.toLowerCase().replace(/ /g, "")]
                  }
                >
                  {section}
                </Badge>
              }
            />
          ))}
        </Tabs>
        <Box sx={{ p: 3 }}>{renderSection()}</Box>
      </Box>

      <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
        <DialogTitle>Fout</DialogTitle>
        <DialogContent>
          <Typography>{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenErrorDialog(false)} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewMJOP;
