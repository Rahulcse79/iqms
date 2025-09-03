// data.js — simple in-memory data layer (mock DB)
// Replace implementations with API calls when ready.

const services = [
  {
    serviceNo: "SVC1001",
    rank: "Captain",
    firstName: "Aman",
    middleName: "R",
    lastName: "Kumar",
    address1: "12A Defence Colony",
    address2: "Sector 7",
    region: "South",
    state: "Karnataka",
    isdCode: "91",
    mobile: "9876543210",
    email: "aman.kumar@example.com",
    pincode: "560001",
    country: "India",
    forwardedSection: "Admin",
  },
  {
    serviceNo: "SVC1002",
    rank: "Major",
    firstName: "Neha",
    middleName: "T",
    lastName: "Sharma",
    address1: "45B Cantonment Road",
    address2: "Block C",
    region: "North",
    state: "Punjab",
    isdCode: "91",
    mobile: "9810012345",
    email: "neha.sharma@example.com",
    pincode: "140001",
    country: "India",
    forwardedSection: "Personnel",
  },
  {
    serviceNo: "SVC2001",
    rank: "Lieutenant",
    firstName: "Ravi",
    middleName: "",
    lastName: "Patel",
    address1: "7B Officers Lane",
    address2: "Sector 2",
    region: "West",
    state: "Maharashtra",
    isdCode: "91",
    mobile: "9920012345",
    email: "ravi.patel@example.com",
    pincode: "400001",
    country: "India",
    forwardedSection: "Records",
  },
  {
    serviceNo: "SVC2002",
    rank: "Colonel",
    firstName: "Arun",
    middleName: "K",
    lastName: "Verma",
    address1: "HQ Complex",
    address2: "Wing A",
    region: "North",
    state: "Delhi",
    isdCode: "91",
    mobile: "9811122233",
    email: "arun.verma@example.com",
    pincode: "110001",
    country: "India",
    forwardedSection: "Finance",
  },
  {
    serviceNo: "SVC2003",
    rank: "Brigadier",
    firstName: "Sunil",
    middleName: "P",
    lastName: "Mehta",
    address1: "Army Quarters",
    address2: "Block D",
    region: "West",
    state: "Rajasthan",
    isdCode: "91",
    mobile: "9822223344",
    email: "sunil.mehta@example.com",
    pincode: "302001",
    country: "India",
    forwardedSection: "Logistics",
  },
  {
    serviceNo: "SVC2004",
    rank: "General",
    firstName: "Karan",
    middleName: "J",
    lastName: "Singh",
    address1: "Command HQ",
    address2: "Sector HQ",
    region: "North",
    state: "Haryana",
    isdCode: "91",
    mobile: "9877700000",
    email: "karan.singh@example.com",
    pincode: "122001",
    country: "India",
    forwardedSection: "Operations",
  },
  {
    serviceNo: "SVC3001",
    rank: "Lieutenant",
    firstName: "Priya",
    middleName: "",
    lastName: "Nair",
    address1: "Cantonment Area",
    address2: "House 5",
    region: "South",
    state: "Kerala",
    isdCode: "91",
    mobile: "9447012345",
    email: "priya.nair@example.com",
    pincode: "682001",
    country: "India",
    forwardedSection: "Medical",
  },
  {
    serviceNo: "SVC3002",
    rank: "Captain",
    firstName: "Aditya",
    middleName: "",
    lastName: "Gupta",
    address1: "Air Base",
    address2: "Quarters",
    region: "West",
    state: "Gujarat",
    isdCode: "91",
    mobile: "9898012345",
    email: "aditya.gupta@example.com",
    pincode: "380001",
    country: "India",
    forwardedSection: "Training",
  },
  {
    serviceNo: "SVC3003",
    rank: "Major",
    firstName: "Suresh",
    middleName: "L",
    lastName: "Rao",
    address1: "Naval Quarters",
    address2: "Wing B",
    region: "South",
    state: "Tamil Nadu",
    isdCode: "91",
    mobile: "9448012345",
    email: "suresh.rao@example.com",
    pincode: "600001",
    country: "India",
    forwardedSection: "Navy Ops",
  },
  {
    serviceNo: "SVC3004",
    rank: "Captain",
    firstName: "Meena",
    middleName: "",
    lastName: "Joshi",
    address1: "Military Base",
    address2: "Sector Z",
    region: "North",
    state: "Uttar Pradesh",
    isdCode: "91",
    mobile: "9888012345",
    email: "meena.joshi@example.com",
    pincode: "226001",
    country: "India",
    forwardedSection: "HR",
  },
  {
    serviceNo: "SVC4001",
    rank: "Lieutenant",
    firstName: "Rohit",
    middleName: "M",
    lastName: "Khan",
    address1: "Officers Mess",
    address2: "Building C",
    region: "West",
    state: "Goa",
    isdCode: "91",
    mobile: "9876512345",
    email: "rohit.khan@example.com",
    pincode: "403001",
    country: "India",
    forwardedSection: "Supply",
  },
  {
    serviceNo: "SVC4002",
    rank: "Colonel",
    firstName: "Nikita",
    middleName: "S",
    lastName: "Bose",
    address1: "Air Wing",
    address2: "HQ",
    region: "East",
    state: "West Bengal",
    isdCode: "91",
    mobile: "9830012345",
    email: "nikita.bose@example.com",
    pincode: "700001",
    country: "India",
    forwardedSection: "Aviation",
  },
  {
    serviceNo: "SVC4003",
    rank: "Brigadier",
    firstName: "Deepak",
    middleName: "R",
    lastName: "Shah",
    address1: "Camp Area",
    address2: "Barrack 12",
    region: "North",
    state: "Himachal Pradesh",
    isdCode: "91",
    mobile: "9873012345",
    email: "deepak.shah@example.com",
    pincode: "171001",
    country: "India",
    forwardedSection: "Signals",
  },
  {
    serviceNo: "SVC4004",
    rank: "General",
    firstName: "Vikram",
    middleName: "",
    lastName: "Chauhan",
    address1: "Defence HQ",
    address2: "Block E",
    region: "North",
    state: "Delhi",
    isdCode: "91",
    mobile: "9811111111",
    email: "vikram.chauhan@example.com",
    pincode: "110002",
    country: "India",
    forwardedSection: "Policy",
  },
  {
    serviceNo: "SVC5001",
    rank: "Major",
    firstName: "Anjali",
    middleName: "P",
    lastName: "Desai",
    address1: "Air Base",
    address2: "Quarter 22",
    region: "West",
    state: "Maharashtra",
    isdCode: "91",
    mobile: "9922113344",
    email: "anjali.desai@example.com",
    pincode: "411001",
    country: "India",
    forwardedSection: "Training",
  },
  {
    serviceNo: "SVC5002",
    rank: "Captain",
    firstName: "Kabir",
    middleName: "H",
    lastName: "Yadav",
    address1: "Naval Dockyard",
    address2: "Dock 7",
    region: "West",
    state: "Maharashtra",
    isdCode: "91",
    mobile: "9988776655",
    email: "kabir.yadav@example.com",
    pincode: "400002",
    country: "India",
    forwardedSection: "Maintenance",
  },
  {
    serviceNo: "SVC5003",
    rank: "Lieutenant",
    firstName: "Swati",
    middleName: "N",
    lastName: "Reddy",
    address1: "Cantonment Road",
    address2: "House 9",
    region: "South",
    state: "Telangana",
    isdCode: "91",
    mobile: "9123456789",
    email: "swati.reddy@example.com",
    pincode: "500001",
    country: "India",
    forwardedSection: "Welfare",
  },
  {
    serviceNo: "SVC5004",
    rank: "Colonel",
    firstName: "Ramesh",
    middleName: "V",
    lastName: "Menon",
    address1: "Camp Office",
    address2: "HQ South",
    region: "South",
    state: "Kerala",
    isdCode: "91",
    mobile: "9447011111",
    email: "ramesh.menon@example.com",
    pincode: "682002",
    country: "India",
    forwardedSection: "Planning",
  },
  {
    serviceNo: "SVC5005",
    rank: "Brigadier",
    firstName: "Alok",
    middleName: "",
    lastName: "Chatterjee",
    address1: "Cantonment Quarters",
    address2: "East Block",
    region: "East",
    state: "Assam",
    isdCode: "91",
    mobile: "9706012345",
    email: "alok.chatterjee@example.com",
    pincode: "781001",
    country: "India",
    forwardedSection: "Border Ops",
  },
];

