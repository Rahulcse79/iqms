// File: /src/assets/Data/versionControlData.js
// Example data structure — your file can have more builds and they will be picked up automatically.
export const versionData = {
  heading: "IVRS CRM Updates",
  builds: [
    {
      version: "Build 1",
      date: "25 Sep, 2025",
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
      fullNotes:
        "Introduced core IQMS functionality: profile and query views, comparisons between senior/junior agents, and query-level status tracking (pending, transferred, replied). Also added initial MIS reporting to surface key metrics for quality monitoring.",
    },
    {
      version: "Build 2",
      date: "17 Oct, 2025",
      tag: "Improvement",
      highlights: [
        "Added the feature of Interim Replies",
        "Added MIS for Call Details Record (CDR) along with recording play and download",
        "Queries shown cell, sub-section and wing wise",
        "Bugs of Build 1 resolved",
      ],
      author: "Team IVRS",
      fullNotes:
        "Delivered enhancements to response workflows by adding interim replies and integrated CRM capabilities. Implemented finer-grained query filtering (cell / sub-section / wing) and fixed bugs from Build 1 to improve stability and data accuracy.",
    },
    {
      version: "Build 3",
      date: "21 Oct, 2025",
      tag: "User Manual",
      highlights: [
        "User Manual (PDF and Word) now available for download and viewing directly from the IVRS CRM Updates section.",
        "Guides users through all major features and workflows.",
        "Future builds can also include documentation attachments.",
      ],
      author: "Team IVRS",
      fullNotes:
        "This build introduces downloadable and viewable user manuals in both PDF and Word formats. Access the documentation directly from the IVRS CRM Updates section for guidance on using the system.",
      docs: [
        {
          label: "User Manual (Word)",
          file: "/static/docs/IVRS OPERATOR MANUAL.docx",
          type: "word",
        },
      ],
    },
    {
      version: "Build 4",
      date: "05 Nov, 2025",
      tag: "Improvement",
      highlights: [
        "Added the cards for the Interim Reply and CDR",
        "Added the recording feature in CDR",
        "Queries shown cell, sub-section and wing wise",
        "Bugs of Build 2 resolved",
      ],
      author: "Team IVRS",
      fullNotes:
        "Consolidated CRM and interim-reply behavior with additional UX and performance refinements. This release focused on polishing workflows, resolving edge-case bugs, and improving responsiveness for query filtering and views.",
    },
    {
      version: "Build 5",
      date: "24 Nov, 2025",
      tag: "Feedback and Auto Logout",
      highlights: [
        "Added the feedback feature",
        "Auto Logout on inactivity after 5 minutes",
        "Agent Active Status List and count Live Realtime",
        "Bugs of Build 3 resolved",
      ],
      author: "Team IVRS",
      fullNotes:
        "Added a feedback collection module to capture end-user responses, implemented automatic session logout after 5 minutes of inactivity for improved security, and introduced a live agent active-status list with real-time counts to aid monitoring. Also addressed outstanding issues from Build 3 and made fixes to session handling and realtime updates.",
    },
    {
      version: "Build 6",
      date: "03 Jan, 2026",
      tag: "Major Feature",
      highlights: [
        "Integrated a comprehensive Knowledge Center for all users",
        "Tabbed interface with 6 main sections and sub-sections for easy navigation",
        "Global search, sort, and filter for all documents (PDFs)",
        "Direct access to 388+ policy, SOP, and reference PDFs from within the app",
        "Sidebar and routing integration for quick access",
      ],
      author: "Team IVRS",
      fullNotes:
        "This build introduces the Knowledge Center, A centralized, searchable repository for all important documents, policies, and manuals. Users can browse by section, sub-section, or use the global search and sort tools to instantly find any PDF. The UI is fully responsive and accessible, with a modern tabbed layout and sidebar integration. All document metadata is managed via a JSON config, ensuring reliability in both dev and production environments. The architecture is future-proofed for advanced features like deep PDF content search. This major update greatly enhances discoverability and access to institutional knowledge for all users.",
    },
    {
      version: "Build 7",
      date: "06 Feb, 2026",
      tag: "Bug Fix",
      highlights: [
        "Fixed space input issue in feedback creation form",
        "Improved POR details popup brightness and animation",
        "Enabled text selection in POR popup",
        "Added Print POR button for individual POR details printing",
        "Table Allignment and Spacing fixes in Queries Section",
        "Invalid Date issue fixed ",
        "Provided Date vise Sorting in Rank Details in Sr. Jr. Comparison fixed ",
      ],
      author: "Team IVRS",
      fullNotes:
        "This build addresses several UI and functionality bugs. Fixed an issue where spaces could not be typed in the feedback form inputs by removing interfering CSS filters and adding proper event handling. Enhanced the POR details modal by removing backdrop blur that was dimming the content, added smooth animation for better UX, enabled text selection within the popup, and introduced a dedicated Print POR button that opens the POR content in a new window for clean, individual printing without affecting the main page.",
    },
  ],
};

export default versionData;
