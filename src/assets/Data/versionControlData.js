// File: /src/assets/Data/versionControlData.js
// Example data structure — your file can have more builds and they will be picked up automatically.
export const versionData = {
  heading: "IVRS CRM Updates",
  builds: [
    {
      version: "Build 1",
      date: "2025-09-25",
      tag: "Feature",
      highlights: [
        "Profile View",
        "Query Comparison",
        "Sr./Jr. Comparison",
        "Query View",
        "Pending, Transferred, Replied Queries",
        "MIS (as in IQMS (Pankh))",
      ],
      author: "Team IVRS",
      fullNotes: "Added IQMS basic features including profile & query views, comparisons, and MIS."
    },
    {
      version: "Build 2",
      date: "2025-10-17",
      tag: "Improvement",
      highlights: [
        "Added the feature of Interim Replies",
        "Added CRM",
        "Queries shown cell, sub-section and wing wise",
        "Bugs of Build 1 resolved",
      ],
      author: "Team IVRS",
      fullNotes: "Interim reply feature, CRM integration, query level filtering and important bug fixes."
    },
    {
      version: "Build 3",
      date: "2025-11-05",
      tag: "Improvement",
      highlights: [
        "Added the feature of Interim Replies",
        "Added CRM",
        "Queries shown cell, sub-section and wing wise",
        "Bugs of Build 1 resolved",
      ],
      author: "Team IVRS",
      fullNotes: "Interim reply feature, CRM integration, query level filtering and important bug fixes."
    },
    {
      version: "Build 4",
      date: "2025-11-24",
      tag: "Feedback and Auto Logout",
      highlights: [
        "Added the feedback feature",
        "Auto Logout on inactivity after 5 minutes",
        "Agent Active Status List and count Live Realtime",
        "Bugs of Build 3 resolved",
      ],
      author: "Team IVRS",
      fullNotes: ""
    },
  ]
};

export default versionData;


