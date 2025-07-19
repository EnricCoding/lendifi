# LendiFi (Mini Aave)

_A production‑grade, minimal DeFi lending & borrowing protocol inspired by Aave._

---

## 🔥 Overview

LendiFi lets users deposit ERC‑20 tokens to earn interest, borrow against collateral, repay debt, and perform liquidations when positions become unhealthy—all through a polished Next.js dApp.

---

## 🏗️ Architecture

```mermaid
flowchart TD
  subgraph On‑chain
    Proxy[LendiFiProxy (UUPS)] -->|delegatecall| Impl[LendingPool v1]
    Impl --> ORA[PriceOracle]
    Impl --> IRM[InterestRateModel]
    Impl --> aTK[aToken (ERC‑20)]
    Impl --> dTK[DebtToken (ERC‑20)]
  end
  subgraph Off‑chain
    FE[Next.js dApp]
    Scripts[Hardhat Scripts]
    CI[GitHub Actions]
  end
  FE -->|JSON‑RPC| Proxy
  Scripts -->|Deploy & Verify| Proxy
```

---

## 🛠️ Tech Stack

| Layer               | Tooling                                                   | Version |
| ------------------- | --------------------------------------------------------- | ------- |
| **Smart Contracts** | Solidity 0.8.28, OZ 5.3, Hardhat 2.24                     |         |
| **Frontend**        | Next.js 14, React 18, TypeScript 5                        |         |
|                     | wagmi 2 + viem 2, Chakra UI 3, TailwindCSS 3              |         |
| **Testing**         | Hardhat (Mocha/Chai), solidity‑coverage, slither, Jest 30 |         |
| **CI/CD**           | GitHub Actions, Vercel, Etherscan verify                  |         |

---

## 📂 Repo Structure

```
mini-aave/
├─ contracts/             # Solidity
├─ scripts/               # Deploy helpers
├─ test/                  # Contract tests
├─ frontend/              # Next.js dApp
│  ├─ app/ components/ hooks/ lib/ abis/ config/
│  └─ tailwind.config.ts
└─ README.md
```

---

## ⚙️ Setup

```bash
git clone https://github.com/EnricCoding/lendifi.git
cd LendiGi
npm install
cd frontend && npm install
```

Create `.env` and `frontend/.env.local` from the provided examples, then:

```bash
# Compile & deploy to local Hardhat
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost

# Run dApp
cd frontend && npm run dev
```

---

## 🧪 Testing

```bash
# contracts
npx hardhat test
# coverage
npx hardhat coverage
# frontend
cd frontend && npm test
```

---

## 🚀 Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Finally, push `frontend/` to Vercel and add environment variables.

---

## 📈 Key Metrics

| Metric        | Formula                              |
| ------------- | ------------------------------------ |
| Utilisation   | `debt / collateral`                  |
| Borrow APR    | `InterestRateModel.borrowRate(util)` |
| Deposit APY   | `BorrowAPR × utilisation`            |
| Health Factor | `(Collateral × Price × LTV) / Debt`  |

---

## 🤝 Contributing

Fork, branch, commit with conventional commits, open a PR and pass the CI pipeline!

---

## 📜 License

MIT © 2025 LendiFi
