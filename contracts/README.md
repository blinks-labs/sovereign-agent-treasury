# Sovereign Agent Treasury - Governance Contracts

This directory contains the on-chain governance infrastructure for the Sovereign Agent Treasury DAO, deployed on Monad testnet.

## 📋 Contract Overview

### GOVToken.sol
**ERC20 governance token with voting capabilities**

- **Name**: Sovereign Governance
- **Symbol**: GOV
- **Standard**: ERC20 + ERC20Permit + ERC20Votes
- **Max Supply**: 10,000,000 GOV
- **Features**:
  - Delegated voting (checkpoint-based)
  - Gasless approvals via permits
  - Mint controlled by governance timelock
  - Voting power snapshots for proposals

### Governance.sol
**Full-featured governance contract based on OpenZeppelin Governor**

Extends:
- `Governor` - Base governance logic
- `GovernorSettings` - Configurable voting parameters
- `GovernorCountingSimple` - Simple for/against/abstain voting
- `GovernorVotes` - Integration with voting tokens
- `GovernorVotesQuorumFraction` - Percentage-based quorum
- `GovernorTimelockControl` - Delayed execution via timelock
- `AccessControl` - Role-based permissions

**Key Features**:
- **Proposal Types**: General, TreasuryAction, ParameterUpdate, Emergency
- **Role-Based Access**: AGENT_ROLE, PROPOSER_ROLE, GOVERNANCE_ADMIN
- **Emergency Proposals**: Bypass timelock for critical situations
- **Automated Agents**: Treasury agent can submit proposals directly

### TimelockController (OpenZeppelin)
**Execution delay mechanism for security**

- **Min Delay**: 2 days
- **Proposers**: Governance contract only
- **Executors**: Anyone (permissionless execution)
- **Admin**: Renounced after setup (decentralized)

---

## 🚀 Deployment Instructions

### Prerequisites

1. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install dependencies**:
   ```bash
   forge install OpenZeppelin/openzeppelin-contracts
   ```

3. **Set environment variables**:
   ```bash
   export PRIVATE_KEY="your-private-key"
   export MONAD_RPC="https://testnet-rpc.monad.xyz"
   ```

### Full Deployment (New Token)

Deploy all contracts including a new GOV token:

```bash
forge script script/DeployGovernance.s.sol:DeployGovernance \
  --rpc-url $MONAD_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Integration Deployment (Existing Token)

If the GOV token is already deployed at `0x1Cf957ce9d0347770660C754037021C1dCE27777`:

```bash
forge script script/DeployGovernance.s.sol:DeployGovernance \
  --sig "runWithExistingToken()" \
  --rpc-url $MONAD_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Deployment Output

After deployment, addresses are saved to:
- `deployments/latest.json` - Always points to latest deployment
- `deployments/monad-testnet-{timestamp}.json` - Historical record

Example output:
```json
{
  "chainId": 10143,
  "contracts": {
    "GOVToken": "0x...",
    "Governance": "0x...",
    "TimelockController": "0x..."
  },
  "configuration": {
    "proposalThreshold": 1000000000000000000000,
    "votingDelay": 1,
    "votingPeriod": 50400,
    "quorumNumerator": 400
  }
}
```

---

## 🔗 Integration with GOV Token

### Existing Token Details

- **Address**: `0x1Cf957ce9d0347770660C754037021C1dCE27777`
- **Network**: Monad Testnet (Chain ID: 10143)
- **Treasury Agent**: `0x71bFE76f99b01034ad6AC7E9D0D9b06A186fbC62`

### Integration Steps

1. **Use existing token in governance**:
   ```solidity
   IVotes govToken = IVotes(0x1Cf957ce9d0347770660C754037021C1dCE27777);
   ```

2. **Token holders delegate votes**:
   ```solidity
   GOVToken(0x1Cf957ce9d0347770660C754037021C1dCE27777).delegate(voterAddress);
   ```

