// data.js — in-memory data layer (API-shaped) with UI mappers
// When you wire real APIs, you can replace the CRUD bodies and keep the UI mappers intact.

// -----------------------------
// Code/Name dictionaries (mock)
// -----------------------------
const RANKS = {
  240: "Lieutenant",
  241: "Captain",
  242: "Major",
  243: "Colonel",
  244: "Brigadier",
  245: "General",
  246: "Sergeant",
  247: "JWO",
  248: "MWO",
  249: "Wing Commander",
  250: "Flying Officer",
};

const QUERY_MODES = {
  441: "Online",
  442: "Email",
  443: "Telephonically",
  444: "In-Person",
  445: "Letter",
};

const PRIORITIES = {
  2101: "Low",
  2102: "Medium",
  2103: "High",
  2104: "Urgent",
  // Keep sample domain label to mirror your example
  2111: "Court Case",
};

const FORWARD_STATUS = {
  410: "Open",
  415: "Pending",
  420: "Closed",
};

const FORWARD_SECTION = {
  13: "SP-AIRMEN",
  14: "Admin",
  15: "Personnel",
  16: "Records",
  17: "Finance",
  18: "Logistics",
  19: "Operations",
  20: "Medical",
  21: "Training",
  22: "Signals",
  23: "Policy",
  24: "Supply",
  25: "Welfare",
  26: "Planning",
};

const CATEGORY = {
  1148300: "LEAVE",
  1148356: "SERVICE PENSION",
  1148400: "PAYROLL",
  1148425: "DOCUMENTS",
  1148440: "IDENTITY",
  1148460: "TRANSFER",
  1148480: "GENERAL",
};

const SUBCATEGORY = {
  1148411: "Annual Leave",
  1148420: "Payslip Request",
  1148451: "CHANGE OF DOB CHILD",
  1148465: "Service Record",
  1148471: "ID Card Issue",
  1148478: "Transfer Posting",
  1148492: "General Assistance",
};

// -----------------------------
// Helpers
// -----------------------------
const INDIA = { countryId: 272, countryName: "India" };

// Very rough state → region buckets (for UI convenience)
function stateToRegion(stateName = "") {
  const s = stateName.toLowerCase();
  if (/(tamil|kerala|karnataka|telangana|andhra|pondicherry)/.test(s)) return "South";
  if (/(punjab|haryana|delhi|uttar|himachal|jammu|chandigarh)/.test(s)) return "North";
  if (/(maharashtra|goa|gujarat|rajasthan)/.test(s)) return "West";
  if (/(bengal|assam|bihar|odisha|jharkhand|tripura|manipur|mizoram|meghalaya|nagaland|sikkim)/.test(s)) return "East";
  return "Central";
}

function isoNow() {
  // match sample timezone format
  return new Date().toISOString();
}

function yyyy(dateIso) {
  return new Date(dateIso).getFullYear();
}

