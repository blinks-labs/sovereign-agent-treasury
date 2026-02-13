# 🔒 SECURITY NOTICE

## ⚠️ CRITICAL: Never Share These

The following must **NEVER** be committed to git or shared publicly:

### 🔐 Secrets to Protect:
- ❌ AgentWallet API tokens (`mf_...`)
- ❌ OpenRouter API keys (`sk-or-v1-...`)
- ❌ Hackathon API keys
- ❌ Private keys or wallet seeds
- ❌ `.env` files
- ❌ Any credentials files

### ✅ Safe to Share:
- ✅ Public wallet addresses
- ✅ Transaction hashes
- ✅ Code (without secrets)
- ✅ Architecture diagrams
- ✅ Performance metrics

## 🛡️ Security Measures Implemented:

1. **Gitignore**: All secret files excluded
2. **Environment Variables**: Secrets loaded from .env
3. **No Hardcoding**: All credentials via config
4. **Public Code Only**: GitHub repo safe to share

## 📝 For Hackathon Submission:

When sharing our project:
- ✅ Share code repository
- ✅ Share transaction hashes (public blockchain data)
- ✅ Share performance metrics
- ❌ **NEVER** share API keys or tokens

## 🔍 What Judges Can Verify:

- Transaction hashes on Solana explorer (public)
- Forum posts (public)
- Code architecture (public)
- Performance claims (verifiable on-chain)

Everything is transparent WITHOUT exposing secrets!