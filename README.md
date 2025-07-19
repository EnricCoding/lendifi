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