// -----------------------------
// Seed Services (API-shaped)
// -----------------------------
// We generate 24 realistic services using a base set.
const basePeople = [
  { fname: "RAJ KUMAR", lname: "BHATNAGAR", stateName: "PUNJAB", districtName: "S.A.S Nagar", addressLine1: "SAS NAGAR MOHALI", addressLine2: "CHANDIGARH", rank: 246 },
  { fname: "AMAN", lname: "KUMAR", stateName: "KARNATAKA", districtName: "BENGALURU", addressLine1: "12A Defence Colony", addressLine2: "Sector 7", rank: 241 },
  { fname: "NEHA", lname: "SHARMA", stateName: "PUNJAB", districtName: "LUDHIANA", addressLine1: "45B Cantonment Road", addressLine2: "Block C", rank: 242 },
  { fname: "RAVI", lname: "PATEL", stateName: "MAHARASHTRA", districtName: "MUMBAI", addressLine1: "7B Officers Lane", addressLine2: "Sector 2", rank: 240 },
  { fname: "ARUN", lname: "VERMA", stateName: "DELHI", districtName: "NEW DELHI", addressLine1: "HQ Complex", addressLine2: "Wing A", rank: 247 },
  { fname: "SUNIL", lname: "MEHTA", stateName: "RAJASTHAN", districtName: "JAIPUR", addressLine1: "Army Quarters", addressLine2: "Block D", rank: 249 },
  { fname: "KARAN", lname: "SINGH", stateName: "HARYANA", districtName: "GURUGRAM", addressLine1: "Command HQ", addressLine2: "Sector HQ", rank: 248 },
  { fname: "PRIYA", lname: "NAIR", stateName: "KERALA", districtName: "ERNAKULAM", addressLine1: "Cantonment Area", addressLine2: "House 5", rank: 249 },
  { fname: "ADITYA", lname: "GUPTA", stateName: "GUJARAT", districtName: "AHMEDABAD", addressLine1: "Air Base", addressLine2: "Quarters", rank: 246 },
  { fname: "SURESH", lname: "RAO", stateName: "TAMIL NADU", districtName: "CHENNAI", addressLine1: "Naval Quarters", addressLine2: "Wing B", rank: 250 },
  { fname: "MEENA", lname: "JOSHI", stateName: "UTTAR PRADESH", districtName: "LUCKNOW", addressLine1: "Military Base", addressLine2: "Sector Z", rank: 246 },
  { fname: "ROHIT", lname: "KHAN", stateName: "GOA", districtName: "PANAJI", addressLine1: "Officers Mess", addressLine2: "Building C", rank: 249 },
];

const servicesApi = [];
for (let i = 0; i < 24; i++) {
  const p = basePeople[i % basePeople.length];
  const serviceNo = String(701600 + i + 1); // e.g., 701601..701624
  const pinCode = 160000 + ((i * 37) % 900); // varied but plausible
  const mobileNo = 9300000000 + (i * 1234);
  const isdNo = 2101; // mock code for India
  const emailId = `${p.fname.toLowerCase().replace(/\s+/g, "")}.${p.lname.toLowerCase()}@example.com`;

  servicesApi.push({
    // --- API-shaped personal master (subset of fields commonly returned with queries) ---
    serviceNo,
    fname: p.fname,
    mname: i % 3 === 0 ? "R" : null,
    lname: p.lname,
    rank: p.rank,
    rankName: RANKS[p.rank],
    mobileNo,
    isdNo,
    isdName: "91",
    emailId,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    ...INDIA,
    stateId: 1000 + i,
    stateName: p.stateName,
    disticId: 1017000 + i,
    districtName: p.districtName,
    pinCode,
    // Helpful routing defaults
    forwardSection: 13 + (i % 10),
    forwardSectionName: FORWARD_SECTION[13 + (i % 10)],
    vetCat: "A",
    vetChkSuffix: null,
    ppoNo: null,
  });
}

// -----------------------------
// Seed Queries (API-shaped)
// -----------------------------
const queriesApi = [];
let nextQueryPk = 8000;

