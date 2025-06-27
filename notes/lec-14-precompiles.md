# Lec-13: Precompiles by Danno Ferrin

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week10-dev)

## Overview

This lecture is about EVM precompiles. The overview of the lecture includes:

- What are Precompiles?
- How do precompiles work?
- Use outside of Mainnet i.e. L2 and Alt L1 use cases
- Future Developments
- EOF

## Sections Timestamp


| Topic                                  | Time    |
| -------------------------------------- | ------- |
| Introduction                           | 2:30    |
| Danno's Technical Background           | 4:20    |
| Agenda                                 | 7:18    |
| Precompiles types                      | 8:14    |
| Ethereum Mainnet Precompiles           | 10:54   |
| Precompiles: Perspective from EVM      | 18:18   |
| Example: ECRecover                     | 19:47   |
| Design issues in Precompiles           | 22:46   |
| Questions                              | 25:33   |
| Precompile implementations             | 27:18   |
| Implementation Strategies              | 31:57   |
| System Contracts                       | 35:25   |
| Notable design choices in L2 contracts | 47:00   |
| Foreign Host Chain Services            | 50:26   |
| Security Risks with System Contracts   | 53:18   |
| Precompiles futures                    | 58:28   |
| Progressive Precompile                 | 1:02:38 |
| Questions                              | 1:06:40 |


## Table of contents

<!-- mtoc-start -->

