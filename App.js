import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";
import "./App.css";

// 📸 Your images (must match filenames exactly)
import oxford from "./oxford.jpg";
import cambridge from "./cambridge.jpg";
import imperial from "./Imperial College London.jpg";
import ucl from "./ucl.jpg";
import lse from "./LSE.jpg";
import ue from "./ue.jpg";
import kcl from "./King’s College London.jpg";
import man from "./man.jpg";
import bristol from "./bristol.jpg";
import warwick from "./warwick.jpg";
import glasgow from "./glasgow.jpg";
import leeds from "./leeds.jpg";
import sheffield from "./sheffield.jpg";
import birmingham from "./birmingham.jpg";
import nottingham from "./nottingham.jpg";

// 🧠 Map contract names → images
const universityImages = {
  "University of Oxford": oxford,
  "University of Cambridge": cambridge,
  "Imperial College London": imperial,
  "University College London (UCL)": ucl,
  "London School of Economics (LSE)": lse,
  "University of Edinburgh": ue,
  "King's College London": kcl,
  "University of Manchester": man,
  "University of Bristol": bristol,
  "University of Warwick": warwick,
  "University of Glasgow": glasgow,
  "University of Leeds": leeds,
  "University of Sheffield": sheffield,
  "University of Birmingham": birmingham,
  "University of Nottingham": nottingham,
};

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔗 Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask");

    setLoading(true);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contractInstance = new ethers.Contract(
      contractAddress,
      abi,
      signer
    );

    setAccount(accounts[0]);
    setContract(contractInstance);
    setLoading(false);
  };

  // 📥 Load universities
  const loadUniversities = useCallback(async () => {
    let contractInstance;

    if (contract) {
      contractInstance = contract;
    } else {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      contractInstance = new ethers.Contract(
        contractAddress,
        abi,
        provider
      );
    }

    const data = await contractInstance.getUniversities();
    setUniversities(data);
  }, [contract]);

  // 🗳️ Vote
  const vote = async (index) => {
    if (!contract) return alert("Connect wallet first");

    setLoading(true);
    const tx = await contract.vote(index);
    await tx.wait();
    await loadUniversities();
    setLoading(false);
  };

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  // 🏆 Sort leaderboard
  const sorted = [...universities].sort(
    (a, b) => Number(b.voteCount) - Number(a.voteCount)
  );

  const maxVotes =
    universities.length > 0
      ? Math.max(...universities.map((u) => Number(u.voteCount)))
      : 0;

  return (
    <div className="app">
      <h1>🎓 UniVoteChain</h1>

      <button onClick={connectWallet} className="connect-btn">
        {account ? "Connected ✅" : "Connect Wallet"}
      </button>

      <p className="account">
        {account
          ? `${account.slice(0, 6)}...${account.slice(-4)}`
          : "Read Only Mode"}
      </p>

      <div className="card-container">
        {sorted.map((uni, index) => {
          const originalIndex = universities.indexOf(uni);

          return (
            <div
              key={index}
              className={`card ${
                Number(uni.voteCount) === maxVotes ? "winner" : ""
              }`}
            >
              <div className="rank">#{index + 1}</div>

              <img
                src={universityImages[uni.name] || oxford}
                alt={uni.name}
                className="uni-image"
              />

              <h3>{uni.name}</h3>
              <p>{uni.voteCount.toString()} votes</p>

              {/* 📊 Progress bar */}
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${
                      (Number(uni.voteCount) / (maxVotes || 1)) * 100
                    }%`,
                  }}
                ></div>
              </div>

              <button
                className="vote-btn"
                onClick={() => vote(originalIndex)}
                disabled={!account || loading}
              >
                {!account
                  ? "Connect to Vote"
                  : loading
                  ? "Processing..."
                  : "Vote"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;