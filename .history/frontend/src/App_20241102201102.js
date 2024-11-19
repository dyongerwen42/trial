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
import NotificationCenter from './NotificationCenter'; // Import the Notification Center component
import Poll from './Poll'; // Import the Poll component
import PollResultsTable from './PollResultsTable'
import CreatePoll from './CreatePoll'
import './index.css';
import './i18n'; // Import the i18n configuration
import Footer from './Footer'; // Adjust the path based on your file structure
import MJOPDashboard from './MjopDashboard.js';

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
            <Route path="/poll" element={<Poll />} /> {/* Added Poll route */}
            <Route path="/poll-resultaat" element={<PollResultsTable />} /> {/* Added Poll route */}
            <Route path="/CreatePoll" element={<CreatePoll />} /> {/* Added Poll route */}
            <Route path="/menu" element={<MJOPDashboard />} /> {/* Added Poll route */}
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