function seedQueriesForService(svc, count = 3) {
  for (let j = 1; j <= count; j++) {
    const queryPk = ++nextQueryPk;
    const modeCode = 441 + (j % 5); // rotate modes
    const priCode = [2102, 2103, 2101, 2104, 2111][(j + 1) % 5];
    const catCode = [1148356, 1148425, 1148400, 1148460, 1148440, 1148300, 1148480][(j + 2) % 7];
    const subMap = {
      1148356: 1148451,
      1148425: 1148465,
      1148400: 1148420,
      1148440: 1148471,
      1148460: 1148478,
      1148300: 1148411,
      1148480: 1148492,
    };
    const subCode = subMap[catCode];
    const nowIso = isoNow();
    const statusCode = [410, 415, 420][j % 3]; // Open/Pending/Closed

    const q = {
      // --- API response shape exactly as per your example ---
      queryPk,
      queryApexPk: null,
      queryNo: `${svc.serviceNo}-${yyyy(nowIso)}-I-${queryPk}`,
      queryDate: nowIso,
      caseType: 488, // sample domain code
      serviceNo: svc.serviceNo,
      vetCat: svc.vetCat,
      vetChkSuffix: null,
      ppoNo: null,

      // Personal snapshot (as many APIs do)
      fname: svc.fname,
      mname: svc.mname,
      lname: svc.lname,
      rank: svc.rank,
      rankName: svc.rankName,
      mobileNo: svc.mobileNo,
      isdNo: svc.isdNo,
      isdName: svc.isdName,
      emailId: svc.emailId,
      addressLine1: svc.addressLine1,
      addressLine2: svc.addressLine2,
      countryId: svc.countryId,
      countryName: svc.countryName,
      stateId: svc.stateId,
      stateName: svc.stateName,
      disticId: svc.disticId,
      districtName: svc.districtName,
      pinCode: svc.pinCode,

      // Query specifics
      queryMode: modeCode,
      queryModeName: QUERY_MODES[modeCode],
      queryPriotriy: priCode,
      queryPriotriyName: PRIORITIES[priCode],
      queryCategory: catCode,
      queryCategoryName: CATEGORY[catCode],
      subCategory: subCode,
      subCategoryName: SUBCATEGORY[subCode],
      oldqryRefNo: null,
      oldQryRefDt: null,
      queryMessage: `Sample message for ${SUBCATEGORY[subCode]} requested by ${svc.fname}.`,
      updFileName: null,

      // Status & routing
      queryStatus: statusCode === 420 ? "C" : statusCode === 415 ? "P" : "O",
      satisfyn: statusCode === 420 ? "Y" : "N",
      feedBackRemark: null,
      insReplyMessage: statusCode !== 410 ? "Acknowledged & under processing." : null,
      insReplyAttachFile: null,
      forwardStatus: statusCode,
      forwardStatusName: FORWARD_STATUS[statusCode],
      forwardSection: svc.forwardSection,
      forwardSectionName: svc.forwardSectionName,
      forwardDate: nowIso,

      // Section reply (if not open)
      secReply: statusCode !== 410 ? "Processed" : null,
      secReplyBy: statusCode !== 410 ? `USR${String(queryPk).slice(-2)}` : null,
      secReplyDate: statusCode !== 410 ? nowIso : null,
      secReplyAttachFile: null,
      secReplyMessage: statusCode === 420 ? "Resolution provided and case closed." : (statusCode === 415 ? "Pending additional documents." : null),
    };

    queriesApi.push(q);
  }
}

// Generate 3–5 queries for each service
servicesApi.forEach((svc, idx) => seedQueriesForService(svc, (idx % 3) + 3));

// Ensure at least one entry exactly like the example you provided
queriesApi.unshift({
  queryPk: 8015,
  queryApexPk: null,
  queryNo: "701662-2025-I-8015",
  queryDate: "2025-08-31T18:30:00.000+0000",
  caseType: 488,
  serviceNo: "701662",
  vetCat: "A",
  vetChkSuffix: null,
  ppoNo: null,
  fname: "RAJ KUMAR BHATNAGAR",
  mname: null,
  lname: null,
  rank: 246,
  rankName: "Sergeant",
  mobileNo: 9310318610,
  isdNo: 2101,
  isdName: "91",
  emailId: "rajkumarb14@gmail.com",
  addressLine1: "SAS NAGAR MOHALI",
  addressLine2: "CHANDIGARH",
  countryId: 272,
  countryName: "India ",
  stateId: 1020,
  stateName: "PUNJAB",
  disticId: 1017443,
  districtName: "BALIALI B.O , S.A.S Nagar",
  pinCode: 160055,
  queryMode: 443,
  queryModeName: "Telephonically",
  queryPriotriy: 2111,
  queryPriotriyName: "Court Case",
  queryCategory: 1148356,
  queryCategoryName: "SERVICE PENSION",
  subCategory: 1148451,
  subCategoryName: "CHANGE OF DOB CHILD",
  oldqryRefNo: null,
  oldQryRefDt: null,
  queryMessage: "Need to update Childern DOB",
  updFileName: null,
  queryStatus: "C",
  satisfyn: "Y",
  feedBackRemark: null,
  insReplyMessage: null,
  insReplyAttachFile: null,
  forwardStatus: 420,
  forwardStatusName: "Closed",
  forwardSection: 13,
  forwardSectionName: "SP-AIRMEN",
  forwardDate: "2025-09-01T08:39:36.000+0000",
  secReply: null,
  secReplyBy: "DAV31",
  secReplyDate: "2025-08-31T18:30:00.000+0000",
  secReplyAttachFile: null,
  secReplyMessage: "DOB Updated",
});

