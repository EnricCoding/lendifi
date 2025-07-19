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

## 2 Create `.env` files

```bash
cp .env.example              .env
cp frontend/.env.example     frontend/.env.local
```

| Key | Where | Purpose |
| --- | ----- | ------- |
| `PRIVATE_KEY` | `.env` | Throw‑away key you control (**never commit real keys**) |
| `SEPOLIA_RPC` | `.env` | Alchemy / Infura HTTPS endpoint |
| `NEXT_PUBLIC_SEPOLIA_RPC` | `frontend/.env.local` | Same RPC for the dApp |
| `NEXT_PUBLIC_*_ADDRESS` | `frontend/.env.local` | **Leave blank** until Step 4 prints them |

---

## 3 Start Hardhat node *(Terminal #1)*

```bash
npx hardhat node            # localhost:8545  • chainId 31337
```

Hardhat prints 20 pre‑funded accounts (10 ETH each). Copy the **first private key** for MetaMask.

---

## 4 Deploy contracts *(Terminal #2)*

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Paste printed addresses into `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_RATE_MODEL_ADDRESS=0x...
```

---

## 5 Launch the dApp *(Terminal #3)*

```bash
cd frontend
npm run dev                 # http://localhost:3000
```

1. MetaMask → Network → **Localhost 8545**  
2. Import the private key from Step 3 (Account #0)  
3. Enjoy: Deposit → Borrow → Repay → Withdraw → Liquidate 🎉

---

### Deploying to Sepolia (optional)

```bash
# Fund wallet (free test ETH)
open https://faucet.circle.com/

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# Update addresses in frontend/.env.local and redeploy the frontend (e.g. Vercel)
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

## 📈 Protocol Metrics

| Metric | What it measures | Formula / Units |
|--------|------------------|-----------------|
| **Utilisation** (`u`) | Share of supplied liquidity currently borrowed. 0 % = idle, 100 % = fully lent. | `u = totalDebt ÷ totalCollateral` |
| **Borrow APR** | Annual percentage rate paid by borrowers (simple interest, not compounded). Calculated block‑by‑block via the Interest‑Rate Model. | `APR = InterestRateModel.borrowRate(u)` |
| **Deposit APY** | Effective annual yield earned by suppliers (compound interest assumption). | `APY ≈ Borrow APR × u` |
| **Health Factor** (`HF`) | Safety buffer of a user’s position; liquidation when `HF < 1`. | `HF = (Collateral × Price × LTV) ÷ Debt` |

> **Rule of thumb**  
> • `HF > 2` = very safe • `1 < HF ≤ 2` = monitor position • `HF ≤ 1` = liquidation possible

## 🤝 Contributing

Fork, branch, commit with conventional commits, open a PR and pass the CI pipeline!

---

## 📜 License

MIT © 2025 LendiFi
