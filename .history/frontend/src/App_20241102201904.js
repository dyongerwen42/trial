import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart, registerables } from 'chart.js';
import Modal from 'react-modal';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import Header from './Header';
import Footer from './Footer';
import MJOPList from './MJOPList';
import Login from './Login';
import Register from './Register';
import CreateSubUser from './CreateSubUser';
import GenerateMJOP from './GenerateMJOP';
import ViewMJOP from './view/ViewMJOP';
import NotificationCenter from './NotificationCenter';
import Poll from './Poll';
import PollResultsTable from './PollResultsTable';
import CreatePoll from './CreatePoll';
import MJOPDashboard from './MjopDashboard';

// MJOPDashboard individual section components
import GeneralInfo from './view/GeneralInfo';
import Spaces from './view/Spaces';
import Elements from './view/Elements';
import Documents from './view/Documents';
import InspectionReportView from './view/InspectionReportView';
import PlanningView from './view/PlanningView';
import CashFlowChart from './view/CashFlowChart';
import TaskCalendar from './view/TaskCalendar';
import SustainabilityWidget from './view/SustainabilityWidget';
import ContractsTable from './view/ContractsTable';
import BudgetOverzicht from './view/BudgetOverzicht';
import LifespanTable from './view/LifespanTable';
import ComplaintsBoard from './view/ComplaintsBoard';

import './index.css';
import './i18n';

Modal.setAppElement('#root');
Chart.register(...registerables);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error logging out', err);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
        <Header
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
        />
        <div className="pt-20">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-subuser" element={<CreateSubUser />} />
            <Route path="/generate-mjop" element={<GenerateMJOP />} />
            <Route path="/view-mjop/:id" element={<ViewMJOP />} />
            <Route path="/edit-mjop/:id" element={<GenerateMJOP />} />
            <Route path="/mjop-list" element={<MJOPList />} />
            <Route path="/notification-center" element={<NotificationCenter />} />
            <Route path="/poll" element={<Poll />} />
            <Route path="/poll-resultaat" element={<PollResultsTable />} />
            <Route path="/CreatePoll" element={<CreatePoll />} />
            <Route path="/menu" element={<MJOPDashboard />} />

            {/* Individual routes for each section in the MJOPDashboard */}
            <Route path="/menu/general-info" element={<GeneralInfo />} />
            <Route path="/menu/spaces" element={<Spaces />} />
            <Route path="/menu/elements" element={<Elements />} />
            <Route path="/menu/documents" element={<Documents />} />
            <Route path="/menu/inspection-report" element={<InspectionReportView />} />
            <Route path="/menu/planning" element={<PlanningView />} />
            <Route path="/menu/cash-flow" element={<CashFlowChart />} />
            <Route path="/menu/calendar" element={<TaskCalendar />} />
            <Route path="/menu/sustainability" element={<SustainabilityWidget />} />
            <Route path="/menu/contracts" element={<ContractsTable />} />
            <Route path="/menu/budget" element={<BudgetOverzicht />} />
            <Route path="/menu/lifespan" element={<LifespanTable />} />
            <Route path="/menu/complaints-board" element={<ComplaintsBoard />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </ThemeProvider>
  );
};

export default App;
