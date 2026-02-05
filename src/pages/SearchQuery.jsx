import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { Box, Typography, Button, Select, MenuItem, TextField, FormControl, InputLabel } from "@mui/material";
import { AuthContext } from "../context/AuthContext";

// Styled Components
const TabButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  marginBottom: "20px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  gap: "8px",
}));

const TabButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isActive",
})(({ theme, isActive }) => ({
  flex: 1,
  padding: "12px",
  backgroundColor: isActive ? theme.palette.primary.main : theme.palette.background.paper,
  color: isActive ? "#fff" : theme.palette.text.primary,
  border: `1px solid ${isActive ? theme.palette.primary.main : theme.palette.divider}`,
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: 500,
  transition: "all 0.3s ease",
  borderRadius: "6px 6px 0 0",
  textTransform: "none",
  "&:hover": {
    backgroundColor: isActive ? theme.palette.primary.main : theme.palette.action.hover,
  },
}));

const TabContent = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  padding: "20px",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "6px",
  boxShadow: theme.shadows[1],
}));

const SearchForm = styled("form")({
  display: "flex",
  flexDirection: "column",
  gap: "15px",
});

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  "& .MuiInputLabel-root": {
    fontWeight: 500,
    color: theme.palette.text.primary,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  marginTop: "6px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.divider,
    borderRadius: "6px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginTop: "6px",
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: theme.palette.background.paper,
    "& fieldset": {
      borderColor: theme.palette.divider,
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputBase-input": {
    color: theme.palette.text.primary,
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  padding: "12px",
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  fontSize: "15px",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "background 0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const ErrorMessage = styled(Typography)(({ theme }) => ({
  display: "block",
  color: theme.palette.error.main,
  fontSize: "0.85rem",
  marginTop: "4px",
}));

const SearchQuery = () => {
  const [activeTab, setActiveTab] = useState("serviceNumber");
  const [serviceNumber, setServiceNumber] = useState("");
  const [queryID, setQueryID] = useState("");
  const [error, setError] = useState("");
  const [airForceProfile, setAirForceProfile] = useState(null);

  useEffect(() => {
    try {
      const storedAFUser = localStorage.getItem("airForceUserDetails");

      if (storedAFUser) setAirForceProfile(JSON.parse(storedAFUser));
    } catch (err) {
      console.warn("Failed to load extended user profile:", err);
    }
  }, []);

  const categories = airForceProfile?.categoryQuery || [
    "AIRMEN",
    "OFFICER",
    "CIVILIAN",
  ];
  const [category, setCategory] = useState(categories[0] || "");

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");

    if (activeTab === "serviceNumber") {
      if (!serviceNumber.trim()) {
        setError("Please enter a Service Number");
        return;
      }
      navigate(
        `/search-results?type=Service&category=${encodeURIComponent(
          category
        )}&q=${serviceNumber}`
      );
    } else if (activeTab === "queryID") {
      if (!queryID.trim()) {
        setError("Please enter a Query ID");
        return;
      }
      navigate(`/search-results?type=Query&q=${queryID}`);
    }
  };

  return (
    <Box>
      <TabButtons>
        <TabButton
          onClick={() => {
            setActiveTab("serviceNumber");
            setError("");
          }}
          isActive={activeTab === "serviceNumber"}
        >
          Search by Service Number
        </TabButton>
        <TabButton
          onClick={() => {
            setActiveTab("queryID");
            setError("");
          }}
          isActive={activeTab === "queryID"}
        >
          Search by Query ID
        </TabButton>
      </TabButtons>

      {activeTab === "serviceNumber" && (
        <TabContent>
          <Typography variant="h6" sx={{ color: "text.primary", mb: 2 }}>
            Search by Service Number
          </Typography>
          <SearchForm onSubmit={handleSearch}>
            <StyledFormControl fullWidth>
              <InputLabel shrink>Category</InputLabel>
              <StyledSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={categories.length === 0}
                label="Category"
              >
                {categories.length > 0 ? (
                  categories.map((cat, idx) => (
                    <MenuItem key={idx} value={cat}>
                      {cat}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No categories available</MenuItem>
                )}
              </StyledSelect>
            </StyledFormControl>
            <StyledFormControl fullWidth>
              <InputLabel shrink>Service Number</InputLabel>
              <StyledTextField
                type="text"
                placeholder="Enter Service Number"
                value={serviceNumber}
                onChange={(e) => setServiceNumber(e.target.value)}
                size="small"
              />
            </StyledFormControl>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <SearchButton type="submit" variant="contained">
              Search
            </SearchButton>
          </SearchForm>
        </TabContent>
      )}

      {activeTab === "queryID" && (
        <TabContent>
          <Typography variant="h6" sx={{ color: "text.primary", mb: 2 }}>
            Search by Query ID
          </Typography>
          <SearchForm onSubmit={handleSearch}>
            <StyledFormControl fullWidth>
              <InputLabel shrink>Query ID</InputLabel>
              <StyledTextField
                type="text"
                placeholder="Enter Query ID"
                value={queryID}
                onChange={(e) => setQueryID(e.target.value)}
                size="small"
              />
            </StyledFormControl>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <SearchButton type="submit" variant="contained">
              Search
            </SearchButton>
          </SearchForm>
        </TabContent>
      )}
    </Box>
  );
};

export default SearchQuery;