// Generate some queries (3–5 per service for realism)
const queries = [];

services.forEach((s, i) => {
  const subjects = [
    "Leave Approval",
    "Document Request",
    "Salary Discrepancy",
    "Transfer Request",
    "ID Card Issue",
  ];
  const statuses = ["Active", "Pending", "Closed"];
  const priorities = ["Low", "Medium", "High", "Urgent"];
  const modes = ["Online", "Email", "Phone", "In-Person"];

  for (let j = 1; j <= Math.floor(Math.random() * 3) + 2; j++) {
    queries.push({
      id: `${s.serviceNo}-${j}`,
      serviceNo: s.serviceNo,
      queryNo: `${s.serviceNo}-Q${String(j).padStart(3, "0")}`,
      subject: subjects[(i + j) % subjects.length],
      category: subjects[(i + j) % subjects.length].split(" ")[0],
      subCategory: subjects[(i + j) % subjects.length],
      status: statuses[(i + j) % statuses.length],
      date: `2025-0${(i % 9) + 1}-${String((j * 3) % 28 + 1).padStart(2, "0")}`,
      priority: priorities[(i + j) % priorities.length],
      mode: modes[(i + j) % modes.length],
      message: `This is a dummy message for ${subjects[(i + j) % subjects.length]} query of ${s.serviceNo}.`,
      remarks: [
        { id: 1, sender: "User", text: "Initial request submitted.", date: "2025-08-01 09:00" },
        { id: 2, sender: "Officer", text: "Acknowledged.", date: "2025-08-02 11:00" },
      ],
    });
  }
});

