# Lec-12: Devops & Testnets by Parithosh Jayanthi

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week9-dev)

## Overview

This lecture is all about the testing and devops pipeline of Ethereum. One of the most important roles among core devs is testing the robustness and security of Ethereum. The overview includes:

- Challenges
- Devnets
- Local testing
- Kurtosis
- Prototyping
- Remote Testing
- Shadow Forks
- Handy tools (ethpandaops)
- Next steps and contributions

# Sections Timestamp


| Topic                              | Time    |
| ---------------------------------- | ------- |
| Introduction                       | 4:42    |
| Challenges                         | 7:30    |
| Devnets                            | 10:15   |
| Local Testing                      | 14:53   |
| Prototyping                        | 25:55   |
| Remote Testing                     | 32:45   |
| Questions                          | 40:13   |
| Shadowforks                        | 47:00   |
| Questions                          | 53:58   |
| Handy Tools: Overview              | 1:03:55 |
| Kurtosis                           | 1:06:55 |
| Template-devnets                   | 1:07:25 |
| Assertoor                          | 1:09:43 |
| Forky                              | 1:16:13 |
| Tracoor                            | 1:18:00 |
| Dora                               | 1:20:03 |
| Xatu                               | 1:20:53 |
| Conclusion: going forward & advice | 1:24:58 |
| Questions                          | 1:27:03 |
| Kurtosis Demo                      | 1:30:03 |


## Table of contents

<!-- mtoc-start -->

