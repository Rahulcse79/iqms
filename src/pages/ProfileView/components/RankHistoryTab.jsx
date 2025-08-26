import React from "react";

const RankHistory = () => {
  const rankData = [
    {
      rank: "AC",
      rankType: "LAC",
      rankDate: "01-Jan-10",
      lastDate: "01-Oct-23",
      remarks: "SFTS(Salwahini)",
    },
    {
      rank: "CDT",
      rankType: "SQN LDR",
      rankDate: "04-Oct-21",
      lastDate: "04-Oct-23",
      remarks: "SPTS(Kochi)",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <table
        border="1"
        cellPadding="10"
        cellSpacing="0"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th>Rank</th>
            <th>Rank Type</th>
            <th>Rank Date</th>
            <th>Last Date</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rankData.map((item, index) => (
            <tr key={index}>
              <td>{item.rank}</td>
              <td>{item.rankType}</td>
              <td>{item.rankDate}</td>
              <td>{item.lastDate}</td>
              <td>{item.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankHistory;
