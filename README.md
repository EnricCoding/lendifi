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

# ⚙️ Quick Start — Local Dev in 5 Steps

> **Requirements**  
> • Node 18 + (LTS) • Git • MetaMask (or any EVM wallet)

---

## 1 Clone + Install

```bash
git clone https://github.com/EnricCoding/lendifi.git
cd lendifi

# Root deps – Hardhat, tests, scripts
npm install

# Frontend deps
cd frontend && npm install
cd ..        # back to repo root
```

---

## 2 Create `.env` files

```bash
cp .env.example              .env
cp frontend/.env.example     frontend/.env.local
```

| Key | File | Purpose |
| --- | ---- | ------- |
| `PRIVATE_KEY` | `.env` | Your wallet private key. Throw‑away account you control (**never commit real keys**) |
| `SEPOLIA_RPC` | `.env` | Create account in Alchemy/Infura and get the HTTPS endpoints |
| `NEXT_PUBLIC_SEPOLIA_RPC` | `frontend/.env.local` | Same RPC for the dApp |
| `NEXT_PUBLIC_*_ADDRESS` | `frontend/.env.local` | **Leave blank** – will be filled after deploy |

> **Tip:** Register in Alchemy (Web 3 Suite of APIs) <https://www.alchemy.com/>.
> **Tip:** Get free Sepolia ETH at <https://faucet.circle.com/>.

---

## 3 Compile & Deploy to Sepolia

```bash
# compile (re‑generates ABIs)
npx hardhat compile

# deploy
npx hardhat run scripts/deploy.ts --network sepolia
```

Sample output:

```
Deploying with: 0xYourDeployer…
AToken             → 0x4A345C803817D2a195854b0F1198d716FF050C6C
PriceOracle        → 0x9ed1D24E4CcCd4D65026f0DE7223907A3f227553
InterestRateModel  → 0x2de9e3f37fB210ECa960DBaB2C4270A44D29e646
LendingPool        → 0x3B9DcEfE78447A945F12b727373a80FeA3f212e3
Ownership of aToken transferred to LendingPool
```

Copy **only** these addresses into `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x3B9DcEfE78447A945F12b727373a80FeA3f212e3
NEXT_PUBLIC_RATE_MODEL_ADDRESS=0x2de9e3f37fB210ECa960DBaB2C4270A44D29e646
NEXT_PUBLIC_ORACLE_ADDRESS=0x9ed1D24E4CcCd4D65026f0DE7223907A3f227553
```

---

## 4 Launch the Frontend

```bash
cd frontend
npm run dev       # ⇢ http://localhost:3000
```

Open the site, connect MetaMask (Sepolia network) with **the same deployer account** or any funded test wallet.

You’re ready – Deposit → Borrow → Repay → Withdraw → Liquidate 🎉

---

## Keeping ABIs in Sync

Whenever you change Solidity:

```bash
npx hardhat compile
```

The freshly generated ABIs land in `artifacts/` and are automatically used by `scripts/deploy.ts`. After redeploying, update the three `NEXT_PUBLIC_*_ADDRESS` values in `frontend/.env.local`, rebuild (Vercel) or restart `npm run dev`, and you’re good to go.

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

(Optional) If do you want to deploy the project finally, push `frontend/` to Vercel and add environment variables. 

---

# 📈 Protocol Metrics — Quick Reference

| Metric | What it measures | Formula / Units |
|--------|------------------|-----------------|
| **Utilisation** (`u`) | Share of supplied liquidity currently borrowed.<br>0 % = idle, 100 % = fully lent. | `u = totalDebt ÷ totalCollateral` |
| **Borrow APR** | Annual percentage rate paid by borrowers (simple, non‑compounded). | `APR = InterestRateModel.borrowRate(u)` |
| **Deposit APY** | Effective annual yield earned by suppliers (compounded). | `APY ≈ Borrow APR × u` |
| **Health Factor** (`HF`) | Safety buffer of a user’s position; liquidation when `HF < 1`. | `HF = (Collateral × Price × LTV) ÷ Debt` |

> **Rule of thumb**  
> • `HF > 2` = very safe • `1 < HF ≤ 2` = monitor position • `HF ≤ 1` = at risk of liquidation

---

## 🔍 Glossary

| Term | Description |
|------|-------------|
| **LTV** | *Loan‑to‑Value*. Max % of collateral value that can be borrowed (e.g. 80 %). |
| **WAD / RAY** | Fixed‑point math units: WAD = 10¹⁸, RAY = 10²⁷. |
| **Reserve Factor** | Share of interest routed to the protocol treasury. |
| **Liquidation Bonus** | Extra collateral a liquidator receives as incentive (e.g. 5 %). |

---

## 🤝 Contributing

Fork, branch, commit with conventional commits, open a PR and pass the CI pipeline!

---

## 📜 License

MIT © 2025 LendiFi
