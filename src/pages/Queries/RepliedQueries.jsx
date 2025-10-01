// src/pages/RepliedQueries/RepliedQueries.jsx (NEW FILE)

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useActiveRole } from '../../hooks/useActiveRole';
import { refreshRepliedQueriesNew } from '../../actions/repliedQueryActionNew';
import QueriesTable from '../../components/QueriesTable';
import { getNewAPIParamsFromActiveRole } from '../../utils/helpers';

const STORAGE_KEY = "repliedQueries_v2_new";

const RepliedQueries = () => {
  const { activeRole } = useActiveRole();
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get data from Redux store (or localStorage directly)
  const repliedData = useSelector(state => state.replied_queries.byKey[activeRole?.SUB_SECTION] || {});

  useEffect(() => {
    if (repliedData.items) {
      setItems(repliedData.items);
    }
  }, [repliedData]);

  const handleRefresh = async () => {
    if (!activeRole) return;
    setLoading(true);
    const { MODULE_CAT, SUB_SECTION, CELL } = getNewAPIParamsFromActiveRole(activeRole);
    await dispatch(refreshRepliedQueriesNew({
      moduleCat: MODULE_CAT,
      subSection: SUB_SECTION,
      cell: CELL
    }));
    setLoading(false);
  };

  return (
    <div>
      <h2>Replied Queries</h2>
      <button onClick={handleRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      <QueriesTable data={items} loading={loading} />
    </div>
  );
};

export default RepliedQueries;
