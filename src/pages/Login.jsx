import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Cookies from "js-cookie";
import logo from "../assets/Images/login-logo.png";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../components/Loader";
import { UserRole, DepartmentMapping } from "../constants/Enum";
import { loginAPI } from "../utils/endpoints";
import ExtensionDialog from "../components/ExtensionDialog";
import { fetchAllUserQueriesNew, getDesignationFlags } from "../utils/helpers";
import { encryptData } from "../utils/helpers";

// Styled components
const PageHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  backgroundColor: '#1a4d8f',
  color: '#ffffff',
  padding: theme.spacing(1.5, 0),
  fontSize: 24,
  fontWeight: 'bold',
  borderBottom: '3px solid #0c3570',
  margin: 0,
}));

const LoginContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 70px)',
  padding: theme.spacing(2.5),
  boxSizing: 'border-box',
  backgroundColor: '#e9edf3',
}));

const LoginBox = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 400,
  backgroundColor: '#ffffff',
  border: '1px solid #c5c9cf',
  borderTop: '5px solid #1a4d8f',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
}));

const LoginHeader = styled(Box)({
  textAlign: 'center',
  marginBottom: 10,
});

const LoginLogo = styled('img')({
  width: 80,
  height: 80,
  objectFit: 'contain',
});

const LoginTitle = styled(Typography)({
  textAlign: 'center',
  fontSize: 18,
  color: '#1a4d8f',
  fontWeight: 'bold',
  margin: '10px 0 20px 0',
});

const FormGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const FormLabel = styled(Typography)({
  display: 'block',
  fontSize: 14,
  color: '#222',
  fontWeight: 'bold',
  marginBottom: 4,
});

const LoginInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fdfdfd',
    '& fieldset': {
      borderColor: '#b8b8b8',
    },
    '&:hover fieldset': {
      borderColor: '#1a4d8f',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1a4d8f',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
    },
  },
  '& .MuiInputBase-input': {
    padding: '9px',
    fontSize: 15,
  },
}));

const LoginActions = styled(Box)({
  textAlign: 'right',
  marginTop: 5,
});

const LoginButton = styled(Button)({
  backgroundColor: '#1a4d8f',
  color: '#ffffff',
  padding: '10px 18px',
  fontSize: 15,
  fontWeight: 'bold',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#143e73',
  },
});

