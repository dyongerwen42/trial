import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Notifications,
  AccountCircle,
  Language,
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import {
  List as ListIcon,
  LogIn,
  UserPlus,
  LogOut,
  FilePlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Sample notifications
const notifications = [
  { id: 1, message: "Luchtbehandeling inspectie is verlopen!", type: "error" },
  { id: 2, message: "Dak inspectie gepland voor 2024-09-25.", type: "warning" },
  { id: 3, message: "Nieuwe inspectie rapport beschikbaar.", type: "info" },
];

const Header = ({ isAuthenticated, onLogout, toggleTheme, isDarkMode }) => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(notifications.length);
  const navigate = useNavigate();

  // Handle profile menu
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle language menu
  const handleLangMenu = (event) => {
    setLangAnchorEl(event.currentTarget);
  };
  const handleLangClose = () => {
    setLangAnchorEl(null);
  };
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleLangClose();
  };

  // Handle mobile drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle notification dropdown
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const openNotificationCenter = () => {
    handleNotificationClose();
    navigate("/notification-center");
  };

  const markAllAsRead = () => {
    setUnreadCount(0); // Clear unread notifications
    handleNotificationClose();
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        {t("header.title")}
      </Typography>
      <List>
        {isAuthenticated ? (
          <>
            <ListItem button component={Link} to="/mjop-list">
              <ListItemIcon>
                <ListIcon />
              </ListItemIcon>
              <ListItemText primary={t("header.mjopList")} />
            </ListItem>
            <ListItem button component={Link} to="/generate-mjop">
              <ListItemIcon>
                <FilePlus />
              </ListItemIcon>
              <ListItemText primary={t("header.generateMJOP")} />
            </ListItem>
            <ListItem button component={Link} to="/create-subuser">
              <ListItemIcon>
                <UserPlus />
              </ListItemIcon>
              <ListItemText primary={t("header.createSubuser")} />
            </ListItem>
            <ListItem button onClick={onLogout}>
              <ListItemIcon>
                <LogOut />
              </ListItemIcon>
              <ListItemText primary={t("header.logout")} />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button component={Link} to="/login">
              <ListItemIcon>
                <LogIn />
              </ListItemIcon>
              <ListItemText primary={t("header.login")} />
            </ListItem>
            <ListItem button component={Link} to="/register">
              <ListItemIcon>
                <UserPlus />
              </ListItemIcon>
              <ListItemText primary={t("header.register")} />
            </ListItem>
          </>
        )}
        <ListItem button onClick={() => changeLanguage("en")}>
          <ListItemIcon>
            <Language />
          </ListItemIcon>
          <ListItemText primary="EN" />
        </ListItem>
        <ListItem button onClick={() => changeLanguage("nl")}>
          <ListItemIcon>
            <Language />
          </ListItemIcon>
          <ListItemText primary="NL" />
        </ListItem>
        <ListItem>
          <FormControlLabel
            control={<Switch checked={isDarkMode} onChange={toggleTheme} />}
            label={isDarkMode ? t("header.lightMode") : t("header.darkMode")}
          />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ borderRadius: 0 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <img
            src="logo.png"
            className="w-16 m-2"
            alt="Logo"
            style={{ marginRight: "16px" }}
          />
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }}
          >
            {t("header.title")}
          </Typography>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              "& .MuiIconButton-root": {
                marginX: 1, // Ensure even spacing between buttons
                padding: "8px", // Consistent padding for all buttons
              },
            }}
          >
            {isAuthenticated ? (
              <>
                <Tooltip title={t("header.mjopList")}>
                  <IconButton
                    sx={{ color: "primary.main" }}
                    component={Link}
                    to="/mjop-list"
                  >
                    <ListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("header.generateMJOP")}>
                  <IconButton
                    sx={{ color: "primary.main" }}
                    component={Link}
                    to="/generate-mjop"
                  >
                    <FilePlus />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("header.createSubuser")}>
                  <IconButton
                    sx={{ color: "primary.main" }}
                    component={Link}
                    to="/create-subuser"
                  >
                    <UserPlus />
                  </IconButton>
                </Tooltip>

                {/* Notification Icon Button */}
                <IconButton
                  sx={{ color: "primary.main" }}
                  onClick={handleNotificationClick}
                  aria-controls="notification-menu"
                  aria-haspopup="true"
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>

                {/* Notification Dropdown */}
                <Menu
                  id="notification-menu"
                  anchorEl={notificationAnchorEl}
                  keepMounted
                  open={Boolean(notificationAnchorEl)}
                  onClose={handleNotificationClose}
                  PaperProps={{
                    style: {
                      maxHeight: "400px", // Increase height for scrolling
                      width: "380px", // Wider layout
                      padding: "10px", // Padding around dropdown
                      borderRadius: "8px", // Rounded edges for the dropdown
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", // Shadow for better visibility
                    },
                  }}
                >
                  <MenuItem
                    onClick={openNotificationCenter}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      color: "#1877F2", // Facebook blue-like color
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Notificatieschema
                  </MenuItem>

                  <Box sx={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.map((notification, index) => (
                      <MenuItem
                        key={notification.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 1,
                          padding: "10px",
                          borderBottom: "1px solid #f0f0f0",
                          backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              notification.type === "error"
                                ? "red"
                                : notification.type === "warning"
                                ? "orange"
                                : "blue",
                            width: 32,
                            height: 32,
                            marginRight: 2,
                          }}
                        >
                          {notification.type === "error"
                            ? "!"
                            : notification.type === "warning"
                            ? "?"
                            : "i"}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={unreadCount ? "bold" : "normal"}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {notification.date}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Box>

                  <MenuItem
                    onClick={markAllAsRead}
                    sx={{ textAlign: "center" }}
                  >
                    <Typography color="primary">
                      Markeer alles als gelezen
                    </Typography>
                  </MenuItem>
                </Menu>

                <IconButton
                  sx={{ color: "primary.main" }}
                  onClick={handleMenu}
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={onLogout}>{t("header.logout")}</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Tooltip title={t("header.login")}>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/login"
                    sx={{ marginX: 1 }}
                  >
                    {t("header.login")}
                  </Button>
                </Tooltip>
                <Tooltip title={t("header.register")}>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/register"
                    sx={{ marginX: 1 }}
                  >
                    {t("header.register")}
                  </Button>
                </Tooltip>
              </>
            )}
            <IconButton
              sx={{ color: "primary.main" }}
              onClick={handleLangMenu}
            >
              <Language />
            </IconButton>
            <Menu
              anchorEl={langAnchorEl}
              open={Boolean(langAnchorEl)}
              onClose={handleLangClose}
            >
              <MenuItem onClick={() => changeLanguage("en")}>EN</MenuItem>
              <MenuItem onClick={() => changeLanguage("nl")}>NL</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Header;
