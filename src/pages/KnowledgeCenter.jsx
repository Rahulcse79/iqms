import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  FaGavel,
  FaFileAlt,
  FaMoneyBillWave,
  FaCalculator,
  FaBook,
  FaDownload,
  FaEye,
  FaFolder,
  FaFilePdf,
  FaSearch,
  FaTimes,
  FaSortAlphaDown,
} from "react-icons/fa";
import "./KnowledgeCenter.css";

// ============ STYLED COMPONENTS ============
const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: var(--bg);
`;

const Header = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  color: var(--text);
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 0;
  letter-spacing: 0.5px;
  line-height: 1.1;
  text-shadow: 0 2px 8px rgba(74,144,226,0.08);
`;

const Subtitle = styled.p`
  color: var(--muted);
  font-size: 15px;
  margin-top: 4px;
`;

// Main Tabs Container
const TabsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
`;

const MainTab = styled.button`
  padding: 10px 16px;
  border: 2px solid ${(props) => (props.$active ? "var(--primary)" : "var(--border)")};
  background: ${(props) => (props.$active ? "var(--primary)" : "var(--surface)")};
  color: ${(props) => (props.$active ? "#fff" : "var(--text)")};
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: var(--primary);
    background: ${(props) => (props.$active ? "var(--primary)" : "var(--glass)")};
  }
`;

const TabBadge = styled.span`
  background: ${(props) => (props.$active ? "rgba(255,255,255,0.3)" : "var(--primary)")};
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
`;

// Sub Tabs Container
const SubTabsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  padding: 10px;
  background: var(--glass);
  border-radius: 8px;
`;

const SubTab = styled.button`
  padding: 8px 14px;
  border: 1px solid ${(props) => (props.$active ? "var(--primary)" : "transparent")};
  background: ${(props) => (props.$active ? "var(--surface)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--primary)" : "var(--muted)")};
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  transition: all 0.2s ease;

  &:hover {
    background: var(--surface);
    color: var(--primary);
  }
`;

// Search and Filter Bar
const ToolbarContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 0;
  padding: 0;
  background: none;
  border-radius: 0;
  border: none;
`;

const SearchBox = styled.div`
  position: relative;
  min-width: 180px;
  max-width: 220px;
  flex: 0 1 200px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 7px 32px 7px 30px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.08);
  }
`;

const SearchIconWrapper = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
`;

const ClearSearchBtn = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;

  &:hover {
    color: var(--text);
  }
`;

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ToolbarLabel = styled.span`
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  margin-right: 2px;
`;

const SelectBox = styled.select`
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;

  input {
    cursor: pointer;
  }
`;

const StatusText = styled.span`
  font-size: 12px;
  color: var(--primary);
  font-style: italic;
`;

// PDF List
const PDFGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
`;

const PDFCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const PDFIconWrapper = styled.div`
  color: #e53935;
  font-size: 28px;
  flex-shrink: 0;
`;

const PDFDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const PDFName = styled.div`
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  word-break: break-word;
  line-height: 1.4;
  margin-bottom: 4px;
`;

const PDFPath = styled.div`
  color: var(--muted);
  font-size: 11px;
  margin-bottom: 8px;
`;

const PDFActions = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid ${(props) => (props.$primary ? "var(--primary)" : "var(--border)")};
  background: ${(props) => (props.$primary ? "var(--primary)" : "var(--surface)")};
  color: ${(props) => (props.$primary ? "#fff" : "var(--text)")};
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
`;

// Empty/Loading States
const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.4;
`;

const EmptyText = styled.div`
  font-size: 14px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
  font-size: 14px;
`;

const ErrorState = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 16px;
  color: #856404;
  margin-bottom: 20px;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: var(--glass);
  border-radius: 8px;
  font-size: 13px;
  color: var(--muted);
  flex-wrap: wrap;
  gap: 8px;
