import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractConfig from "./contract-config.json";

const EXPECTED_CHAIN_ID = 31337;
const avatars = ["AS", "DP", "KD"];

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState(false);

  const wrongNetwork = Boolean(account) && chainId !== EXPECTED_CHAIN_ID;
  const totalVotes = useMemo(
    () => candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0),
    [candidates],
  );

  const getContract = useCallback(async (withSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask was not found. Install the MetaMask browser extension to continue.");
    if (!contractConfig.address || contractConfig.abi.length === 0) {
      throw new Error("Contract not deployed yet. Follow the deployment steps in README.md, then refresh this page.");
    }
    const provider = new BrowserProvider(window.ethereum);
    const runner = withSigner ? await provider.getSigner() : provider;
    return new Contract(contractConfig.address, contractConfig.abi, runner);
  }, []);

  const refreshResults = useCallback(async () => {
    if (!contractConfig.address || !contractConfig.abi.length || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) return;
      const contract = new Contract(contractConfig.address, contractConfig.abi, provider);
      const raw = await contract.getCandidates();
      setCandidates(raw.map((candidate) => ({
        id: Number(candidate.id),
        name: candidate.name,
        voteCount: Number(candidate.voteCount),
      })));
      if (account) setHasVoted(await contract.hasVoted(account));
    } catch (error) {
      setStatus({ type: "error", message: error.shortMessage || error.message || "Could not load election results." });
    }
  }, [account]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setStatus({ type: "error", message: "MetaMask was not found. Install the MetaMask browser extension to connect your wallet." });
      return;
    }
    try {
      setStatus({ type: "", message: "" });
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setAccount(accounts[0] || "");
      setChainId(Number(network.chainId));
    } catch (error) {
      setStatus({ type: "error", message: error.shortMessage || error.message || "Wallet connection was cancelled." });
    }
  }, []);

  const disconnectWallet = () => {
    setAccount("");
    setHasVoted(false);
    setSelectedId(null);
    setStatus({ type: "", message: "" });
  };

  const castVote = async () => {
    if (!selectedId || !account || wrongNetwork || hasVoted) return;
    setBusy(true);
    setStatus({ type: "pending", message: "Confirm the transaction in MetaMask…" });
    try {
      const contract = await getContract(true);
      const transaction = await contract.vote(selectedId);
      setStatus({ type: "pending", message: `Transaction submitted (${shortAddress(transaction.hash)}). Waiting for confirmation…` });
      await transaction.wait();
      setStatus({ type: "success", message: "Your vote has been recorded on the local blockchain." });
      setSelectedId(null);
      await refreshResults();
    } catch (error) {
      const reason = error.reason || error.shortMessage || error.message || "Transaction failed.";
      setStatus({ type: "error", message: reason.includes("AlreadyVoted") ? "This wallet has already voted in this election." : reason });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refreshResults();
  }, [refreshResults]);

  useEffect(() => {
    if (!window.ethereum) return undefined;
    const onAccountsChanged = (accounts) => {
      setAccount(accounts[0] || "");
      setStatus({ type: "", message: "" });
      setSelectedId(null);
    };
    const onChainChanged = (hexChainId) => setChainId(Number.parseInt(hexChainId, 16));
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!account || !window.ethereum) return;
    const provider = new BrowserProvider(window.ethereum);
    provider.getNetwork().then((network) => setChainId(Number(network.chainId))).catch(() => {});
  }, [account]);

  const castButtonText = busy ? "Submitting vote…" : hasVoted ? "Vote already recorded" : "Confirm my vote";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="BlockVote home">
          <span className="brand-mark">B</span>
          <span>Block<span className="brand-light">Vote</span></span>
        </a>
        <div className="topbar-right">
          <span className="network-tag"><span className="live-dot" /> Local test network</span>
          {account ? (
            <div className="wallet-controls">
              <span className="wallet-address">{shortAddress(account)}</span>
              <button className="disconnect-button" onClick={disconnectWallet}>Disconnect</button>
            </div>
          ) : (
            <button className="connect-button" onClick={connectWallet}>Connect wallet <span aria-hidden="true">↗</span></button>
          )}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> SECURE · TRANSPARENT · DECENTRALIZED</div>
          <h1>Your voice.<br /><span>On the chain.</span></h1>
          <p>One person, one vote. Cast yours on a transparent election powered by the blockchain.</p>
          <div className="hero-meta"><span><i className="meta-icon">◇</i> Tamper-proof record</span><span><i className="meta-icon">◉</i> Publicly verifiable</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbital orbital-one" /><div className="orbital orbital-two" />
          <div className="vote-token"><span>✓</span><small>YOUR VOTE</small></div>
          <span className="orbit-node node-one">◇</span><span className="orbit-node node-two">⌘</span><span className="orbit-node node-three">◉</span>
          <div className="art-caption"><span className="art-caption-line" /> VOTE VERIFIED ON-CHAIN</div>
        </div>
      </section>

      <div className="rule"><span /> ELECTION IN PROGRESS <span /></div>

      <section className="dashboard">
        <div className="voting-column">
          <div className="section-heading">
            <div><div className="eyebrow small"><span className="eyebrow-line" /> THE CANDIDATES</div><h2>Choose your candidate</h2></div>
            <span className="candidate-count">{candidates.length || 3} CANDIDATES</span>
          </div>

          {!account && <div className="notice notice-neutral"><span className="notice-icon">i</span><span><strong>Connect your wallet to vote.</strong> You can browse the live results below.</span></div>}
          {wrongNetwork && <div className="notice notice-warning"><span className="notice-icon">!</span><span><strong>Wrong network detected.</strong> In MetaMask, switch to Hardhat Local (Chain ID 31337) to vote.</span></div>}

          <div className="candidate-list">
            {(candidates.length ? candidates : [
              { id: 1, name: "Aarav Sharma", voteCount: 0 },
              { id: 2, name: "Diya Patel", voteCount: 0 },
              { id: 3, name: "Kabir Deshmukh", voteCount: 0 },
            ]).map((candidate, index) => (
              <button
                className={`candidate-card ${selectedId === candidate.id ? "selected" : ""} ${hasVoted ? "voted-lock" : ""}`}
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
                disabled={!account || wrongNetwork || hasVoted || busy}
                aria-pressed={selectedId === candidate.id}
              >
                <span className={`candidate-avatar avatar-${index + 1}`}>{avatars[index]}</span>
                <span className="candidate-info"><strong>{candidate.name}</strong><small>Candidate {String(candidate.id).padStart(2, "0")}</small></span>
                <span className={`radio ${selectedId === candidate.id ? "radio-checked" : ""}`}>{selectedId === candidate.id && <i />}</span>
              </button>
            ))}
          </div>

          <button className="vote-button" disabled={!account || wrongNetwork || hasVoted || !selectedId || busy} onClick={castVote}>
            <span>{castButtonText}</span><span className="button-arrow">→</span>
          </button>
          {status.message && <div className={`status-message status-${status.type}`} role="status"><span>{status.type === "success" ? "✓" : status.type === "pending" ? "◌" : "!"}</span>{status.message}</div>}
          <p className="vote-footnote"><span>⌑</span> Your vote is final and cannot be changed once submitted.</p>
        </div>

        <aside className="results-panel">
          <div className="results-header"><div><div className="eyebrow small"><span className="eyebrow-line" /> LIVE TALLY</div><h2>Election results</h2></div><span className="live-pill"><i /> LIVE</span></div>
          <div className="total-votes"><span className="total-number">{totalVotes}</span><span className="total-label">TOTAL VOTES CAST</span></div>
          <div className="results-list">
            {(candidates.length ? candidates : [
              { id: 1, name: "Aarav Sharma", voteCount: 0 },
              { id: 2, name: "Diya Patel", voteCount: 0 },
              { id: 3, name: "Kabir Deshmukh", voteCount: 0 },
            ]).map((candidate, index) => {
              const percentage = totalVotes ? Math.round((candidate.voteCount / totalVotes) * 100) : 0;
              return <div className="result-row" key={candidate.id}>
                <div className="result-label"><span>{candidate.name}</span><span>{percentage}%</span></div>
                <div className="bar-track"><div className={`bar-fill bar-${index + 1}`} style={{ width: `${percentage}%` }} /></div>
                <div className="result-votes">{candidate.voteCount} {candidate.voteCount === 1 ? "vote" : "votes"}</div>
              </div>;
            })}
          </div>
          <button className="refresh-button" onClick={refreshResults}><span>↻</span> Refresh results</button>
          <div className="results-foot"><span className="shield-icon">◇</span><span>Results are read directly from the<br /><strong>Voting smart contract</strong></span><span className="verified-mark">✓</span></div>
        </aside>
      </section>

      <footer><span>BLOCKVOTE <i>·</i> A LOCAL BLOCKCHAIN DEMO</span><span>BUILT FOR TRANSPARENCY <b>◇</b></span></footer>
    </main>
  );
}

export default App;
