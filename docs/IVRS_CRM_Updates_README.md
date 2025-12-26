# IVRS CRM Updates: Attaching Documentation to Builds

## How to Add User Manuals or Documents to a Build

1. **Place your files** (PDF, Word, etc.) in:
   - `public/static/docs/`
   - Example: `public/static/docs/user-manual-v2.pdf`

2. **Edit the build entry** in `src/assets/Data/versionControlData.js`:
   - Add a `docs` array to the build object:

```js
{
  version: "Build 5",
  date: "01 Jan, 2026",
  tag: "Documentation",
  highlights: [
    "Added new user manual for advanced features."
  ],
  author: "Team IVRS",
  fullNotes: "This build provides updated documentation for new features.",
  docs: [
    {
      label: "User Manual (PDF)",
      file: "/static/docs/user-manual-v2.pdf",
      type: "pdf"
    },
    {
      label: "Quick Start Guide (Word)",
      file: "/static/docs/quick-start.docx",
      type: "word"
    }
  ]
}
```

3. **Result:**
   - The IVRS CRM Updates section will show download/view links for each document in the build.
   - Users can click to view or download the files directly from the dashboard.

---

**Supported file types:** PDF, Word (docx). You can add more types as needed.

**Note:**
- Files must be placed in the `public/static/docs/` folder for correct linking.
- The `docs` array is optional; only add it to builds that have documentation attachments.