`;

// ============ ICON MAPPING ============
const sectionIcons = {
  "acts-rules-regulations": { icon: FaGavel, color: "#5e35b1" },
  "afi-afo": { icon: FaFileAlt, color: "#1e88e5" },
  "pay-allowances": { icon: FaMoneyBillWave, color: "#43a047" },
  "pf-it": { icon: FaCalculator, color: "#e53935" },
  "sops-manuals": { icon: FaBook, color: "#fb8c00" },
  "other": { icon: FaFolder, color: "#607d8b" },
};

// ============ MAIN COMPONENT ============
const KnowledgeCenter = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab states
  const [activeMainTab, setActiveMainTab] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("all");

  // Search/Filter/Sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("name-asc");
  // const [deepSearch, setDeepSearch] = useState(false);
  // const [deepSearchResults, setDeepSearchResults] = useState(new Map());
  // const [isSearchingContent, setIsSearchingContent] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get public URL for proper path resolution
        const publicUrl = process.env.PUBLIC_URL || "";
        const configUrl = `${publicUrl}/knowledgeCenterConfig.json`;

        const response = await fetch(configUrl);
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.status}`);
        }

        const data = await response.json();

        // Validate config structure
        if (!data || !data.sections || !Array.isArray(data.sections)) {
          throw new Error("Invalid configuration format");
        }

        setConfig(data);

        // Set first tab as active
        if (data.sections.length > 0) {
          setActiveMainTab(data.sections[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading Knowledge Center config:", err);
        setError(`Failed to load Knowledge Center: ${err.message}`);
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Get current section
  const currentSection = useMemo(() => {
    if (!config || !activeMainTab) return null;
    return config.sections.find((s) => s.id === activeMainTab);
  }, [config, activeMainTab]);

  // Build flat list of all PDFs for all sections (for global search)
  const allPDFs = useMemo(() => {
    if (!config || !config.sections) return [];
    const publicUrl = process.env.PUBLIC_URL || "";
    const basePath = config.basePath || "static/KNOWLEDGE-CENTER-PDFS";
    const pdfs = [];
    config.sections.forEach((section) => {
      // Direct files
      if (section.files && section.files.length > 0) {
        section.files.forEach((fileName) => {
          const folderPath = `${publicUrl}/${basePath}/${encodeURIComponent(section.title)}`;
          pdfs.push({
            name: fileName,
            url: `${folderPath}/${encodeURIComponent(fileName)}`,
            section: section.title,
            subsection: "Root",
            subsectionId: "root",
          });
        });
      }
      // Subsection files
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((sub) => {
          if (sub.files && sub.files.length > 0) {
            sub.files.forEach((fileName) => {
              const folderPath = `${publicUrl}/${basePath}/${encodeURIComponent(section.title)}/${encodeURIComponent(sub.title)}`;
              pdfs.push({
                name: fileName,
                url: `${folderPath}/${encodeURIComponent(fileName)}`,
                section: section.title,
                subsection: sub.title,
                subsectionId: sub.id,
              });
            });
          }
        });
      }
    });
    return pdfs;
  }, [config]);

  // Filter and sort PDFs (global search, not by tab)
  const filteredPDFs = useMemo(() => {
    let result = [...allPDFs];
    // Filter by search term (global)
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((pdf) => pdf.name.toLowerCase().includes(term));
    }
    // Sort
    result.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === "name-asc") return nameA.localeCompare(nameB);
      if (sortOrder === "name-desc") return nameB.localeCompare(nameA);
      return 0;
    });
    return result;
  }, [allPDFs, searchTerm, sortOrder]);

  // Deep search inside PDFs (commented out)
  /*
  useEffect(() => {
    if (!deepSearch || !searchTerm.trim() || allPDFs.length === 0) {
      setDeepSearchResults(new Map());
      setIsSearchingContent(false);
      return;
    }
    let cancelled = false;
    const term = searchTerm.trim().toLowerCase();
    const searchPDFContent = async () => {
      setIsSearchingContent(true);
      const results = new Map();
      try {
        const pdfjsLib = await import("pdfjs-dist");
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              "pdfjs-dist/build/pdf.worker.min.mjs",
              import.meta.url
            ).toString();
          } catch (e) {
            console.warn("PDF.js worker setup failed, using main thread");
          }
        }
        for (const pdf of allPDFs) {
          if (cancelled) break;
          try {
            const loadingTask = pdfjsLib.getDocument(pdf.url);
            const doc = await loadingTask.promise;
            const maxPages = Math.min(doc.numPages, 15);
            for (let i = 1; i <= maxPages; i++) {
              if (cancelled) break;
              const page = await doc.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item) => item.str).join(" ").toLowerCase();
              if (pageText.includes(term)) {
                results.set(pdf.url, true);
                break;
              }
            }
          } catch (pdfErr) {
            console.warn(`Could not search PDF: ${pdf.name}`);
          }
        }
      } catch (err) {
        console.error("PDF.js initialization error:", err);
      }
      if (!cancelled) {
        setDeepSearchResults(results);
        setIsSearchingContent(false);
      }
    };
    const timeoutId = setTimeout(searchPDFContent, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [deepSearch, searchTerm, allPDFs]);
  */

  // Count files per subsection (still used for tab counts)
  const getSubsectionCount = (subsectionId) => {
    if (!config || !config.sections) return 0;
    // For tab counts, use the current section only
    if (!currentSection) return 0;
    let pdfs = [];
    // Direct files
    if (currentSection.files && currentSection.files.length > 0) {
      currentSection.files.forEach((fileName) => {
        pdfs.push({ subsectionId: "root" });
      });
    }
    // Subsection files
    if (currentSection.subsections && currentSection.subsections.length > 0) {
      currentSection.subsections.forEach((sub) => {
        if (sub.files && sub.files.length > 0) {
          sub.files.forEach((fileName) => {
            pdfs.push({ subsectionId: sub.id });
          });
        }
      });
    }
    if (subsectionId === "all") return pdfs.length;
    if (subsectionId === "root") return pdfs.filter((pdf) => pdf.subsectionId === "root").length;
    return pdfs.filter((pdf) => pdf.subsectionId === subsectionId).length;
  };

  // Handlers
  const handleViewPDF = (pdf) => {
    window.open(pdf.url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadPDF = (pdf) => {
    const link = document.createElement("a");
    link.href = pdf.url;
    link.download = pdf.name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMainTabChange = (tabId) => {
    setActiveMainTab(tabId);
    setActiveSubTab("all");
    // setSearchTerm("");
    // setDeepSearchResults(new Map());
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    // setDeepSearchResults(new Map());
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <Container>
        <LoadingState>
          <FaFolder style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }} />
          <div>Loading Knowledge Center...</div>
        </LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorState>
          <strong>Error:</strong> {error}
          <br />
          <small>Please check that knowledgeCenterConfig.json exists in the public folder.</small>
        </ErrorState>
      </Container>
    );
  }

  if (!config || !config.sections || config.sections.length === 0) {
    return (
      <Container>
        <ErrorState>No sections found in Knowledge Center configuration.</ErrorState>
      </Container>
    );
  }

  // Get total files count for each section
  const getSectionFileCount = (section) => {
    let count = 0;
    if (section.files) count += section.files.length;
    if (section.subsections) {
      section.subsections.forEach((sub) => {
        if (sub.files) count += sub.files.length;
      });
    }
    return count;
  };

  return (
    <Container>
      {/* Header with search/filter/sort bar on top right */}
      <Header>
        <div>
          <Title>📚 Knowledge Center</Title>
          <Subtitle>Access important documents, policies, and manuals</Subtitle>
        </div>
        <ToolbarContainer>
          <SearchBox>
            <SearchIconWrapper>
              <FaSearch />
            </SearchIconWrapper>
            <SearchInput
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <ClearSearchBtn onClick={handleClearSearch}>
                <FaTimes />
              </ClearSearchBtn>
            )}
          </SearchBox>
          <ToolbarGroup>
            <ToolbarLabel>
              <FaSortAlphaDown style={{ marginRight: 4 }} />
              Sort:
            </ToolbarLabel>
            <SelectBox value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
            </SelectBox>
          </ToolbarGroup>
        </ToolbarContainer>
      </Header>

      {/* Main Section Tabs */}
      <TabsContainer>
        {config.sections.map((section) => {
          const sectionIcon = sectionIcons[section.id] || { icon: FaFolder, color: "#607d8b" };
          const Icon = sectionIcon.icon;
          const fileCount = getSectionFileCount(section);
          return (
            <MainTab
              key={section.id}
              $active={activeMainTab === section.id}
              onClick={() => handleMainTabChange(section.id)}
            >
              <Icon style={{ color: activeMainTab === section.id ? "#fff" : sectionIcon.color }} />
              {section.title}
              <TabBadge $active={activeMainTab === section.id}>{fileCount}</TabBadge>
            </MainTab>
          );
        })}
      </TabsContainer>

      {/* Sub-Tabs (Subsections) */}
      {currentSection && (
        <SubTabsContainer>
          <SubTab $active={activeSubTab === "all"} onClick={() => setActiveSubTab("all")}>All ({getSubsectionCount("all")})</SubTab>
          {/* Show Root tab if section has direct files */}
          {currentSection.files && currentSection.files.length > 0 && (
            <SubTab $active={activeSubTab === "root"} onClick={() => setActiveSubTab("root")}>Root Files ({getSubsectionCount("root")})</SubTab>
          )}
          {/* Subsection tabs */}
          {currentSection.subsections &&
            currentSection.subsections.map((sub) => (
              <SubTab
                key={sub.id}
                $active={activeSubTab === sub.id}
                onClick={() => setActiveSubTab(sub.id)}
              >
                {sub.title} ({getSubsectionCount(sub.id)})
              </SubTab>
            ))}
        </SubTabsContainer>
      )}

      {/* Stats Bar */}
      <StatsBar>
        <span>
          Showing <strong>{filteredPDFs.length}</strong> of <strong>{allPDFs.length}</strong> documents
        </span>
        {searchTerm && (
          <span>
            Filtered by: "<strong>{searchTerm}</strong>"
          </span>
        )}
      </StatsBar>

      {/* PDF Grid */}
      {filteredPDFs.length > 0 ? (
        <PDFGrid>
          {filteredPDFs.map((pdf, index) => (
            <PDFCard key={`${pdf.url}-${index}`}>
              <PDFIconWrapper>
                <FaFilePdf />
              </PDFIconWrapper>
              <PDFDetails>
                <PDFName>{pdf.name}</PDFName>
                <PDFPath>
                  {pdf.section} / {pdf.subsection}
                </PDFPath>
                <PDFActions>
                  <ActionBtn onClick={() => handleViewPDF(pdf)}>
                    <FaEye /> View
                  </ActionBtn>
                  <ActionBtn $primary onClick={() => handleDownloadPDF(pdf)}>
                    <FaDownload /> Download
                  </ActionBtn>
                </PDFActions>
              </PDFDetails>
            </PDFCard>
          ))}
        </PDFGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>
            <FaFilePdf />
          </EmptyIcon>
          <EmptyText>
            {searchTerm
              ? `No documents found matching "${searchTerm}"`
              : "No documents available in this section"}
          </EmptyText>
        </EmptyState>
      )}
    </Container>
  );
};

export default KnowledgeCenter;
