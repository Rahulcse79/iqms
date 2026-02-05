import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Box, Typography, Button, Select, MenuItem, TextField, Table, TableBody, TableCell, TableHead, TableRow, Paper } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOfficerBasicPayReason,
  fetchOfficerRankHistory,
  fetchOfficerPersmast,
  fetchAirmanBasicPayReason,
  fetchAirmanRankHistory,
  fetchAirmanPersmast,
} from "../actions/allAction";

// Styled Components
const ComparisonContainer = styled(Box)(({ theme }) => ({
  padding: "40px 20px",
  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: theme.palette.background.default,
  color: theme.palette.text.primary,
  [theme.breakpoints.down("md")]: {
    padding: "20px 10px",
  },
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  marginBottom: "18px",
  fontSize: "22px",
  color: theme.palette.text.primary,
  fontWeight: 700,
  textAlign: "center",
  [theme.breakpoints.down("sm")]: {
    fontSize: "18px",
  },
}));

const ComparisonForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  background: theme.palette.background.paper,
  padding: "20px 22px",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "10px",
  boxShadow: theme.shadows[1],
  width: "100%",
  maxWidth: "920px",
  "& label": {
    display: "flex",
    flexDirection: "column",
    fontWeight: 600,
    color: theme.palette.text.primary,
    fontSize: "14px",
  },
  [theme.breakpoints.down("md")]: {
    maxWidth: "90%",
  },
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
    padding: "16px",
  },
}));

const StyledInput = styled(TextField)(({ theme }) => ({
  marginTop: "8px",
  "& .MuiOutlinedInput-root": {
    fontSize: "14px",
    borderRadius: "6px",
    background: theme.palette.background.paper,
    "& fieldset": {
      borderColor: theme.palette.divider,
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 6px ${theme.palette.primary.light}`,
    },
  },
  "& .MuiInputBase-input": {
    color: theme.palette.text.primary,
    padding: "10px 12px",
  },
  [theme.breakpoints.down("sm")]: {
    "& .MuiInputBase-input": {
      fontSize: "13px",
      padding: "8px 10px",
    },
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  marginTop: "8px",
  fontSize: "14px",
  borderRadius: "6px",
  background: theme.palette.background.paper,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.divider,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 6px ${theme.palette.primary.light}`,
  },
  "& .MuiSelect-select": {
    color: theme.palette.text.primary,
    padding: "10px 12px",
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  padding: "12px",
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  fontSize: "15px",
  fontWeight: 700,
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "all 0.18s ease",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[2],
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "14px",
    padding: "10px",
  },
}));

const ComparisonResults = styled(Box)({
  width: "auto",
  maxWidth: "1200px",
  marginTop: "26px",
});

const ResultsHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
  flexWrap: "wrap",
  gap: "10px",
  "& h3": {
    margin: 0,
    fontSize: "15px",
    color: theme.palette.text.primary,
    background: theme.palette.background.paper,
    padding: "8px 12px",
    borderRadius: "6px",
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

const PrintButton = styled(Button)(({ theme }) => ({
  padding: "8px 12px",
  background: theme.palette.text.primary,
  color: theme.palette.background.default,
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
  transition: "background 0.2s ease",
  "&:hover": {
    background: theme.palette.primary.main,
    color: "#fff",
  },
}));

const CardsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "18px",
  padding: "20px",
  alignItems: "flex-start",
  background: theme.palette.background.paper,
  flexWrap: "wrap",
  [theme.breakpoints.down("md")]: {
    gap: "14px",
    padding: "16px",
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    padding: "12px",
  },
}));

const LabelSearchBox = styled(Box)({
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-evenly",
  "& input": {
    width: "auto",
  },
});

const CardComparison = styled(Box)(({ theme }) => ({
  flex: 1,
  borderRadius: "6px",
  overflow: "hidden",
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  minWidth: "280px",
}));