* [Test Challenges](#test-challenges)
* [Devnets](#devnets)
  * [Ethereum testing today](#ethereum-testing-today)
* [Local testing](#local-testing)
* [Prototyping](#prototyping)
  * [Example of prototype testing](#example-of-prototype-testing)
* [Remote testing](#remote-testing)
  * [Fix to enhance the testing experience:](#fix-to-enhance-the-testing-experience)
* [Shadowforks](#shadowforks)
* [Handy Tools](#handy-tools)
  * [Kurtosis](#kurtosis)
  * [Template-devnets](#template-devnets)
  * [Assertoor](#assertoor)
  * [Forky](#forky)
  * [Tracoor](#tracoor)
  * [Dora](#dora)
  * [Xatu](#xatu)
* [Conclusion](#conclusion)
  * [Questions](#questions)

<!-- mtoc-end -->

## Test Challenges

- More than 20 client combinations need to be tested & regression can sneak in very easily
- Communicating and debugging various client combinations
- Figure out how to test clients reliably.
- All future upgrades will inherit some of complexity. If you build it once, you can use it for the next few upgrades.
- Competences for ELs and CLs are quite separate.

## Devnets

- A testing mirror of the Ethereum base layer.
- Allow devs to deploy forks and changes without mainnet.
- Contains EL/CL/Validators, setup in a configuration that we want to test.
- Devnets are public, allowing the community to test with us.

### Ethereum testing today

- Current upcoming fork (Pectra)
- Upcoming future fork (Verkle in Fusaka)

- Features that are proposed for future forks:
  - Inclusion Lists: [EIP-7805: FOCIL](https://eips.ethereum.org/EIPS/eip-7805), [EIP-7547: Inclusion lists](https://eips.ethereum.org/EIPS/eip-7547)
  - [EIP-7441 (Whisk)](https://eips.ethereum.org/EIPS/eip-7441)

- Client optimisations:
  - EthereumJS snap sync testnet
  - Bigboi beaconchain tests for blob/validator limits: *maxing out any one parameter* of the Beacon chain if maxing out helps test efficiency.

## Local testing

- Devnets require a lot of coordination among the client and devops teams.
- Due to the issues caused by devnets i.e.
	- coordination problem
	- network breaks due to client didn't startup or wrong specification implemented.
- To solve this, there was a hard push towards local testing.
- With local testing, developers can spin up a really small network to sanity check that everything is working before committing to the bigger Devnet.
- Local testing is fast, iterative testing, with custom configurations to configure slot times; change fork epoch version; do the entire MEV workflow.
- Prototyping is a very powerful tool for not only understanding how Ethereum works but to know about the characteristics of different components of Ethereum.
- Kurtosis is a CLI tool. It consumes YAML. It is written in Starlark (configuration language). The result can be understood by docker as well as kubernetes engine can understand.
- Read more: [GitHub - ethpandaops/ethereum-package](https://github.com/ethpandaops/ethereum-package)
- `kurtosis run --enclave <name> github.com/kurtosis-tech/ethereum-package --args-file <filename>`

Example of YAML definitions:

```YAML
participants:
 - el_type: geth
	cl_type: teku
 - el_type: nethermind
	cl_type: prsym
additional_services:
 - tx_spammer
 - blob_spammer
 - dora
 - prometheus_grafana
snooper_enabled: true
keymanager_enabled: true
```

Configuration for setup MEV-Boost:

```YAML
mev_type: full
additional_services:
 - tx_spammer
 - blob_spammer
 - custom_flood
 - el_forkmon
 - dora
 - prometheus_grafana
mev_params:
 launch_custom_flood: true
 mev_relay_image: flashbots/mev-boost-relay:latest
network_params:
 seconds_per_slot: 3
```

## Prototyping

- Kurtosis have a concept of *"allow everything to be overridden"*.
- Except some network basics, you can change anything in a kurtosis network

### Example of prototype testing

```YAML
participants:
 - el_type: geth
   el_image: ethpandasops/geth:gballet-transition-post-genesis
 - cl_type: lodestar
   cl_image: ethpandaops/lodestar:g11tech-verge
   count: 3
network_params:
 electra_fork_epoch: 1
 genesis_delay: 100
snooper_enable: true
persistant: true
launch_additional_services: true
additional_services:
 - assertoor
 - dora
```

## Remote testing

- Remote testing (public devnets) is more synchronous; we do it once clients are ready.
- Error prone and time consuming.
- Easy drift between setup configs of various testnets due to customizations.
- A few years ago (even now), each team maintained their own start testnet scripts, making interoperability testing hard.

### Fix to enhance the testing experience:

1️⃣ Move barebones logic upstream into role: [github: ethpandaops/ansible-collection-general](https://github.com/ethpandaops/ansible-collection-general)

Barebones logic in ethereum means *generate validator keys, get genesis, start a node, wait for it, get peer-to-peer address, shutdown, clean up*. Each logic can be a role (i.e. function). All the generalized concepts are pooled in the ansible collection general repo.

2️⃣ Move such generic roles into its own tool, e.g. Genesis; [ethpandaops/ethereum-genesis-generator](https://github.com/ethpandaops/ethereum-genesis-generator). Its configurable and handles, Verkle, mainnet ethereum, shadow fork, and the next pectra devnet.


3️⃣ The next problem is **tooling**. For example, due to vast changes to verkle devnet, the explorer might not work. Hence, need a fork of explorer for it to make compatible. Its hard to maintain and scale them. Solution: use Kubernetes and GitOps. Definitions happen via Helm charts. This spins up Ethereum nodes, a network, and tools.

Repo: [ethpandaops/ethereum-helm-charts](https://github.com/ethpandaops/ethereum-helm-charts)

4️⃣ Generalize setups for all testnets; [ethpandaops/template-testnet](https://github.com/ethpandaops/template-testnet).

It has Terraform code to spin up the network, Ansible code to spin up nodes and Genesis information, and the definition of your tooling.

Once pushed to GitHub, GitOps makes the tooling appear. GitOps ensures certificates, URLs, and load balancers are handled.

> In conclusion: For a year, doing the Denon fork, Whisk, Verkle, and other testnets. We reuse the infrastructure for our hsky and Sepolia nodes. It's battle-tested. It has downsides, but we've minimized them.

## Shadowforks

- Shadowforks allows to check compatibility across all client through the entire lifecycle.
- It allows to stress test the clients with real state and transaction load
- It acts as a release test, i.e. last stage of the testing devnet testnet cycle. If you're passing on Shadowfork, same upgrade on mainnet will work as expected.
- Simple in principle,
  - Take a *network genesis file*
  - Modify file to **add a fork timestamp**
  - Setup a new beaconchain with *validators and same fork timestamp*
  - Connect **new beaconchain** ONLY to **ELs** with modified config
  - At fork timestamp, the modified ELs and all CLs will shadowfork *into a new chain*
  - ***New chain continues to build on top of the canonical chain***
- Sprinkle some *peering and mempool complexities* on top to get a shadowfork.

More information here: [How to create a shadowfork - HackMD](https://notes.ethereum.org/@parithosh/shadowfork-tutorial) and [Shadow Forking: Eth Roadmap FAQ](https://github.com/timbeiko/eth-roadmap-faq#shadow-forking)

## Handy Tools

Resource to read through: [Testing overview doc - HackMD](https://notes.ethereum.org/@ethpandaops/testing-overview-doc)

### Kurtosis

Already covered above.

### Template-devnets

- Repo: [ethpandaops/template-testnet](https://github.com/ethepandaops/template-testnet)
- Contains everything required to configure for any type of testnet
- It uses terraform to spin up cloud instances and Ansible to deploy the network
- Ansible configs are reliant on these roles
- Useful if you want to run nodes on a larger scale and local testing tool are inadequate

### Assertoor

- Repo: [ethpandaops/assertoor](https://github.com/ethpandaops/assertoor)
- Tools to assert network level expectations
- Some example questions: can a network handle deposits, can it handle every opcode being called, can it handle a reorg
- As its a general testing tool, can be used for any assertion on any network.
- E.g. on verkle network, was state transition a success.
- Similar to hive, *Hive → single node*, *Assertoor → Network wide*
- Can be run locally via kurtosis or integrated into a CI: [ethpandaops](https://github.com/ethpandaops/assertoor-github-action)
- Asserter can be interacted with via the API, so you can run it and then configure tests.

>Current focusing on trying to get every validator client compatible with every beacon node, so that's a quite a big matrix.

### Forky

- Repo: [ethpandaops/forky](https://github.com/ethpandaops/forky)
- Ethereum forkchoice visualizer
- Can display the forkchoice of a live node or you can upload you own
- Helps debug forkchoice related issues
- Can be run standalone or via kurtosis
- Forkchoice of mainnet: [Link](https://forky.mainnet.ethpandaops.io)


### Tracoor

- Repo: [ethpandaops/tracoor](https://github.com/ethpandaops/tracoor)
- Ethereum trace explorer
- Can display a collection of traces and states of EL and Cl blocks/slots
- Helps debug network related issues
- [Traces of mainnet](https://tracoor.mainnet.ethpandaops.io)

### Dora

- Dora is a lightweight Beacon chain Explorer, extremely extendable.
- [Beaconchain](https://beaconcha.in) run Dora as a backup in case it has a problem.
- It gives you low-level access to the database, so much so that you can run Dora, and very often when we want to do some MEV-style analysis, we just run a SQL query against the Dora database and we get the information we want.
- It does have a builtin fork visualizer.
- It's very extendable, very useful.
- Example standard use: https://dora.holesky.ethpandaops.io

### Xatu

- Repo:
  - [ethpandaops/Xatu](https://github.com/ethpandaops/xatu)
  - [ethpandaops/analytics-pipeline](https://github.com/ethpandaops/analytics-pipeline)
- Ethereum p2p layer is hard to get visibility about
- Xatu data is then fed into an analysis pipeline to get data we care about
- The visualization is handled by Grafana, but the DB can directly be queried as well.
- Data is all open sourced:
  - [Open source xatu data](https://ethpandaops.io/posts/open-source-xatu-data)
  - [Data challenge: 4844](https://esp.ethereum.foundation/data-challenge-4844)

For more information, refer the repos or the testing-overview article above.

## Conclusion

The most important takeaways from this lecture is:
- ***How to run your local devnet and how to do a prototype!!!***
- ***Best way to learn how Ethereum works is to get involved in understanding & writing tests.***

#### Questions

*Ques.* Do ethpandaops use python specs tests at some point during the testing?

*Ans.* The way we've kind of defined or divided the territory so that we can both specialize a bit more easily is anything that you can expect to be tested on a single node, the Mario testing team, Python spec team, they handle it. Anything that is expected to be tested at the interop level, the Eth Panda Ops team tests. So that's ideally how we've defined them.

