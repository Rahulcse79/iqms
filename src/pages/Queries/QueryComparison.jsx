import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  searchByServiceNoAndCategory
} from "../../actions/queryActions";
import QueriesTable from "../../components/QueriesTable";
import "./QueryComparison.css";

const Comparison = () => {

  const dispatch = useDispatch();

  const [firstServiceNumber, setFirstServiceNumber] = useState("");
  const [secondServiceNumber, setSecondServiceNumber] = useState("");
  const [thirdServiceNumber, setThirdServiceNumber] = useState("");

  const [selectCategory1, setSelectCategory1] = useState("Airmen");
  const [selectCategory2, setSelectCategory2] = useState("Airmen");
  const [selectCategory3, setSelectCategory3] = useState("Airmen");

  const [results1, setResults1] = useState([]);
  const [results2, setResults2] = useState([]);
  const [results3, setResults3] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!firstServiceNumber && !secondServiceNumber && !thirdServiceNumber) {
      alert("Please enter at least one Service Number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (firstServiceNumber) {
        const { data } = await dispatch(
          searchByServiceNoAndCategory(firstServiceNumber, selectCategory1)
        );
        setResults1(data?.items || []);
      } else {
        setResults1([]);
      }

      if (secondServiceNumber) {
        const { data } = await dispatch(
          searchByServiceNoAndCategory(secondServiceNumber, selectCategory2)
        );
        setResults2(data?.items || []);
      } else {
        setResults2([]);
      }

      if (thirdServiceNumber) {
        const { data } = await dispatch(
          searchByServiceNoAndCategory(thirdServiceNumber, selectCategory3)
        );
        setResults3(data?.items || []);
      } else {
        setResults3([]);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comparison-container">
      <h2>Query Comparison</h2>

      <form className="comparison-form" onSubmit={handleSearch}>
        <div className="service-numbers-row">
          {/* First */}
          <label>
            First Service Number
            <input
              type="text"
              value={firstServiceNumber}
              onChange={(e) => setFirstServiceNumber(e.target.value)}
              placeholder="Enter first number"
            />
            <select
              value={selectCategory1}
              onChange={(e) => setSelectCategory1(e.target.value)}
            >
              <option value="Airmen">Airmen</option>
              <option value="Officer">Officer</option>
            </select>
          </label>

          {/* Second */}
          <label>
            Second Service Number
            <input
              type="text"
              value={secondServiceNumber}
              onChange={(e) => setSecondServiceNumber(e.target.value)}
              placeholder="Enter second number"
            />
            <select
              value={selectCategory2}
              onChange={(e) => setSelectCategory2(e.target.value)}
            >
              <option value="Airmen">Airmen</option>
              <option value="Officer">Officer</option>
            </select>
          </label>

          {/* Third */}
          <label>
            Third Service Number
            <input
              type="text"
              value={thirdServiceNumber}
              onChange={(e) => setThirdServiceNumber(e.target.value)}
              placeholder="Enter third number"
            />
            <select
              value={selectCategory3}
              onChange={(e) => setSelectCategory3(e.target.value)}
            >
              <option value="Airmen">Airmen</option>
              <option value="Officer">Officer</option>
            </select>
          </label>
        </div>

        <button type="submit" className="search-btn">
          Search
        </button>
      </form>

      <div className="comparison-results">
        {loading && <p>Loading...</p>}
        {error && <p className="error-text">Error: {error}</p>}

        {!loading && (
          <div className="results-grid">
            {results1.length > 0 && (
              <QueriesTable title="Service No 1 Results" data={results1} />
            )}
            {results2.length > 0 && (
              <QueriesTable title="Service No 2 Results" data={results2} />
            )}
            {results3.length > 0 && (
              <QueriesTable title="Service No 3 Results" data={results3} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comparison;