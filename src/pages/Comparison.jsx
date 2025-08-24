import React, { useState } from "react";
import "./Comparison.css";

const Comparison = () => {
    const [seniorServiceNumber, setSeniorServiceNumber] = useState("");
    const [juniorServiceNumber, setJuniorServiceNumber] = useState("");
    const [selectCategory, setSelectCategory] = useState("Airmen");

    const handleSearch = (e) => {
        e.preventDefault();

        if (!seniorServiceNumber || !juniorServiceNumber || !selectCategory) {
            alert("Please fill in all fields before searching.");
            return;
        }

        alert(
            `Comparing Senior: ${seniorServiceNumber} and Junior: ${juniorServiceNumber} in Category: ${selectCategory}`
        );
    };

    return (
        <div className="comparison-container">
            <h2>Comparative Statement</h2>

            <form className="comparison-form" onSubmit={handleSearch}>
                <label>
                    Select Category
                    <select
                        value={selectCategory}
                        onChange={(e) => setSelectCategory(e.target.value)}
                    >
                        <option value="Airmen">Airmen / NCs(E)</option>
                    </select>
                </label>

                <label>
                    Senior Service Number
                    <input
                        type="text"
                        placeholder="Enter Senior Service No"
                        value={seniorServiceNumber}
                        onChange={(e) => setSeniorServiceNumber(e.target.value)}
                    />
                </label>

                <label>
                    Junior Service Number
                    <input
                        type="text"
                        placeholder="Enter Junior Service No"
                        value={juniorServiceNumber}
                        onChange={(e) => setJuniorServiceNumber(e.target.value)}
                    />
                </label>

                <button type="submit" className="search-btn">
                    Create Comparative Statement
                </button>
            </form>
        </div>
    );
};

export default Comparison;