// Utilities
function getServiceByNo(serviceNo) {
  if (!serviceNo) return null;
  return services.find((s) => s.serviceNo.toUpperCase() === serviceNo.toUpperCase()) || null;
}

function getQueriesByService(serviceNo) {
  if (!serviceNo) return [];
  return queries.filter((q) => q.serviceNo.toUpperCase() === serviceNo.toUpperCase());
}

function getRemarksByQueryNo(queryNo) {
  if (!queryNo) return [];
  const q = queries.find((x) => x.queryNo === queryNo || x.id === queryNo);
  return q ? q.remarks || [] : [];
}

function createQuery(payload) {
  if (!payload || !payload.serviceNo) {
    throw new Error("createQuery: payload must include serviceNo");
  }

  const serviceNo = payload.serviceNo.toUpperCase();
  const existing = queries.filter((q) => q.serviceNo.toUpperCase() === serviceNo);
  const nextIndex = existing.length + 1;
  const queryNo = `${serviceNo}-Q${String(nextIndex).padStart(3, "0")}`;
  const subject =
    payload.subject || `${payload.category || "General"} - ${payload.subCategory || ""}`.trim();

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const newQuery = {
    id: `${serviceNo}-${Date.now()}`,
    serviceNo,
    queryNo,
    subject,
    category: payload.category || "",
    subCategory: payload.subCategory || "",
    status: payload.status || "Initiated",
    date: payload.queryDate || dateStr,
    priority: payload.queryPriority || payload.priority || "Medium",
    mode: payload.modeOfQuery || payload.mode || "Online",
    message: payload.queryMessage || payload.message || "",
    remarks: payload.remarks || [],
  };

  queries.unshift(newQuery);
  return newQuery;
}

function getAllServices() {
  return services.slice();
}

function getAllQueries() {
  return queries.slice();
}

export {
  services,
  queries,
  getServiceByNo,
  getQueriesByService,
  getRemarksByQueryNo,
  createQuery,
  getAllServices,
  getAllQueries,
};
