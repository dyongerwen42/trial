import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart, registerables } from 'chart.js';
import Modal from 'react-modal';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import Header from './Header.js';
import MJOPList from './MJOPList.js';
import Login from './Login.js';
import Register from './Register.js';
import CreateSubUser from './CreateSubUser.js';
import GenerateMJOP from './GenerateMJOP.js';
import ViewMJOP from './view/ViewMJOP.js';
import NotificationCenter from './NotificationCenter';
import Poll from './Poll';
import PollResultsTable from './PollResultsTable';
import CreatePoll from './CreatePoll';
import MJOPDashboard from './MjopDashboard.js';
import GeneralInfo from './view/GeneralInfo';
import Spaces from './view/Spaces';
import Elements from './view/Elements';
import Documents from './view/Documents';
import InspectionReport from './InspectionReport';
import PlanningView from './Planning';
import CashFlowChart from './view/CashFlowChart';
import TaskCalendar from './view/TaskCalendar';
import SustainabilityWidget from './view/SustainabilityWidget';
import ContractsTable from './view/ContractsTable';
import BudgetOverzicht from './view/BudgetOverzicht';
import LifespanTable from './view/LifespanTable';
import ComplaintsBoard from './view/ComplaintsBoard';
import './index.css';
import './i18n';
import Footer from './Footer';
import TaskCreationForm from './TaskCreationForm'
// Import MjopContext and MjopProvider
import { MjopProvider } from './MjopContext';
import Plan from './Plan'
import Facturen from './view/FacturenEnOffertes'
import Meldingen from './view/ComplaintsBoard'
import Kanban from ''

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
        <MjopProvider> {/* Move MjopProvider inside Router */}
          <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          <div className="pt-20">
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create-subuser" element={<CreateSubUser />} />
              <Route path="/generate-mjop" element={<GenerateMJOP />} />
              <Route path="/view-mjop/:id" element={<ViewMJOP />} />
              <Route path="/edit-mjop/:id" element={<GenerateMJOP />} />
              <Route path="/mjop-list" element={<MJOPList />} />
              <Route path="/notification-center" element={<NotificationCenter />} />
              <Route path="/poll" element={<Poll />} />
              <Route path="/poll-resultaat" element={<PollResultsTable />} />
              <Route path="/createpoll" element={<CreatePoll />} />
              <Route path="/dashboard" element={<MJOPDashboard />} />
              
              {/* Direct Routes for MJOPDashboard Sections */}
              <Route path="/create-task" element={<TaskCreationForm />} />
              <Route path="/general-info" element={<GeneralInfo />} />
              <Route path="/spaces" element={<Spaces />} />
              <Route path="/elements" element={<Elements />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/inspection-report" element={<InspectionReport/>} />
              <Route path="/planning" element={<PlanningView />} />
              <Route path="/cash-flow" element={<CashFlowChart />} />
              <Route path="/kalender" element={<TaskCalendar />} />
              <Route path="/sustainability" element={<SustainabilityWidget />} />
              <Route path="/contracts" element={<ContractsTable />} />
              <Route path="/budget" element={<BudgetOverzicht />} />
              <Route path="/lifespan" element={<LifespanTable />} />
              <Route path="/meldingen" element={<Meldingen />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/facturen" element={<Facturen />} />
              <Route path="/kanban" element={<KanBan />} />

            </Routes>
          </div>
          <Footer />
        </MjopProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
