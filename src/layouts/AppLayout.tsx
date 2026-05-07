import React,{ useMemo, useState } from "react";
import { Outlet, useLocation, Link as RouterLink } from "react-router-dom";
import { styled, useTheme } from "@mui/material/styles";
import {
  AppBar as MuiAppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useContext } from "react";
import { ColorModeContext } from "../theme/ColorModeContext.jsx";
import NewApplicationDialog from "../components/NewApplicationDialog";

const DRAWER_OPEN = 260;
const DRAWER_CLOSED = 72;

// ----- MIXINS for Drawer width transitions (open/close)
const openedMixin = (theme) => ({
  width: DRAWER_OPEN,
  overflowX: "hidden",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.easeOut,
    duration: theme.transitions.duration.enteringScreen,
  }),
});

const closedMixin = (theme) => ({
  width: DRAWER_CLOSED,
  overflowX: "hidden",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.easeOut,
    duration: theme.transitions.duration.leavingScreen,
  }),
});

// ----- Styled Drawer
const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    width: open ? DRAWER_OPEN : DRAWER_CLOSED,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    "& .MuiDrawer-paper": {
      borderRight: `1px solid ${theme.palette.divider}`,
      boxSizing: "border-box",
      ...(open ? openedMixin(theme) : closedMixin(theme)),
    },
  })
);

// ----- Styled AppBar (slides with Drawer)
const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(["width", "margin-left"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.shortest,
    }),
    ...(open && {
      marginLeft: DRAWER_OPEN,
      width: `calc(100% - ${DRAWER_OPEN}px)`,
      transition: theme.transitions.create(["width", "margin-left"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
    ...(!open && {
      marginLeft: DRAWER_CLOSED,
      width: `calc(100% - ${DRAWER_CLOSED}px)`,
    }),
  })
);

// ----- Styled Main content (slides smoothly on the right)
const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    minHeight: "100vh",
    background: theme.palette.background.default,
    padding: theme.spacing(3),
    marginLeft: "24px",
    transition: theme.transitions.create(["margin-left"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.shortest,
    }),
  })
);

export default function AppLayout() {
  const theme = useTheme();
  const location = useLocation();

  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [newAppOpen, setNewAppOpen] = React.useState(false);

  const navItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
      { label: "Common Information", path: "/common-information", icon: <FolderSharedIcon /> },
      { label: "Grant Applications", path: "/grant-applications", icon: <ArticleIcon /> },
      { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
    ],
    []
  );

  const toggleDesktop = () => setDesktopOpen((v) => !v);
  const toggleMobile = () => setMobileOpen((v) => !v);

  // Sidebar content (used for both desktop + mobile)
  const drawerContent = (isDesktop, openState) => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Brand */}
      <Box sx={{ px: 2, py: 2, minHeight: 72, display: "flex", alignItems: "center" }}>
        <Box sx={{ overflow: "hidden" }}>
          <Typography variant="h6" sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>
            {openState ? "Grant Manager" : "GM"}
          </Typography>
          {openState && (
            <Typography variant="body2" color="text.secondary">
              Information Hub
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Nav */}
      <List sx={{ px: 1, pt: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.path;

          return (
            <Tooltip key={item.path} title={!openState ? item.label : ""} placement="right">
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={selected}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  justifyContent: openState ? "flex-start" : "center",
                  px: openState ? 2 : 1,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: openState ? 1.5 : 0,
                    justifyContent: "center",
                    color: selected ? theme.palette.primary.main : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {openState && <ListItemText primary={item.label} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Bottom collapse/expand button (desktop only) */}
      {isDesktop && (
        <Box sx={{ mt: "auto" }}>
          <Divider />
          <Box sx={{ p: 1, display: "flex", justifyContent: openState ? "flex-end" : "center" }}>
            <Tooltip title={openState ? "Collapse sidebar" : "Expand sidebar"}>
              <IconButton onClick={toggleDesktop} size="small">
                {openState ? <KeyboardDoubleArrowLeftIcon /> : <KeyboardDoubleArrowRightIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* AppBar slides smoothly with sidebar */}
      <AppBar position="fixed" elevation={0} open={desktopOpen}>
        <Toolbar sx={{ gap: 2 }}>
          {/* Mobile hamburger */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleMobile}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
              Grant Application Info Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Store common answers, manage applications, export easily.
            </Typography>
          </Box>
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Button variant="contained" onClick={() => setNewAppOpen(true)}>
            + New Application
          </Button>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer (temporary) */}
      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_OPEN },
        }}
      >
        {drawerContent(false, true)}
      </MuiDrawer>

      {/* Desktop Drawer (mini variant, collapsible) */}
      <Drawer
        variant="permanent"
        open={desktopOpen}
        sx={{ display: { xs: "none", md: "block" } }}
      >
        {drawerContent(true, desktopOpen)}
      </Drawer>

      {/* Main content slides smoothly on right */}
      <Main open={desktopOpen}>
        {/* Spacer so content starts below AppBar */}
        <Toolbar />
        <Outlet />
      </Main>
      <NewApplicationDialog
        open={newAppOpen}
        onClose={() => setNewAppOpen(false)} 
        onSave={undefined}      
      />
    </Box>
  );
}