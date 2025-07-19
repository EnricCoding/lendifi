# LendiFi (Mini Aave)

A lean, Aave‑inspired DeFi lending & borrowing protocol with upgradable smart‑contracts and a modern React/Next.js frontend.

---

## 🔥 What Is LendiFi?

LendiFi demonstrates the **core mechanics** of a money‑market protocol:

| Action | What happens on‑chain |
|--------|-----------------------|
| **Deposit** | Supply an ERC‑20 token → the pool mints **aTokens** (1 aToken ≈ 1 underlying) that accrue interest. |
| **Borrow**  | Use your deposit as collateral to borrow up to the _Loan‑to‑Value (LTV)_ ratio. |
| **Repay**   | Pay back principal + interest to regain borrowing power. |
| **Withdraw**| Burn aTokens to redeem the underlying collateral. |
| **Liquidate** | If **Health Factor < 1** anyone can repay part of your debt and seize a bonus on your collateral. |

---

## 🏗️ High‑Level Architecture

---

## 🛠️ Core Tech Stack

| Layer | Key Tools & Libraries | Version |
|-------|----------------------|---------|
| **Smart‑Contracts** | Solidity | **0.8.28** |
|  | Hardhat | **2.24.3** |
|  | OpenZeppelin Contracts | **5.3.0** |
|  | Ethers (JS SDK for scripts) | **5.8.0** |
| **Frontend** | Next.js | **14.1.0** |
|  | React | **18.x** |
|  | TypeScript | **5.x** |
|  | TailwindCSS | **3.3.0** |
|  | wagmi (React Web3 hooks) | **2.15.6** |
|  | viem (low‑level RPC) | **2.31.4** |
|  | Ethers (JS SDK for dApp) | **6.14.4** |
| **State / Data** | TanStack React‑Query | **5.81.2** |
| **Testing** | Hardhat (Mocha/Chai) | built‑in |
|  | Jest + React Testing Library | **30.0.2 / 16.3.0** |
| **CI / Deployment** | GitHub Actions · Vercel | — |

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