* [Speaker's background](#speakers-background)
* [Precompiles](#precompiles)
* [Ethereum Mainnet Precompiles](#ethereum-mainnet-precompiles)
* [EVM Implementation of Precompiles](#evm-implementation-of-precompiles)
  * [Example—ECRecover](#exampleecrecover)
* [Design issues in precompiles](#design-issues-in-precompiles)
* [Questions: Part-1](#questions-part-1)
* [Implementation of precompiles](#implementation-of-precompiles)
* [Implementation Strategies](#implementation-strategies)
  * [Why use precompiles natively and not in EVM?](#why-use-precompiles-natively-and-not-in-evm)
* [System contracts](#system-contracts)
  * [Use cases](#use-cases)
  * [Typical L2 System Contract use](#typical-l2-system-contract-use)
* [Notable design choices in L2 contracts](#notable-design-choices-in-l2-contracts)
  * [Foreign Host Chain Services](#foreign-host-chain-services)
  * [Security & System Contracts](#security--system-contracts)
* [Precompiles Futures](#precompiles-futures)
* [Progressive Precompiles](#progressive-precompiles)
* [Questions: Part-2](#questions-part-2)

<!-- mtoc-end -->

## Speaker's background

Danno Ferrin, the OG Java Developer who have previously worked in Google & Oracle before contributing to the Ethereum ecosystem. He also has published a book named *Griffon in Action*.

He is core-dev who help maintain Besu client.

## Precompiles

There are three kinds of precompiles:

- ***Precompiles***: tasks you could do with the EVM, but are too expensive/slow. Example: Keccak256 hashing
- ***System Contracts***: Tasks and side effects you cannot do with the EVM. Example: General use cases are in L2s and alt-VMs and alt-L1s. These system contracts take something in the EVM and do something in a different layer or foreign system in the blockchain that isn't exactly the EVM.
- ***Predeployed Contracts***: Contracts that are part of the initial state i.e. comes with the genesis file or a hard fork.

## Ethereum Mainnet Precompiles

- `0x01`: ecRecover
- `0x02`: SHA2-256
- `0x03`: RIPEMD-160
- `0x04`: Identity
- `0x05`: modexp (Byzantium)
- `0x06`, `0x07`, `0x08`: ecAdd, EcMul, and EcPairing on `alt_bn128` (Byzantium)
- `0x09`: Blake2B F Function (Istanbul)
- `0x0A`: KZG Point Evaluation (Cancún)


Relevant resource:
- [ ] [Ethereum precompiled contracts - RareSkills](https://www.rareskills.io/post/solidity-precompiles)

## EVM Implementation of Precompiles

>Precompiles are *like any other contract*. You put data in, and you get data back. It could be native or EVM; it just magically works.

- All costing is based on the input.
- If you pick a bad client implementation, it's less efficient, and you can slow down your VM.
- The return data is put in the return buffer or output memory.

**None** of the proposed precompiles do *deeper calls*. That path has been explored and rejected.

They *don't interact* with the **existing EVM environment** due to security risks.

### Example—ECRecover

**INPUT: {128 bytes}**

- \[`0x00`-`0x1f`] — commit hash
- \[`0x20`-`0x3f`] — v (27 or 28, pre recovery id)
- \[`0x40`-`0x5f`]: r (x-value for secp256k1)
- \[`0x60`-`0x6f`]: s (as per secp256k1)

**RETURNS: {20 bytes}**

- \[`0x00`-`0x1f`: lower 20 bytes of 32 bytes public key

**GAS COST**
- 3000 no matter what.

When you verify a signature, you get following four points on the curve:
- negative infinity,
- positive infinity,
- two different points .

Recovery ID (`v`) tells us which one to use to recover the address.

For more info read:
- [ECRecover and Signature Verification in Ethereum • Coder's Errand](https://coders-errand.com/ecrecover-signature-verification-ethereum/)
- [solidity—Ethereum ecrecover signature verification and encryption—Ethereum Stack Exchange](https://ethereum.stackexchange.com/a/118415)

## Design issues in precompiles

- *All* **boundary conditions** must be *specified.* Everyone will try to break it, so the clients should be unanimously able to handle them.
- Gas should *scale with effort* based on execution requirements & inputs.
- Cost should account for *worst case.* Example: `modexp` is a great example because individuals would pass absurdly large numbers and tried using even modulus (very slow) to just troll during DEVCON-2.


## Questions: Part-1

*Ques.* Are pre-compile codes implemented inside the JVM, are they being done in another process?

*Ans.* Considering Besu and other Java clients, some precompiles like `0x04-Identity` is really simple and are executed in Java.

But for the complex precompiles like ECDSA, we use different external  libraries into Java.

## Implementation of precompiles

- Besu: `org.hyperledger.besu.evm.precompile`
- Geth: `core/vm/contracts.go`
- Nethermind: `Nethermind.EVM.Precompiles` namespace
- Reth: REVM precompiles crates

## Implementation Strategies

1. Implement with client software
2. Implement with external library (as source or binary)
  - Pro : *Client devs don't need to understand the maths.*
  - Con: *different libraries may have different bugs.*

**Example:** ECDSA code in bitcoin is written in x86 and ARM machine code to make it blazingly fast because the expensive part of Bitcoin is validating the hashes (single longest path).

*Ques.* Can you discuss some specific ways in which pre-compiles reduce gas costs compared to implementing similar functionalities in pure Solidity?

*Ans.* *EVM is a 256-bit stack machine*; every word that goes on there is 256 bits.

But some of these operations, to find—like in Keccak in particular that use smaller bits, or they have definitions that are really pliable to vector operations.

The suitable example to understand this scenario is *Fuzzing Geth Bug* in `0x05: modexp` precompile.

Modexp's variable width number parameter could potentially go up to unbound sizes of numbers.

Geth uses Go's big number and if you pass absurdly large number, you could segment fault `geth`. So from some of these fuzzing efforts, they figured out a way to take down SSL servers just because they're trying to fuzz their Geth implementation.

### Why use precompiles natively and not in EVM?

The biggest reason to not do it in EVM code is because it's much *faster to do it natively.* When you're building blocks and when you're
trying to find MEV, you want to do these absolutely as fast as possible. *So not only is it faster, but it's also cheaper in gas.*

## System contracts

>System contracts are a pathway to many capabilities some consider to be unaligned.
>  \- Darth Genesis

System contracts are a specialized set of contracts in virtual machines (VM) that enhance the Ethereum Virtual Machine (EVM) by supporting opcodes not available by default.

These contracts operate under unique conditions and have privileges not accessible to standard user contracts. [Link](https://docs.zksync.io/zksync-protocol/contracts/system-contracts)

### Use cases

- Access L1/L2 bridging (Arbitrum, Optimism, ZK chains)
- Access Foreign host chain services (Moonbeam; Polkadot, Aurora; NEAR, Hedera)
- Advanced Services: Coming soon (Fhenix; FHE, Ritual; AI Model execution)

### Typical L2 System Contract use

- L1/L2 communications
- Treasury / Fee Vault Management i.e. bridge
- Security / Admin tasks
- Chain info queries (rather than new 0x30 — 0x4f opcodes)

>More info at [RollupCodes](https://www.rollup.codes/)


## Notable design choices in L2 contracts

*1️⃣ Use of Solidity ABI for precompiled access*

There are some notable design choices and the way L2 contracts handle their precompiles versus the way Ethereum mainnet does.

Almost universally, anything that is not mainnet, especially is L2, uses ***Solidity API*** for the pre-compiled access.

>In mainnet, each address does only one thing and does it well.

But, if we had one precompile for each address, then there would be thousands of precompiles in some L2s.

Hence, **Solidity ABI** are the default interface for messaging between the 2 layers.

>Hence, we need an ERC to standardize Solidity ABI, and separate it from Solidity. It is used in various different places (eg. Vyper), so it's worth separting it and having it as its own standard.

*2️⃣ Mixed API design*

The preferred design choice of L2s to either have **multiple contracts** or **one gaint contract.**

*3️⃣ Mixed Permanance*

Following are some ways the contracts are operated based on security risks:
- Proxies
- Fixed deployments

*4️⃣ Mixed Implementation Strategies*

- Direct implementation in node client software
- Solidity implemented predeploys and event controlling L2Node actions

*5️⃣ Mixed Contract Address Deployments*

- Consecutive addresses (low or prefixed like mainnet)
- `CREATE2` driven (deterministic address; large number of initial zeros preferred)

### Foreign Host Chain Services

- Alt-L1 Token Access; Moonbeam, Aurora, Hedera have proxies to their Alt-L1 Token System.
- Alt-L1 Account Tools; Moonbeam and Polkadot famously have voting and messaging across various alt-L1 layers.
- ZK Features; ZK Sync has a class of storage that's immutable, and they access it through pre-compiles.

### Security & System Contracts

*Precompiles don't share Ethereum's Memory Model.* In Ethereum, each contract has its own set of contract storage, and only that contract can access it. But you added another layer called a delegate call, and what that allows is for another contract to act on your memory model as though it's you. That's the power of delegate calls.

This is how *proxy contracts* work. The proxy contract will have represent storage, all the transactions executed through this proxy contract are using delegatecall to another contract that may iterate to new versions (to fix bugs & add new features), but the storage stays unhindered.

>But again the issue lies, `DELEGATECALLS` can impersonate SENDERs via callback.

Hence, its best to *ban `DELEGATECALL` into precompiles.* If you're being delegate called, you can just refuse the system contract.

>Ensure all actions are ***revertable***.

To better understand Ethereum's memory model i.e. storage layout and mechanism behind `delegatecall` and how its different from `call`, read the following:

- [Is there a (theoretical) limit for amount of data that a contract can store? - Ethereum Stack Exchange](https://ethereum.stackexchange.com/questions/1038/is-there-a-theoretical-limit-for-amount-of-data-that-a-contract-can-store)
- [Contracts — Solidity 0.8.29 documentation](https://docs.soliditylang.org/en/v0.8.29/contracts.html#custom-storage-layout)
- [Mastering Delegatecall in Solidity: A Comprehensive Guide with EVM Walkthrough \| by Oluwatosin Serah \| Medium](https://medium.com/@ajaotosinserah/mastering-delegatecall-in-solidity-a-comprehensive-guide-with-evm-walkthrough-6ddf027175c7)

## Precompiles Futures

**1️⃣** There is resistance to adding new mainnet precompiles with an exception of *BLS9 precompile* (due to its dependency for signing messages for everything consensus related; propose, attest, etc.)

The reasons behind the resistance are:

- The testing surface is high
- Maintain them forever (with the hope that someone might use it. Examples are: Blake2 & RIPEMD-160)

**2️⃣** Rollcall is standardizing L2 Precompiles with [RIPs](https://github.com/ethereum/RIPs/tree/master/RIPS). One such example are: *ECDSA (secp256r1) verification*.

Rollcall helps the L2 community by talking about some of their standards issues and aiming to make sure that they're aligned on things without having to make everyone work on the same item.

The upside is if an L2 gets the standardization or implementation wrong, it's *only* the L2 that has to live with it forever, not that—if one or two L2s implement it, but if they get it right, all the L2s will implement it, and it will then *come into mainnet because it's been proven*.

>The intention is to integrate an approach where things that might come into the EVM are first prototyped on L2, and then when they're proven successful and proven stable, then they come into L1 if needed.

**3️⃣** *EVMMAX (modular math extensions) may help reduce the demand*

It's *modular exponentiation*; it provides a lot of features to do modular math—modular add, modular divide—that is essential to the way that the ECDSA style curves work.

Aspirationally, their goal is to make sure that these things are within 2x the gas cost of what you might make a normal pre-compiled costed with if you do it natively.

>Almost the entirety of the difficulty is handling the modular maths in these extensions. The real expense comes in doing these 384-bit modular divisions of all the numbers that are very expensive to do in the old EVM.

With possible `EVMMAX` future integration, it should *reduce the need for precompiles* because anyone can easily bring in random curves, new features that are being done in EC type situations and optimize them accordingly.

For more info:

- [EVMMAX Advanced Elliptic Curve Cryptography in EVM by Radosław Zagórowicz | DevConnect Istanbul 2023 - YouTube](https://www.youtube.com/watch?v=qr-6O4f19tg)

## Progressive Precompiles

Proposal: [Progressive precompiles via CREATE2 shadowing](https://ethereum-magicians.org/t/progressive-precompiles-via-create2-shadowing/14821)

The intentions is to ***cannonize*** a well written and thoroughly tested smart contract. Then use `CREATE2` to make sure it always gets proposed at the same address.

So the choice is onto the user to either utilize the **native version** (current) or use the **EVM version** which might be a little slow with an optional perk of *no/less gas*. One such example: [EIP-4788: Beacon block root in the EVM](https://eips.ethereum.org/EIPS/eip-4788)

This requires `EVMMAX` for better maths support.

This might be how the future precompiles might show up in the EVM.

More info: [Progressive precompiles via CREATE2 shadowing - EIPs - Fellowship of Ethereum Magicians](https://ethereum-magicians.org/t/progressive-precompiles-via-create2-shadowing/14821)

## Questions: Part-2

*Ques.* If a bug gets reported in a precompile, what is the plan to action? How does it gets patched in an update?

*Ans.* if there's a bug in a precompile, typically it's only going to be one client that's going to have the bug.

From that information, we tend to look at our own software if someone else has a bug and make sure we're not getting into the same issues if we're not set up the same way.

In general, there's a group where we'll disclose the bug; we'll ship a patch out; we'll ship a new version. Either within that version or a couple versions later. If it's truly urgent and you need to wave the red flag, "Hey, you need to update it now," we'll give one of those patches out.

---

*Ques.* Is there an EIP for new pre-compiles currently being considered?

*Ans.* [EIP-2537: Precompile for BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537) is one of the new precompiles being shipped in Pectra. It has all the maths prerequisite required to perform BLS Signatures.

[RIP-7212: Precompile for secp256r1 Curve Support](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md) implements secp256r1 and models to help it integrate in L2s first and if successful into L1s in future. Secp256r1 curve is commonly used in consumer hardware as its [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) compatible. All the cryptographic keys pushed by Google, Facebook and are stored in you computer systems and phones  use secp256r1 key. It could be a great precursor to help AA evolve.

[EIP-5988: Add Poseidon hash function precompile](https://eips.ethereum.org/EIPS/eip-5988) is the most controversial one. ZK is really unhappy performance- wise when it's asked to do a Keccak hash or a SHA hash. Bit twiddling is not something that ZK proof systems are terribly good at. Poseidon is a hash function that is based off of elliptic curves but its hash is much more friendly to the way ZK systems work.

---

*Ques.* Do precompiles have any impact on network congestion?

*Ans.* The only way they might have impact on network congestion is if you're passing a large amount of data on the pre-compile, and there are already protocol hedges to keep that from having too much of an impact.

Example of hedges are:
- Geth won't gossip any transaction over 128k. (other clients have similar checks)
- the transaction size is limited.
- gas price based on payload of a transaction.

---

*Ques.* What are the challenges and  issues with adding a new precompile?

*Ans.* A lot of the hesitancy to bring in pre-compiles comes in: that a lot of these are a one-way door, and if we get it wrong, picking up the pieces from a real precompile is going to be very difficult.

---

*Ques.* Is there ever any discussion about removing precompiles?

*Ans.* The three most at-risk precompiles are `Identity`, `RIPEMD-160`, `BLAKE2` because they have low to almost no uses. So the idea is to remove them and instead migrate that to a fixed contract  you would execute and then gas prices would approporiately go up.

---

*Ques.* Besu related. what are the challenges in updating to new jvm versions and whatever potential benefits?

*Ans.* Besu compiles with Java 17. The code has to be in Java 17, and when we build it on the build server as a GitHub action.

But from that bytecode, you can change the system underneath it to run Java 21, and just by changing from *Java 17* to *Java 21*, you get like a ***20% speed increase***.

>The prerequisite is for the tools (Gradle, Web3j) to support Java 21 as well.

Good old software engineering issues. When you want to upgrade a version, you got to make sure the entire tangle of dependencies you have can support Java 21.

Besu and likely other projects target long-term support major releases like 17 and now 21.

---

*Ques.* What's the process of defining gas cost for pre-compiles?

*Ans.*
- Initially, you come up with a few implementations onto various clients. You make sure the clients implement it, and you'll have one client that would be the lead, and they'll get their estimations on the gas.
- Get all of the typical and worst-case usages in a tight loop. Figure out how much benchmark i.e. wall clock time it takes to execute these pre-compiles.
- Figure out the real actual wall clock time to execute.
- Might compare with a benchmark on the system.
- One effective way (ModExp rationalizing prices) was picking a ***mega gas per second standard*** (e.g., 25, 35).
- Numbers have gone up over the years; *25* was while calculating for ModExp. BLS precompile was calculated against *35 mega gas* as the goal.
- Executing a pre-compile in a tight loop with worst possible answers should burn about the target (e.g., 35 million) gas per second.
- The premise/goal is to make that *heavy usage the worst solution*.
- Talking about repricing BLS based off old numbers because performance on VMs has gone up.
- *Probably going to look at a new number (40 or 60 or 80 mega gas).*
- The cost of the pre-compile is going to necessarily go up.
- The goal is to make sure using it as a denial-of-service attack is not the most efficient way; it's going to cost money in gas.
- There are going to be more efficient operations to cause it to slow down.
- Base has this dream of being Giga gas; dealing with pre-compiles is one of the tough battles.
- Pre-compiles are one of the barriers to hit reliable Giga gas as none execute on a Giga gas level.
- The battle to Giga gas might be conquered with concurrency ideas to execute and build blocks concurrently.