const LoginFooter = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginTop: theme.spacing(2.5),
  fontSize: 13,
  color: '#555',
  borderTop: '1px solid #ddd',
  paddingTop: theme.spacing(1.25),
}));

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState({
    step: "idle",
    current: 0,
    total: 0,
    taskName: "",
  });

  const { login, updateUserExtension } = useContext(AuthContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.replied_queries);

  const [showExtensionDialog, setShowExtensionDialog] = useState(false);

  useEffect(() => {
    localStorage.removeItem("queryDrafts_v2");
    const authData = Cookies.get("authData");
    if (authData) navigate("/");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInitializing(true);
    setInitProgress({ step: "authenticating", current: 0, total: 1 });

    try {
      const encryptedUsername = encryptData(username);
      const encryptedPassword = encryptData(password);
      const response = await loginAPI(encryptedUsername, encryptedPassword);
      console.log("Login API response:", response.data);

      if (response.data.status !== "OK") {
        setInitializing(false);
        setError(response.data.messageDetail || "Invalid username or password");
        return;
      }
      // As per new API response structure
      const baseData = response.data.data;
      const serviceNo = baseData.userName;
      const categoryStr = baseData.designation;
      const categoryCode = UserRole[categoryStr?.toUpperCase()] ?? null;
      const userDept = baseData.department;
      const deptConfig = DepartmentMapping[userDept];

      if (!serviceNo || categoryCode === null) {
        setInitializing(false);
        setError("Invalid user details. Please contact admin.");
        return;
      }

      if (!deptConfig) {
        setInitializing(false);
        setError(`Unsupported department: ${userDept || "Unknown"}`);
        return;
      }

      console.log("User category code:", categoryCode);
      console.log("User department config:", deptConfig);
      console.log(
        "User Category string:" +
          categoryStr +
          "and user Category code is" +
          categoryCode
      );

      setInitProgress({ step: "fetching-user-details", current: 1, total: 4 });

      let userDetails = null;
      try {
        const res = await fetch(
          `http://sampoorna.cao.local/afcao/ipas/ivrs/getUserDetails/${serviceNo}/${categoryCode}`
        );

        if (!res.ok) throw new Error(`API failed with ${res.status}`);
        const data = await res.json();

        if (!data?.USER_DETAILS?.length) {
          throw new Error("No user details found");
        }

        const userObj = data.USER_DETAILS[0];
        if (!userObj.LOGIN_PORTFOLIO || userObj.LOGIN_PORTFOLIO.length === 0) {
          throw new Error("No roles assigned. Access denied.");
        }

        userDetails = userObj;
      } catch (err) {
        console.error("Error fetching user details:", err);
        setInitializing(false);
        setError("Unable to fetch user access roles. Please try again.");
        return;
      }

      // Enrich login response
      baseData.userDetails = userDetails;
      console.log("Fetched user base data :", baseData);

      // Save in context & cookies
      login({ data: baseData, status: response.status });

      setInitProgress({ step: "setting-active-role", current: 2, total: 4 });

      // Set the first portfolio as the default active role
      const firstRole = userDetails.LOGIN_PORTFOLIO[0];
      if (firstRole) {
        try {
          localStorage.setItem("activeRole_v1", JSON.stringify(firstRole));
          console.log("🎯 Default active role set:", firstRole.PORTFOLIO_NAME);

          // Dispatch custom event to notify useActiveRole hook
          window.dispatchEvent(
            new CustomEvent("activeRoleChanged", {
              detail: { newRole: firstRole },
            })
          );
        } catch (err) {
          console.warn("Failed to set default active role:", err);
        }
      }

      setInitProgress({ step: "fetching-designation", current: 3, total: 5 });
      let designationFlags = [];
      try {
        designationFlags = await getDesignationFlags(firstRole);
      } catch (flagError) {
        console.warn(
          "Could not fetch designation flags, transferred queries might be missing.",
          flagError
        );
        // Don't block login if this fails, just log it
      }

      setInitProgress({ step: "fetching-queries", current: 3, total: 4 });

      // Fetch queries using the first (default) active role
      try {
        console.log(
          "🚀 Fetching initial queries for role:",
          firstRole.PORTFOLIO_NAME
        );

        const fetchResult = await fetchAllUserQueriesNew(dispatch, {
          activeRole: firstRole,
          designationFlags: designationFlags, // Use the active role instead of cat/suffix
          onProgress: (progress) => {
            setInitProgress({
              step: "fetching-queries",
              current: progress.current || 0,
              total: progress.total || 0,
              taskName: progress.taskName || "",
              roleName: progress.activeRole || "",
              ...progress,
            });
          },
          onError: (error) => {
            console.warn("Non-critical query fetch error:", error);
          },
        });

        console.log("📊 Initial query fetch summary:", fetchResult);

        if (fetchResult.success) {
          console.log(
            `✅ Initial queries loaded: ${fetchResult.successful}/${fetchResult.total} successful for role: ${firstRole.PORTFOLIO_NAME}`
          );
        } else {
          console.warn(
            "⚠️ Some initial queries failed to fetch, but continuing..."
          );
        }
      } catch (err) {
        console.error("Error fetching initial queries (non-critical):", err);
      }

      setInitProgress({ step: "completed", current: 4, total: 4 });
      setTimeout(() => {
        setInitializing(false);
        setShowExtensionDialog(true);
      }, 400);
    } catch (err) {
      console.error("Login error:", err);
      setInitializing(false);

      if (err.response) {
        // Handle API errors (like 400 Bad Request)
        const apiError = err.response.data;
        setError(
          apiError.messageDetail ||
            apiError.message ||
            "Login failed. Please check your credentials."
        );
      } else if (err.request) {
        // Handle network errors (request made but no response received)
        setError("Network error. Please check your connection and try again.");
      } else {
        // Handle other errors
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // Enhanced loading text based on progress
  const getLoadingText = () => {
    switch (initProgress.step) {
      case "authenticating":
        return "Authenticating user...";
      case "fetching-user-details":
        return "Fetching user permissions...";
      case "setting-active-role":
        return "Setting up user roles...";
      case "fetching-designation":
        return "Checking user designations...";
      case "fetching-queries":
        return initProgress.roleName
          ? `Loading data for ${initProgress.roleName} (${initProgress.current}/${initProgress.total})`
          : initProgress.taskName
          ? `Loading ${initProgress.taskName} (${initProgress.current}/${initProgress.total})`
          : "Loading queries and data...";
      case "completed":
        return "Setup complete! Redirecting...";
      default:
        return "Starting system... Please wait.";
    }
  };

  if (initializing || loading) {
    return (
      <Loader
        text={getLoadingText()}
        progress={
          initProgress.total > 0
            ? (initProgress.current / initProgress.total) * 100
            : undefined
        }
      />
    );
  }

  return (
    <>
      <Box sx={{ position: 'fixed', inset: 0, zIndex: -1 }} aria-hidden="true" />

      <PageHeader component="h1" aria-hidden="true">
        INTERACTIVE VOICE RESPONSE SYSTEM (IVRS)
      </PageHeader>

      <LoginContainer role="main">
        <LoginBox role="region" aria-label="Login form">
          <LoginHeader>
            <LoginLogo src={logo} alt="CRM Logo" />
          </LoginHeader>
          <LoginTitle variant="h2">User Login</LoginTitle>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert" aria-live="assertive">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <FormGroup>
              <FormLabel component="label" htmlFor="username">
                Username
              </FormLabel>
              <LoginInput
                fullWidth
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                size="small"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel component="label" htmlFor="password">
                Password
              </FormLabel>
              <LoginInput
                fullWidth
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                size="small"
              />
            </FormGroup>

            <LoginActions>
              <LoginButton type="submit" variant="contained" aria-label="Login">
                Login
              </LoginButton>
            </LoginActions>

            <LoginFooter aria-hidden="true">
              © {new Date().getFullYear()} IVRS — Secure access - Coral Telecom Ltd.
            </LoginFooter>
          </Box>
        </LoginBox>
      </LoginContainer>
      {showExtensionDialog && (
        <ExtensionDialog
          onSubmit={(extension) => {
            try {
              // Access updateUserExtension from AuthContext
              updateUserExtension(extension);

              // Update cookie also includes new userExtension
              const authData = Cookies.get("authData");
              if (authData) {
                const parsed = JSON.parse(authData);
                parsed.user.userExtension = extension;
                Cookies.set("authData", JSON.stringify(parsed), {
                  expires: new Date(new Date().getTime() + 8 * 60 * 60 * 1000),
                  path: "/",
                  secure: window.location.protocol === "https:",
                  sameSite: "Lax",
                });
              }

              // Optional: also store in localStorage for internal logic
              const baseData = JSON.parse(
                localStorage.getItem("baseUserData") || "{}"
              );
              baseData.userExtension = extension;
              localStorage.setItem("baseUserData", JSON.stringify(baseData));

              setShowExtensionDialog(false);
              navigate("/");
            } catch (err) {
              console.error("Error saving extension:", err);
              alert("Failed to save extension. Please retry.");
            }
          }}
        />
      )}
    </>
  );
};

export default Login;