// -----------------------------
// UI Mappers (API → UI shapes)
// -----------------------------
function apiServiceToUI(s) {
  if (!s) return null;
  return {
    serviceNo: s.serviceNo,
    rank: s.rankName || RANKS[s.rank] || "-",
    firstName: s.fname || "",
    middleName: s.mname || "",
    lastName: s.lname || "",
    address1: s.addressLine1 || "",
    address2: s.addressLine2 || "",
    region: stateToRegion(s.stateName),
    state: s.stateName || "",
    isdCode: s.isdName || "",
    mobile: String(s.mobileNo || ""),
    email: s.emailId || "",
    countryName: s.countryName || "",
    pincode: s.pinCode || "",
    forwardSectionName: s.forwardSectionName || "",
  };
}

// Preferred UI list row shape for QueryView.jsx
function apiQueryToUI(q) {
  const status =
    q.forwardStatusName ||
    (q.queryStatus === "C" ? "Closed" : q.queryStatus === "P" ? "Pending" : "Open");
  const date = (q.queryDate || "").slice(0, 10); // YYYY-MM-DD
  const subject = q.subCategoryName || q.queryCategoryName || "Query";
  return {
    id: String(q.queryPk || q.queryNo),
    serviceNo: q.serviceNo,
    queryNo: q.queryNo,
    subject,
    status,
    date,
    priority: q.queryPriotriyName || "-",
  };
}

// -----------------------------
// Public API (mocked)
// -----------------------------
function getServiceByNo(serviceNo) {
  const s = servicesApi.find(
    (x) => String(x.serviceNo).toUpperCase() === String(serviceNo || "").toUpperCase()
  );
  return apiServiceToUI(s);
}

function getQueriesByService(serviceNo) {
  const list = queriesApi.filter(
    (q) => String(q.serviceNo).toUpperCase() === String(serviceNo || "").toUpperCase()
  );
  // Sort most recent first
  list.sort((a, b) => new Date(b.queryDate) - new Date(a.queryDate));
  return list.map(apiQueryToUI);
}

function getRemarksByQueryNo(queryNo) {
  const q = queriesApi.find((x) => x.queryNo === queryNo || String(x.queryPk) === String(queryNo));
  if (!q) return [];
  // Build a conversational timeline from API fields
  const timeline = [];
  if (q.queryMessage) {
    timeline.push({
      id: 1,
      sender: "User",
      text: q.queryMessage,
      date: (q.queryDate || "").replace("T", " ").split(".")[0],
    });
  }
  if (q.insReplyMessage) {
    timeline.push({
      id: 2,
      sender: "Section",
      text: q.insReplyMessage,
      date: (q.forwardDate || q.queryDate || "").replace("T", " ").split(".")[0],
    });
  }
  if (q.secReplyMessage) {
    timeline.push({
      id: 3,
      sender: q.forwardSectionName || "Section",
      text: q.secReplyMessage,
      date: (q.secReplyDate || q.forwardDate || "").replace("T", " ").split(".")[0],
    });
  }
  if (q.feedBackRemark) {
    timeline.push({
      id: 4,
      sender: "User",
      text: q.feedBackRemark,
      date: (q.secReplyDate || q.forwardDate || q.queryDate || "").replace("T", " ").split(".")[0],
    });
  }
  return timeline;
}