const CardTop = styled(Box)(({ theme }) => ({
  background: theme.palette.background.default,
  padding: "10px 14px",
  fontWeight: 700,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const CardBody = styled(Box)(({ theme }) => ({
  padding: "12px 14px 18px",
  color: theme.palette.text.primary,
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  fontSize: "16px",
  marginBottom: "10px",
  color: theme.palette.text.primary,
  [theme.breakpoints.down("sm")]: {
    fontSize: "14px",
  },
}));

const InfoTable = styled(Table)(({ theme }) => ({
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "12px",
  "& td": {
    padding: "8px 10px",
    border: `1px solid ${theme.palette.divider}`,
    fontSize: "13px",
    color: theme.palette.text.primary,
    background: theme.palette.background.default,
  },
  [theme.breakpoints.down("sm")]: {
    "& td": {
      fontSize: "12px",
      padding: "6px 8px",
    },
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: "8px",
  fontWeight: 700,
  color: theme.palette.text.primary,
  fontSize: "13px",
}));

const RankTable = styled(Table)(({ theme }) => ({
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "8px",
  "& th, & td": {
    padding: "8px 10px",
    border: `1px solid ${theme.palette.divider}`,
    fontSize: "13px",
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
  },
  "& thead": {
    background: theme.palette.background.paper,
    fontWeight: 700,
  },
  [theme.breakpoints.down("sm")]: {
    "& th, & td": {
      fontSize: "12px",
      padding: "6px 8px",
    },
  },
}));

const Comparison = () => {
  const dispatch = useDispatch();

  const [seniorServiceNumber, setSeniorServiceNumber] = useState("");
  const [juniorServiceNumber, setJuniorServiceNumber] = useState("");
  const [selectCategory, setSelectCategory] = useState("Airmen");
  const [result, setResult] = useState(null);

  // global slices (reducers should have shape: { data: { [sno]: payload }, loading, error })
  const airmanPersmastSlice = useSelector((state) => state.airmanPersmast);
  const airmanBasicPaySlice = useSelector(
    (state) => state.airmanBasicPayReason
  );
  const airmanRankSlice = useSelector((state) => state.airmanRankHistory);

  const officerPersmastSlice = useSelector((state) => state.officerPersmast);
  const officerBasicPaySlice = useSelector(
    (state) => state.officerBasicPayReason
  );
  const officerRankSlice = useSelector((state) => state.officerRankHistory);

  // helper to read keyed-by-sno from slice safely
  const getFromSlice = (slice, sno) => {
    if (!slice || !sno) return null;
    // slice.data might be undefined initially
    return slice.data ? slice.data[sno] ?? null : null;
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (!seniorServiceNumber || !juniorServiceNumber) {
      alert("Please fill in all fields before searching.");
      return;
    }

    if (selectCategory === "Officer") {
      // Senior
      dispatch(fetchOfficerPersmast(seniorServiceNumber));
      dispatch(fetchOfficerBasicPayReason(seniorServiceNumber));
      dispatch(fetchOfficerRankHistory(seniorServiceNumber));
      // Junior
      dispatch(fetchOfficerPersmast(juniorServiceNumber));
      dispatch(fetchOfficerBasicPayReason(juniorServiceNumber));
      dispatch(fetchOfficerRankHistory(juniorServiceNumber));
    } else {
      // Airmen
      dispatch(fetchAirmanPersmast(seniorServiceNumber));
      dispatch(fetchAirmanBasicPayReason(seniorServiceNumber));
      dispatch(fetchAirmanRankHistory(seniorServiceNumber));
      // Junior
      dispatch(fetchAirmanPersmast(juniorServiceNumber));
      dispatch(fetchAirmanBasicPayReason(juniorServiceNumber));
      dispatch(fetchAirmanRankHistory(juniorServiceNumber));
    }

    setResult({
      category: selectCategory,
      senior: seniorServiceNumber,
      junior: juniorServiceNumber,
    });

    // scroll to results
    setTimeout(() => {
      const el = document.querySelector(".comparison-results");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const printReport = () => {
    window.print();
  };

  // Build a normalized person object for rendering
  // persData can be either: an object (persmast single object) or { items: [...] } depending on your action payload
  const normalizePers = (persData) => {
    if (!persData) return null;
    // if reducer stored single object (payload = data.items?.[0] || {}), persData is an object with sno etc
    if (persData.sno || persData.p_name) return persData;
    // if reducer stored { items: [...] } or array
    if (Array.isArray(persData)) return persData[0] || null;
    if (persData.items && persData.items.length) return persData.items[0];
    return null;
  };

  // payData and rankData are expected to be arrays OR { items: [...] } depending on how actions dispatch.
  const normalizeArray = (arrOrObj) => {
    if (!arrOrObj) return [];
    if (Array.isArray(arrOrObj)) return arrOrObj;
    if (arrOrObj.items && Array.isArray(arrOrObj.items)) return arrOrObj.items;
    return [];
  };

  // pick the right slices & per-sno entry
  const seniorPersRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerPersmastSlice,
          result?.senior || seniorServiceNumber
        )
      : getFromSlice(
          airmanPersmastSlice,
          result?.senior || seniorServiceNumber
        );

  const juniorPersRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerPersmastSlice,
          result?.junior || juniorServiceNumber
        )
      : getFromSlice(
          airmanPersmastSlice,
          result?.junior || juniorServiceNumber
        );

  const seniorPayRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerBasicPaySlice,
          result?.senior || seniorServiceNumber
        )
      : getFromSlice(
          airmanBasicPaySlice,
          result?.senior || seniorServiceNumber
        );

  const juniorPayRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerBasicPaySlice,
          result?.junior || juniorServiceNumber
        )
      : getFromSlice(
          airmanBasicPaySlice,
          result?.junior || juniorServiceNumber
        );

  const seniorRankRaw =
    selectCategory === "Officer"
      ? getFromSlice(officerRankSlice, result?.senior || seniorServiceNumber)
      : getFromSlice(airmanRankSlice, result?.senior || seniorServiceNumber);

  const juniorRankRaw =
    selectCategory === "Officer"
      ? getFromSlice(officerRankSlice, result?.junior || juniorServiceNumber)
      : getFromSlice(airmanRankSlice, result?.junior || juniorServiceNumber);

  // normalized for rendering
  const seniorPerson = normalizePers(seniorPersRaw);
  const juniorPerson = normalizePers(juniorPersRaw);
  const seniorPayList = normalizeArray(seniorPayRaw);
  const juniorPayList = normalizeArray(juniorPayRaw);
  const seniorRankList = normalizeArray(seniorRankRaw);
  const juniorRankList = normalizeArray(juniorRankRaw);

  // console logs to help debugging
  useEffect(() => {
    console.log("selectCategory:", selectCategory);
    console.log("seniorServiceNumber:", seniorServiceNumber);
    console.log("juniorServiceNumber:", juniorServiceNumber);

    console.log("airmanPersmastSlice:", airmanPersmastSlice);
    console.log("airmanBasicPaySlice:", airmanBasicPaySlice);
    console.log("airmanRankSlice:", airmanRankSlice);

    console.log("officerPersmastSlice:", officerPersmastSlice);
    console.log("officerBasicPaySlice:", officerBasicPaySlice);
    console.log("officerRankSlice:", officerRankSlice);

    console.log("seniorPerson:", seniorPerson);
    console.log("juniorPerson:", juniorPerson);
    console.log("seniorPayList:", seniorPayList);
    console.log("juniorPayList:", juniorPayList);
    console.log("seniorRankList:", seniorRankList);
    console.log("juniorRankList:", juniorRankList);
  }, [
    selectCategory,
    seniorServiceNumber,
    juniorServiceNumber,
    airmanPersmastSlice,
    airmanBasicPaySlice,
    airmanRankSlice,
    officerPersmastSlice,
    officerBasicPaySlice,
    officerRankSlice,
    seniorPerson,
    juniorPerson,
    seniorPayList,
    juniorPayList,
    seniorRankList,
    juniorRankList,
  ]);

  // Card renderer (uses normalized objects/arrays)
  const renderCard = (
    person,
    payList,
    rankList,
    label,
    sliceLoading,
    sliceError
  ) => {
    if (
      sliceLoading &&
      !person &&
      payList.length === 0 &&
      rankList.length === 0
    ) {
      return <CardComparison>{label}: Loading...</CardComparison>;
    }

    if (!person && payList.length === 0 && rankList.length === 0) {
      return <CardComparison>{label}: No Data Found</CardComparison>;
    }

    return (
      <CardComparison>
        <CardTop>
          {label} • {person?.sno || "-"}
        </CardTop>

        <CardBody>
          {/* PERSMAST */}
          <CardTitle>PERSMAST</CardTitle>
          <InfoTable>
            <TableBody>
              <TableRow>
                <TableCell>Cell</TableCell>
                <TableCell>{person?.cell ?? "-"}</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>{person?.unit_name ?? person?.unitname ?? "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Service No</TableCell>
                <TableCell>{person?.sno ?? "-"}</TableCell>
                <TableCell>Rank</TableCell>
                <TableCell>{person?.rank ?? person?.rankname ?? "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Trade / Branch</TableCell>
                <TableCell>{person?.tradename ?? person?.branch_name ?? "-"}</TableCell>
                <TableCell>DOE</TableCell>
                <TableCell>
                  {person?.enrldt
                    ? person.enrldt
                    : "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell colSpan={3}>{person?.p_name ?? "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>CS</TableCell>
                <TableCell>{person?.cs ?? "-"}</TableCell>
                <TableCell>Unit Code</TableCell>
                <TableCell>{person?.unitcd ?? "-"}</TableCell>
              </TableRow>
            </TableBody>
          </InfoTable>

          {/* RANK HISTORY */}
          <SectionTitle>Rank History</SectionTitle>
          {rankList.length === 0 ? (
            <Typography>No rank history.</Typography>
          ) : (
            <RankTable>
              <TableHead>
                <TableRow>
                  <TableCell>S No.</TableCell>
                  <TableCell>Rank</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Opt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankList.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{r.rank ?? "-"}</TableCell>
                    <TableCell>
                      {r.hp_date
                        ? r.hp_date
                        : r.wef
                        ? r.wef
                        : "-"}
                    </TableCell>
                    <TableCell>{r.type ?? "-"}</TableCell>
                    <TableCell>{r.opt ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </RankTable>
          )}

          {/* BASIC PAY REASON */}
          <SectionTitle>Basic Pay Reason</SectionTitle>
          {payList.length === 0 ? (
            <Typography>No pay entries.</Typography>
          ) : (
            <InfoTable>
              <TableHead>
                <TableRow>
                  <TableCell>S No.</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>WEF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payList.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{p.description ?? p.desc ?? "-"}</TableCell>
                    <TableCell>{p.rate ?? p.amount ?? "-"}</TableCell>
                    <TableCell>
                      {p.wef
                        ? p.wef
                        : p.hp_date
                        ? p.hp_date
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </InfoTable>
          )}
        </CardBody>
      </CardComparison>
    );
  };

  // determine which slice-level loading/error to use (simple heuristic)
  const sliceLoading =
    selectCategory === "Officer"
      ? officerPersmastSlice?.loading ||
        officerBasicPaySlice?.loading ||
        officerRankSlice?.loading
      : airmanPersmastSlice?.loading ||
        airmanBasicPaySlice?.loading ||
        airmanRankSlice?.loading;

  const sliceError =
    selectCategory === "Officer"
      ? officerPersmastSlice?.error ||
        officerBasicPaySlice?.error ||
        officerRankSlice?.error
      : airmanPersmastSlice?.error ||
        airmanBasicPaySlice?.error ||
        airmanRankSlice?.error;

  return (
    <ComparisonContainer>
      <PageTitle variant="h2">Comparative Statement</PageTitle>

      <ComparisonForm onSubmit={handleSearch}>
        <label>
          Select Category
          <StyledSelect
            value={selectCategory}
            onChange={(e) => setSelectCategory(e.target.value)}
            size="small"
          >
            <MenuItem value="Airmen">Airmen</MenuItem>
            <MenuItem value="Officer">Officer</MenuItem>
          </StyledSelect>
        </label>

        <LabelSearchBox>
          <label>
            Senior Service Number
            <StyledInput
              type="text"
              placeholder="Enter Senior Service No"
              value={seniorServiceNumber}
              onChange={(e) => setSeniorServiceNumber(e.target.value.trim())}
              size="small"
            />
          </label>

          <label>
            Junior Service Number
            <StyledInput
              type="text"
              placeholder="Enter Junior Service No"
              value={juniorServiceNumber}
              onChange={(e) => setJuniorServiceNumber(e.target.value.trim())}
              size="small"
            />
          </label>
        </LabelSearchBox>

        <SearchButton type="submit" variant="contained">
          Create Comparative Statement
        </SearchButton>
      </ComparisonForm>

      {result && (
        <ComparisonResults>
          <ResultsHeader>
            <PrintButton onClick={printReport}>
              Print Report
            </PrintButton>
          </ResultsHeader>

          <CardsContainer>
            {renderCard(
              seniorPerson,
              seniorPayList,
              seniorRankList,
              "Senior",
              sliceLoading,
              sliceError
            )}
            {renderCard(
              juniorPerson,
              juniorPayList,
              juniorRankList,
              "Junior",
              sliceLoading,
              sliceError
            )}
          </CardsContainer>
        </ComparisonResults>
      )}
    </ComparisonContainer>
  );
};

export default Comparison;