3. **Query voting power**:
   ```solidity
   uint256 votes = govToken.getVotes(account);
   uint256 pastVotes = govToken.getPastVotes(account, blockNumber);
   ```

### Token Distribution

- Initial supply minted to treasury agent
- Distribution managed by governance proposals
- Additional minting requires timelock approval

---

## 🗳️ How to Use Governance

### Creating Proposals

#### 1. As Token Holder

Requires 1,000+ GOV tokens delegated:

```solidity
address[] memory targets = new address[](1);
uint256[] memory values = new uint256[](1);
bytes[] memory calldatas = new bytes[](1);

targets[0] = treasuryAddress;
values[0] = 0;
calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", recipient, amount);

governance.propose(targets, values, calldatas, "Transfer funds to contributor");
```

#### 2. As Treasury Agent

Requires AGENT_ROLE:

```solidity
governance.proposeAsAgent(
    targets,
    values,
    calldatas,
    "Quarterly rebalance proposal",
    Governance.ProposalType.TreasuryAction,
    "ipfs://Qm..."
);
```

#### 3. Treasury-Specific Actions

Requires PROPOSER_ROLE:

```solidity
governance.proposeTreasuryAction(
    treasuryAddress,
    0,
    abi.encodeWithSignature("swap(address,address,uint256)", tokenA, tokenB, amount),
    "Swap proposal",
    "https://gov.sovereign-treasury.eth/proposal/42"
);
```

### Voting

```solidity
// Cast vote
governance.castVote(proposalId, 1); // 0=Against, 1=For, 2=Abstain

// Vote with reason
governance.castVoteWithReason(proposalId, 1, "Support this initiative");

// Vote by signature (gasless)
governance.castVoteBySig(proposalId, 1, v, r, s);
```

### Proposal Lifecycle

```
Pending → Active → Succeeded/Defeated → Queued → Executed
   ↑          ↓           ↓                ↓
 1 block   7 days     4% quorum       2 day delay
 (delay)  (voting)    majority for
```

### Executing Proposals

After timelock delay:

```solidity
governance.execute(
    targets,
    values,
    calldatas,
    keccak256(bytes(description))
);
```

### Emergency Proposals

Bypass timelock (GOVERNANCE_ADMIN only):

```solidity
governance.proposeEmergency(
    targets,
    values,
    calldatas,
    "CRITICAL: Pause contract"
);
```

---

## 📊 Governance Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Proposal Threshold | 1,000 GOV | Minimum tokens to create proposal |
| Voting Delay | 1 block | Blocks before voting starts |
| Voting Period | 50,400 blocks | ~7 days at 12s block time |
| Quorum | 4% | Minimum participation for valid vote |
| Timelock Delay | 2 days | Execution delay after success |

---

## 🔐 Roles & Permissions

| Role | Holders | Capabilities |
|------|---------|--------------|
| DEFAULT_ADMIN_ROLE | None (renounced) | Emergency recovery |
| GOVERNANCE_ADMIN | Initial deployer | Parameter updates |
| AGENT_ROLE | Treasury agent | Submit agent proposals |
| PROPOSER_ROLE | Designated addresses | Create any proposal |
| PROPOSER_ROLE (timelock) | Governance | Queue executions |

---

## 🔗 Monad Testnet Resources

- **Explorer**: https://testnet.monadexplorer.com
- **Faucet**: https://testnet.monad.xyz/faucet
- **RPC**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143

---

## 📚 Additional Resources

- [OpenZeppelin Governor Docs](https://docs.openzeppelin.com/contracts/5.x/governance)
- [Monad Documentation](https://docs.monad.xyz)
- [Foundry Book](https://book.getfoundry.sh)

---

## 🛠️ Testing

Run the test suite:

```bash
forge test --rpc-url $MONAD_RPC
```

---

**Deployed on Monad Testnet | Powered by OpenZeppelin Contracts**