function createQuery(payload) {
  // payload is UI-shaped coming from NewQuery.jsx: { serviceNo, category, subCategory, queryPriority, modeOfQuery, queryMessage, subject? }
  if (!payload || !payload.serviceNo) {
    throw new Error("createQuery: payload must include serviceNo");
  }
  const svc = servicesApi.find(
    (x) => String(x.serviceNo).toUpperCase() === String(payload.serviceNo).toUpperCase()
  );
  if (!svc) {
    throw new Error(`createQuery: unknown serviceNo ${payload.serviceNo}`);
  }

  const queryPk = ++nextQueryPk;
  const now = isoNow();
  const priCode =
    Number(
      Object.keys(PRIORITIES).find((k) => PRIORITIES[k] === payload.queryPriority) || 2102
    ) || 2102;
  const modeCode =
    Number(Object.keys(QUERY_MODES).find((k) => QUERY_MODES[k] === payload.modeOfQuery) || 441) ||
    441;

  // Try to map names to codes; fall back to a generic category if not found
  const catCode =
    Number(Object.keys(CATEGORY).find((k) => CATEGORY[k] === payload.category)) || 1148480;
  const subCode =
    Number(Object.keys(SUBCATEGORY).find((k) => SUBCATEGORY[k] === payload.subCategory)) ||
    1148492;

  const apiObj = {
    queryPk,
    queryApexPk: null,
    queryNo: `${svc.serviceNo}-${yyyy(now)}-I-${queryPk}`,
    queryDate: now,
    caseType: 488,
    serviceNo: svc.serviceNo,
    vetCat: svc.vetCat || "A",
    vetChkSuffix: null,
    ppoNo: null,

    // snapshot of service
    fname: svc.fname,
    mname: svc.mname,
    lname: svc.lname,
    rank: svc.rank,
    rankName: svc.rankName,
    mobileNo: svc.mobileNo,
    isdNo: svc.isdNo,
    isdName: svc.isdName,
    emailId: svc.emailId,
    addressLine1: svc.addressLine1,
    addressLine2: svc.addressLine2,
    countryId: svc.countryId,
    countryName: svc.countryName,
    stateId: svc.stateId,
    stateName: svc.stateName,
    disticId: svc.disticId,
    districtName: svc.districtName,
    pinCode: svc.pinCode,

    // query specifics
    queryMode: modeCode,
    queryModeName: QUERY_MODES[modeCode],
    queryPriotriy: priCode,
    queryPriotriyName: PRIORITIES[priCode],
    queryCategory: catCode,
    queryCategoryName: CATEGORY[catCode],
    subCategory: subCode,
    subCategoryName: SUBCATEGORY[subCode],
    oldqryRefNo: null,
    oldQryRefDt: null,
    queryMessage: payload.queryMessage || "",
    updFileName: null,

    // initial status routing
    queryStatus: "O",
    satisfyn: "N",
    feedBackRemark: null,
    insReplyMessage: "Acknowledged.",
    insReplyAttachFile: null,
    forwardStatus: 410,
    forwardStatusName: FORWARD_STATUS[410],
    forwardSection: svc.forwardSection,
    forwardSectionName: svc.forwardSectionName,
    forwardDate: now,

    secReply: null,
    secReplyBy: null,
    secReplyDate: null,
    secReplyAttachFile: null,
    secReplyMessage: null,
  };

  queriesApi.unshift(apiObj);
  return apiObj;
}

function getAllServices() {
  // Return as UI-shaped list
  return servicesApi.map(apiServiceToUI);
}

function getAllQueries() {
  // Return as UI-shaped list (most recent first)
  return queriesApi
    .slice()
    .sort((a, b) => new Date(b.queryDate) - new Date(a.queryDate))
    .map(apiQueryToUI);
}

// -----------------------------
// Exports
// -----------------------------
// Export raw API-shaped stores under previous names for convenience,
// plus the helper functions the UI uses.
export {
  servicesApi as services,   // API-shaped
  queriesApi as queries,     // API-shaped

  getServiceByNo,            // UI-shaped return
  getQueriesByService,       // UI-shaped return
  getRemarksByQueryNo,       // UI-shaped return
  createQuery,               // accepts UI-shaped payload, returns API-shaped object
  getAllServices,            // UI-shaped
  getAllQueries,             // UI-shaped

  // Optionally export dictionaries if needed elsewhere
  RANKS,
  QUERY_MODES,
  PRIORITIES,
  CATEGORY,
  SUBCATEGORY,
  FORWARD_STATUS,
  FORWARD_SECTION,
};
