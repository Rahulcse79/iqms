import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

/** ---------- utils ---------- */
const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      console.log('[formatDate] Invalid date:', iso);
      return '-';
    }

    // Convert UTC to IST (+5:30)
    const istOffset = 5 * 60 + 30; // minutes
    const istDate = new Date(d.getTime() + istOffset * 60000);

    const formatted = istDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    console.log('[formatDate] Input:', iso, '| IST Date:', istDate, '| Formatted:', formatted);

    return formatted;
  } catch (err) {
    console.log('[formatDate] Error formatting date:', iso, err);
    return '-';
  }
};

const devLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[PersonalDetails]', ...args);
  }
};

const mapCategory = (cat) => {
  if (cat === 1 || cat === '1') return 'Airmen (1)';
  if (cat === 2 || cat === '2') return 'Officer (2)';
  return cat ?? '-';
};

const mapSex = (sexCode) => {
  const map = {
    M: 'Male (M)',
    F: 'Female (F)',
    O: 'Other (O)',
    '0': 'Male',
    '1': 'Female',
    '2': 'Not Specified',
  };
  return map?.[sexCode] ?? (sexCode || '-');
};

const mapMaritalStatus = (code) => {
  const map = {
    M: 'Married (M)',
    S: 'Single (S)',
    D: 'Divorced (D)',
    W: 'Widowed (W)',
  };
  return map?.[code] ?? (code || '-');
};

const mapRankType = (code) => {
  const map = {
    SU: 'Substantive (SU)',
    AC: 'Acting (AC)',
    AD: 'Acting Duty (AD)',
  };
  return map?.[code] ?? (code || '-');
};

/** ---------- component ---------- */
export default function PersonalDetails(props) {
  const personalSlice = useSelector((s) => s.personalData || {});
  const loading = props.loading ?? personalSlice.loading ?? false;
  const error = props.error ?? personalSlice.error ?? null;
  const rawData = props.data ?? personalSlice.personalData ?? null;

  // useMemo hooks first (before conditional returns)
  const dataObj = useMemo(() => {
    if (!rawData) return null;
    if (rawData.items && Array.isArray(rawData.items)) {
      return rawData.items[0] || null;
    }
    return rawData;
  }, [rawData]);
const cleaned = useMemo(() => {
  if (!dataObj) return null;
  return {
    serviceNo: dataObj.sno ?? '-',
    name: dataObj.p_name ?? '-',
    category: mapCategory(dataObj.cat),
    system: dataObj.system ?? '-',
    rankCode: dataObj.rankcd ?? '-',
    rankType: mapRankType(dataObj.ranktype),
    rankDate: (dataObj.rankdt),
    tradeCode: dataObj.trtcd ?? '-',   // ✅ updated key
    dateOfBirth: (dataObj.dob),
    enlistmentDate: (dataObj.enrldt),
    sex: mapSex(dataObj.sex),
    maritalStatus: mapMaritalStatus(dataObj.mstatus),
    currentUnit: dataObj.unitcd ?? '-',
    previousUnit: dataObj.prev_unitcd ?? '-',
    sorsDate: (dataObj.sonsdt),  // ✅ updated key
    pan: dataObj.pan ?? '-',
    pran: dataObj.pran ?? '-',
    irla: dataObj.irla ?? '-', // will show "-" if not present
    cell: dataObj.cell ?? '-',
    cs: dataObj.cs ?? '-',
    flag: dataObj.flag ?? '-',
    decoration: dataObj.decoration ?? '-',
    commtype: dataObj.commtype ?? '-',
  };
}, [dataObj]);

  // Conditional returns after hooks
  if (loading) return <div style={styles.loader}>Loading personal details...</div>;
  if (error) return <div style={styles.error}>Error: {String(error)}</div>;
  if (!dataObj) return <div style={styles.empty}>No personal details available.</div>;

  devLog('Resolved Personal Data:', cleaned);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.name}>{cleaned.name}</h2>
        <p style={styles.subTitle}>{cleaned.category} | Service No: {cleaned.serviceNo}</p>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Personal Information</h4>
        <InfoGrid data={{
          'Date of Birth': cleaned.dateOfBirth,
          'Sex': cleaned.sex,
          'Marital Status': cleaned.maritalStatus,
          'Enrolment Date': cleaned.enlistmentDate,
        }}/>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Rank & Posting</h4>
        <InfoGrid data={{
          'Rank Code': cleaned.rankCode,
          'Rank Type': cleaned.rankType,
          'Rank Date': cleaned.rankDate,
          'Trade Code': cleaned.tradeCode,
          'Current Unit Code': cleaned.currentUnit,
          'Previous Unit Code': cleaned.previousUnit,
          'SORS Date': cleaned.sorsDate,
        }}/>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Identifiers</h4>
        <InfoGrid data={{
          'PAN': cleaned.pan,
          'PRAN': cleaned.pran,
          'IRLA': cleaned.irla,
          'Cell': cleaned.cell,
          'CS': cleaned.cs,
          'Flag': cleaned.flag,
          'Decoration': cleaned.decoration,
          'Comm Type': cleaned.commtype,
        }}/>
      </div>
    </div>
  );
}

/** Reusable grid layout */
function InfoGrid({ data }) {
  return (
    <div style={styles.infoGrid}>
      {Object.entries(data).map(([label, value]) => (
        <div key={label} style={styles.infoItem}>
          <span style={styles.label}>{label}</span>
          <span style={styles.value}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/** ---------- Styles (theme-based) ---------- */
const styles = {
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm, 12px)',
    boxShadow: 'var(--shadow, 0 4px 12px rgba(0,0,0,0.08))',
    padding: 20,
    maxWidth: 960,
    margin: '20px auto',
    fontFamily: 'var(--font-family, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial)',
    color: 'var(--text, #111827)',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid var(--border, rgba(15,23,42,0.06))',
    paddingBottom: 10,
  },
  name: {
    margin: 0,
    fontSize: 22,
    color: 'var(--text, #111827)',
    fontWeight: 700,
    lineHeight: 1.1,
  },
  subTitle: {
    margin: '6px 0 0',
    fontSize: 13,
    color: 'var(--muted, #6b7280)',
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text, #111827)',
    marginBottom: 10,
    borderBottom: '1px solid var(--border, rgba(15,23,42,0.06))',
    paddingBottom: 6,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 12px',
    background: 'var(--surface-accent, #f9fafb)',
    borderRadius: 'var(--radius-sm, 6px)',
    border: '1px solid var(--border, rgba(15,23,42,0.06))',
    minHeight: 56,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--muted, #6b7280)',
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    color: 'var(--text, #111827)',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  loader: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: 'var(--muted, #6b7280)',
    background: 'transparent',
  },
  error: {
    padding: 20,
    color: 'var(--red, #dc2626)',
    fontSize: 16,
    textAlign: 'center',
    background: 'transparent',
  },
  empty: {
    padding: 20,
    fontSize: 16,
    textAlign: 'center',
    color: 'var(--muted, #6b7280)',
  },
};
