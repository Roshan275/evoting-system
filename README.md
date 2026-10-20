# BlockVote — Blockchain-Based E-Voting System

A small, beginner-friendly decentralized voting demo for the SPPU BE Computer Engineering LP-III Blockchain Technology practical. It uses a Solidity smart contract, a local Hardhat Ethereum network, MetaMask, and a React/Vite frontend. There is no backend, database, cloud deployment, or real cryptocurrency.

## Project structure

```text
evoting-system/
├── contracts/Voting.sol       # Election rules and on-chain vote totals
├── scripts/deploy.js          # Deploys and writes address + ABI to the frontend
├── test/Voting.js              # Contract behavior tests
├── src/App.jsx                 # Wallet, voting, and results UI
├── src/contract-config.json    # Generated locally by the deploy script (gitignored)
├── hardhat.config.js
└── package.json
```

## Requirements

- Node.js 20 or newer and npm
- MetaMask browser extension
- Google Chrome, Firefox, or another MetaMask-compatible browser

## Install

Clone the repository, open a terminal in its `evoting-system` folder, and run:

```bash
npm install
```

## Run the local blockchain and deploy

Keep each command running in its own terminal. Start a local Hardhat chain first:

```bash
npm run chain
```

Hardhat prints test accounts and private keys. In a second terminal, compile and deploy the contract:

```bash
npm run compile
npm run deploy:local
```

The deploy script creates `src/contract-config.json` with the deployed contract address, chain ID, and ABI. This generated file is intentionally excluded from Git because the deployment address belongs to one running local chain. The frontend imports it directly; on a new laptop, deployment generates the correct local file automatically.

## Configure MetaMask

1. In MetaMask, open **Settings → Networks → Add a network → Add a network manually**.
2. Use the local Hardhat network settings:
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
3. Import one of the **test-only** private keys printed by `npm run chain` using **Account selector → Add account or hardware wallet → Import account**. These local accounts have demo funds only. Never import a real wallet seed phrase or use these keys with real funds.
4. Keep the `npm run chain` terminal open while using the app. Restarting the local chain resets its state; deploy again afterward so the frontend config points to the current contract.

## Move the project to another laptop

1. Push the project to GitHub (or copy the `evoting-system` folder). Do not push `node_modules`, `artifacts`, `cache`, `dist`, or `src/contract-config.json`; these are regenerated locally. Keep `package-lock.json` in Git so `npm ci` installs the same dependency versions.
2. Install Node.js 20 or newer on the other laptop, then clone the repository and open a terminal in `evoting-system`.
3. Install dependencies with `npm ci`.
4. Start the local blockchain in Terminal 1: `npm run chain`.
5. In Terminal 2, deploy: `npm run compile` then `npm run deploy:local`.
6. Still in Terminal 2, start the frontend: `npm run dev`.
7. Install MetaMask in that laptop's browser, add the Hardhat Local network settings above, and import a test account from the *new laptop's* Hardhat terminal output. Each laptop's local chain has its own accounts, contract address, and votes.
8. Open the Vite URL printed in Terminal 2, usually `http://localhost:5173`.

Both terminal processes must remain running while the app is in use. On macOS or Linux, you can run the commands in two terminal tabs. On Windows, use PowerShell or Command Prompt in the project folder. If you restart Hardhat, redeploy the contract before using the frontend. Never use Hardhat's printed test keys on a real network.

## Run the app

```bash
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Connect MetaMask, confirm it is on `Hardhat Local`, select one of the three candidates, and confirm the transaction. The page waits for the transaction receipt, checks that the wallet has not voted, and reloads the contract results after confirmation. Use **Refresh results** to read the latest tally again.

## Run checks

```bash
npm test
npm run build
```

Or run Solidity compilation, contract tests, and the frontend production build together:

```bash
npm run check
```

The tests cover the initial candidate list, a successful vote and event, rejection of duplicate votes, and invalid candidate IDs.

## Demonstration flow

1. Start Hardhat, deploy, then run Vite in separate terminals.
2. Show that the election has three candidates and starts at zero votes.
3. Connect an imported local MetaMask account and cast a vote. Show MetaMask's confirmation and the transaction status on the page.
4. Show the updated total and candidate bar chart; refresh results to demonstrate that the data is read from the contract.
5. Try to vote again from the same wallet to show the one-wallet-one-vote rule. For a fresh successful vote, import or select a different Hardhat test account.
6. Switch MetaMask to another network to show the helpful wrong-network message, then switch back to Hardhat Local.

## Notes

This project is an educational local demo, not an election-ready system. Blockchain transactions are public, and wallet addresses are pseudonymous rather than private identities. A local Hardhat chain is ephemeral and is not a production network.
