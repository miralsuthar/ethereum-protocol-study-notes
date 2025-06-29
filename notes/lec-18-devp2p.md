# Lec-18: Devp2p by Felix Lange

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day18)

## Overview

This lecture is all about devp2p: EL nodes networking layer. All the ethereum execution nodes communicate each other via devp2p. Only via devp2p, execution nodes gossip transactions (and much more). The overview includes:

- Core concepts: Original Spec
- Network Topology goals
- RPX protocol (underlying transport)
- Ethereum wire protocol (ETH)
- Discovery protocol
- Why not libp2p
- UDP v/s TCP for p2p
- Discovery node validation/reputation
- Attack vectors
- Geth implementation
- Verkle Witnesses/Beam sync

## Sections Timestamp


| Topic                        | Time    |
| ---------------------------- | ------- |
| Introduction                 | 00:00   |
| Agenda                       | 1:05    |
| Overview of Devp2p           | 2:30    |
| Ethereum wire protocol (eth) | 6:05    |
| RLPx Transport Protocol      | 12:25   |
| Discovery Protocol           | 18:26   |
| Questions                    | 31:34   |
| Geth implementation          | 45:32   |
| Questions                    | 1:02:28 |


## Table of contents

<!-- mtoc-start -->

* [Devp2p: An introduction to networking layer to EL](#devp2p-an-introduction-to-networking-layer-to-el)
* [Ethereum Wire Protocol (eth)](#ethereum-wire-protocol-eth)
  * [Protocol Messages](#protocol-messages)
* [RLPx Protocol](#rlpx-protocol)
* [Discovery Protocol](#discovery-protocol)
  * [What led to the new version: Discv5](#what-led-to-the-new-version-discv5)
  * [Discv5](#discv5)
* [Questions: Part-1](#questions-part-1)
* [Geth implementation](#geth-implementation)
  * [`start`](#start)
  * [`eth/68 protocol`](#eth68-protocol)
  * [`runEthPeer`](#runethpeer)
    * [`Handshake`](#handshake)
    * [`Snap Protocol`](#snap-protocol)
* [Questions](#questions)

<!-- mtoc-end -->

## Devp2p: An introduction to networking layer to EL

The execution layer p2p networking i.e. devp2p specifications are in [ethereum/devp2p](https://github.com/ethereum/devp2p).

The first commit to devp2p was [GitHub - ethereum/devp2p at 5ffefe4e7233abc4b69e218274d57360f850331b](https://github.com/ethereum/devp2p/tree/5ffefe4e7233abc4b69e218274d57360f850331b).

The only focus of the p2p networking layer was to cater the execution layer. The two big main concepts that devp2p focussed on were:

1. *Node discovery*
2. *Subprotocol connections*

There are very few changes that have occurred in devp2p specs over the years. Even after 10 years, it still operates in the basic paradigm where we have *[node discovery](https://github.com/ethereum/devp2p/blob/master/discv5/discv5.md)* is a separate thing and the other protocol, traditionally called the *[wire protocol (eth)](https://github.com/ethereum/devp2p/blob/master/caps/eth.md)*, where nodes exchange blockchain information.

The main objective for devp2p, is to be mindful that nodes should have a uniform network topology i.e. the view of node-to-node doesn't change drastically. *Everyone should be able to join the network reliably, and it should be authenticated and encrypted.*

On top of [RLPx](https://github.com/ethereum/devp2p/blob/master/rlpx.md) TCP protocol, we have [Ethereum wire protocol (eth)](https://github.com/ethereum/devp2p/blob/master/caps/eth.md).

There are multiple protocols that run on top of RLPx. These protocols are called ***capabilities***. Following are the capabilities on devp2p as of now:

1. Ethereum wire protocol (eth)
2. Light Ethereum Subprotocol (les)
3. Parity Light Protocol (pip)
4. Ethereum Snapshot Protocol (snap)
5. Ethereum Witness Protocol (wit)

Only two of them are used nowadays: eth and snap protocols.

## Ethereum Wire Protocol (eth)

Since the Merge, the main two functions of eth protocol are *syncing blocks* and *exchanging current transactions*. Block production was also one of the functions performed but after the merge, libp2p is tasked to perform that function. This protocol is only used to synchronize existing blocks.

### Protocol Messages

>For connections between peers, we exchange ***messages***. See [Protocol Messages](https://github.com/ethereum/devp2p/blob/master/caps/eth.md#protocol-messages).

The most simple and straight forward message type is `Status (0x00)`. With status message, peers exchange information regarding their version, networkid, hash of genesis block, etc.

There are various other protocol messages that help:

- queue transactions
- get block headers
- get block bodies
- get pooled transactions
- get receipts.

And all the changes made to eth protocol are in the [change log](https://github.com/ethereum/devp2p/blob/master/caps/eth.md#change-log). It includes all the major changes that took place over the years along with their EIPs.

There is another update en route in the form of eth/69 with [EIP-7642](https://eips.ethereum.org/EIPS/eip-7642): [discussion](https://github.com/ethereum/EIPs/pull/8271).

## RLPx Protocol

RLPx protocol is a *middle layer protocol* that sits between TCP/IP protocol and eth sub-protocol (protocol messages used by node clients).

It's a protocol that attempts to establish an encrypted and authenticated connection between two peers. But it fails at the encryption end, and it hasn't been fixed yet because there is no fundamental need to encrypt Ethereum. The information isn't exchanged exactly in plain text, but if you know how to break the encryption (pretty easy, see [known issues](https://github.com/ethereum/devp2p/blob/master/rlpx.md#known-issues-in-the-current-version)), then the protocol is dysfunctional wrt privacy.

Although, authentication works as expected. Connection of a peer with other peers have to be maintained through its Peer-ID (impersonation is not possible). They do work but are strange.

❌ Encryption
⚠️ Authentication

The protocol works like the following:

1️⃣ When nodes connect, they do [initial handshake](https://github.com/ethereum/devp2p/tree/master/rlpx.md#initial-handshake). The initial handshake is to establish a TCP connection and to agree on ephemeral key material for encrypted and authenticated message communication.

2️⃣ There is also a framing layer, whose task is to propagate the single encrypted message to the relevant capability post initial handshake. Framing layer acts as a multiplexer for multiple capabilities over a single connection. Frames are encrypted and authenticated via key materials generated during initial handshake.

3️⃣ Following the initial handshake, all the messages exchanged are come under the umbrella of **"capabilities"**. Like discussed earlier, there are various capabilities, but the most basic one is *[p2p-capability](https://github.com/ethereum/devp2p/blob/master/rlpx.md#p2p-capability)*. The messages related to p2p capability are:

1. `Hello (0x00)`: When peers talk to each other for the very first time, they initiate the `Hello` message and the following information are exchanged:

  - `protocolVersion`
  - `clientId`
  - `capabilities`
  - `listenPort`
  - `nodeId`

2. `Disconnect (0x01)`: if peers disconnect, then this message is triggered. The most common reason to disconnection is *0x04: too many peers*.

3. `Ping (0x02)`

4. `Pong (0x03)`

4️⃣ All the messages exchanged via framing layer, the multiplexing to various capabilities purely relies on the `message ID`. All the messages exchanged between the sub-protocol has a RLPx message ID (starts from $\text{0x10}$ for sub-protocols. $\text{0x00-0x0f}$ is reserved for "p2p capabilities").

To understand more clearly, Ethereum wire protocol (eth), `request-id` for `Status: 0x00`. This $\text{0x00}$ is then RLP encoded to generate a `msg-id` that has been to $>\text{0x10}$.

At startup, when the connection starts and hello messages are exchanged;

- Both peers compute a message ID table.
- They associate each received message with a capability.

Read [capability messaging](https://github.com/ethereum/devp2p/blob/master/rlpx.md#capability-messaging) for more info.

## Discovery Protocol

There are two versions of discovery protocol:

- `discv4` (original discovery protocol; created before Ethereum launch)
- `discv5`

Discovery protocol is a *UDP-based protocol*. Nodes open a second port with UDP where they form a dynamic distributed hash table maintaining the data with references to other nodes.

The primary function is querying the network for peers. Using this protocol, you can walk the data structure, ask nodes about other nodes they know. When nodes are returned, you can attempt connection using RLPx.

Kademlia distributed hash table is used to store nodes and their information (to which they are directly connected to). Usually KDHT stores both keys and values, but in discv4, we only store keys and not values.

There were initially 4 (later 6) discovery messages in discv4:

1. `Ping Packet (0x01)`
2. `Pong Packet (0x02)`
3. `Neighbors Packet (0x04)`
4. `ENRRequest Packet (0x05)` (added in EIP-868)
5. `ENRResponse Packet (0x06)` (added in EIP-868)

There are very few revisions to the discv4 protocol since its release. The revisions were [EIP-8](https://eips.ethereum.org/EIPS/eip-8), [EIP-868](https://eips.ethereum.org/EIPS/eip-868) and [EIP-2124](https://eips.ethereum.org/EIPS/eip-2124)

- **EIP-8**: add a version to every packet to upgrade the protocol. The initial version lacked a version number, preventing proper upgrades.
- **EIP-868**: Add ENR (Ethereum Node Requests) requests and response packets. It also modifies ping and pong to include local ENR sequence number.
- **EIP-2124**: Add fork identifier, for faster discovery of relevant and honest nodes.

***Purpose to use Kademlia***

Ethereum doesn't use Kademlia DHT with all the functionalities it provides. The reason behind it is: Each node stores a fixed amount of information, yet the network is scalable. So, it is rather meaningful to keep the system simple and easy to understand. A single node only has to store about *150 other nodes*, no matter how huge the network is.

### What led to the new version: Discv5

There was an issue with v4: *dependency on the clock time*. This was a known issue, but was overlooked due to its high complexity.

>In discv4, there is an expiration field (packet data) — Unix timestamp indicating the message validity. Nodes send messages in about 5 seconds expiry in future. The node clock has to be within the expiration time for it to be synced.

The main problem caused: ***This led to nodes finding no other nodes.***

Main issues causing these problems were:

- There were countless connectivity issues related to node's clock being wrong. Many workarounds were tried to resolve this issue. Adding code to detect NTP configuration was one of them. There is a band-aid fix that performs NTP query if there are enough network timeouts to detect out of sync nodes. But it was very messy. Discv5 solves this.
- Packets shared among nodes must be sent in specific, defined order. But, in discv4, this was not the case. There was no clear state machine.

The protocol design lacked quality to solve these issues.

### Discv5

The version 5 has the following benefits and upgrades over version 4:

1. has no clock dependency
2. is encrypted
3. is authenticated.
4. is not 100% dependent on `secp256k1`, hence upgrading to other crypto systems will be easier.
5. introduces relaying arbitrary metadata between nodes using Ethereum node records (ENR). This means that we can relay more information than just IP and port—network ID, genesis information, and protocol-specific information (like Snap support).
6. introduces a new feature i.e. [topic advertisement](https://github.com/ethereum/devp2p/blob/master/discv5/discv5-theory.md#topic-advertisement). It is still a WIP regarding the implementation. The mechanism is hardest to get right. Right now, topic advertisement is more of a goal than a reality.

Overall, Discv5 is now used by both consensus and execution layer for node discovery. There are few client teams that have adopted discv5 like geth and Erigon while some still use discv4 like Nethermind and Besu. As soon as the rest of the client teams adopt discv5, discv4 will be deprecated.


## Questions: Part-1

*Ques.* How were you able to solve clock time dependency with discv5?

*Ans.* The basic idea is that Discovery version 4 used the clock for replay protection. Someone could keep sending the same packet, which is annoying (Denial-of-Service attacks or an attempt to break the protocol) because packets are signed and authenticated.

Discovery version 5 is properly encrypted and authenticated; each node has a dedicated session. Messages can't be repeated because they use nonces and are encrypted using AES-GCM. You can exchange the same packet, but the sessions are kept by IP and port, so it won't find the session.

---

*Ques.* Why not use libp2p over devp2p?

*Ans.* Refer [relationship with libp2p](https://github.com/ethereum/devp2p/tree/master/README.md#relationship-with-libp2p). This protocol is older than LibP2P. We could change the execution layer to use LibP2P, but there's no need; it works well. It's a custom protocol, so we'd have to port wire protocols. We could port those capabilities to libp2p, but we haven't seen the need and could be a great future endeavour.

---

*Ques.* Why use UDP protocol for discv5 over TCP protocol?

*Ans.* Discovery uses UDP because it requires talking to many nodes with low latency. To use discovery, you walk the network, talking to many hosts quickly. UDP has less overhead per connection than TCP. TCP has more overhead than UDP for a single connection because every connection establishment has to be made to each node that takes time.

For the main P2P protocol and RPC, we use TCP because it's better for long-lived connections and regulates traffic when lots of data is sent.

---

*Ques.* In discv5, is there any node validation process before establishing the connection?

*Ans.* There's some validation, but the protocol is about open participation, so we *can't make assumptions* about nodes.

The major validation factor is requirement of an ***active endpoint*** responding on the Discovery protocol to be considered for announcement. Node records won't pass on until are correctly validated.

Discv5 does not verify if the peer is a participant of Ethereum mainnet or any other network. It is up to the peers to verify as there's not many incentives to lie at this point. There is no built-in reputation system; because they could be harmful during network faults.

---

*Ques.* What do you think are the attack vectors in the current implementation? How do the network handles lags, delays, disconnections and malicious nodes?

*Ans.* All protocols in Ethereum are designed
under the assumption that the remote party is always going to be malicious.

The most common attack is the transaction exchange mechanism. Within the Ethereum wire protocol, transaction pool (mempools) are used for exchanging transactions.

The transaction exchange is a very simple process (but is a deception in reality). The spec says if you have some transactions, you're supposed to send this message, and then the other side is supposed to give you the transactions. It is a primitive to exchange those transactions.

The major problem lies in the implementation. Nodes have a very complicated data structure when it comes to transactions. Each node implementation has to maintain a pretty complicated data structure to make this work. There are rules and conditions for transactions are acceptable at time and how they are supposed to move through in this data structure. These rules are not spelled out in the spec, but it's kind of implementation-defined.

We have seen a lot of attacks, especially in geth because it is the most popular implementation. Academic papers also have shared insights on the security of this mechanism. People found specific issues in our data structure implementation that enabled them to publish a lot of transactions at once or remove other people's transactions in favour of theirs. To this day, we are still receiving reports from the Ethereum Foundation of attacks within the system. On the basic layer, though, there are not really a lot of attacks that we have seen or known about. It seems to mostly be working.


## Geth implementation

**Reference**: [ethereum/go-ethereum/p2p](https://github.com/ethereum/go-ethereum/tree/master/p2p) and its docs [p2p package - Go Packages](https://pkg.go.dev/github.com/ethereum/go-ethereum/p2p).

The fundamental entry point in the system is the [Server](https://pkg.go.dev/github.com/ethereum/go-ethereum/p2p#Server) type. The P2P server in Go Ethereum manages both the *TCP connections*, and it also *launches and configures the Discovery system*.

All the server options for configurations are in [Config](https://pkg.go.dev/github.com/ethereum/go-ethereum/p2p#Config) type. For example,

- Secp256k1 `PrivateKey` is used to establish all the key material and further establishes the identity of the node on the network.
- During the configuration, the user can set the `maxPeers` (default is 50, max 100 is recommended). Even if you specify tens of thousands of peers, it's pretty rare that you will actually get that many peers (as other peers won't like to connect with every other peer in the network). It's just going to be very costly in terms of resources to serve all of them. And there are a bunch of other settings.
- Another very important feature, is the ***dial-ratio***. `dialRatio` controls the ==ratio of inbound to dialled connections==. The threshold for a peer to connect to other peers is one-third (default). Once the threshold is reached, then rest of the two-third peer nodes can connect to you but the vice versa will break the threshold hence connection will not be established.
- There are also config options to enable `DiscoveryV4` or `DiscoveryV5` for node discovery (Default is true).
- `BootstrapNodes` and `BootstrapNodesV5` help configure the initial nodes that the discovery system uses to connect to the network.
- `StaticNodes` and `TrustedNodes` help you connect to certain peers that you list within the configuration.
- `NetRestrict` helps restrict certain IP ranges (helpful during tests).
- `Protocols` contains the list of protocols supported by the server. In this case, there will be an instance of this object for each protocol that geth supports, notably the *eth/68 protocol* and the *snap protocol*. When *eth/69* gets introduced both version will be supported for a while.

Now each [`Protocol`](https://pkg.go.dev/github.com/ethereum/go-ethereum/p2p#Protocol) has a run function which gets invoked by each peer, and it receives the messaging stream as an argument. Based on this stream, it can *start exchanging messages* with the other peers; it can *read and write messages*. This is the heart of the communications that occurs between the peers through the protocol.

The basic flow of how a peer (server) starts is:

### `start`

The entry point is to create a `Server` (`go-ethereum/p2p/Server.go`) instance that has [`start`](https://pkg.go.dev/github.com/ethereum/go-ethereum/p2p#Server.Start) method. This method handles:

1. set up the node
2. set up the discovery system
3. set up the dial ratio
4. finally launch the server run loop that manages all the peers.

Now, communication between the peers happen across protocols (eth/68 and snap), hence are somewhat decoupled from the p2p system.

### `eth/68 protocol`

Eth/68 wire protocol resides at `go-ethereum/eth/backend.go`. It's the main file really of Go Ethereum.

`backend.go` has a function `Protocols` which invokes all the configured protocols i.e. eth/68 and snap. Both of these protocols reside in `protocols` package.

- Refer `MakeProtocols` in `eth/protocols/eth/handler.go` to understand eth/68 wire protocol
- Refer `MakeProtocols` in`eth/protocols/snap/handler.go` to understand snap protocol

### `runEthPeer`

Also, there is another function `runPeer` in `eth/protocols/eth/handler.go` that defers to `runEthPeer` method in `eth/handler.go`. It registers every connection after the initial handshake between the two peers has passed and they start communicating.

`runEthPeer` method only runs when the following has already been done by the node:

- the peer was discovered
- it has connected to the local node as an inbound connection
- it is running the eth protocol at the compatible version
- If peer is also running the snap protocol for node synchronization, it requires eth protocol to properly function as well.

#### `Handshake`

the [Handshake](https://pkg.go.dev/github.com/ethereum/go-ethereum@v1.15.11/eth/protocols/eth#Peer.Handshake) function is called in the `runEthPeer` method,

```go
if err := peer.Handshake(h.networkID, hash, genesis.Hash(), forkID, h.forkFilter); err != nil {
	peer.Log().Debug("Ethereum handshake failed", "err", err)
	return err
}
```

In the handshake function, we send the eth/68 status (0x00) message to the peer we are making the handshake with,

```go
p2p.Send(p.rw, StatusMsg, &StatusPacket{
	ProtocolVersion: uint32(p.version),
	NetworkID:       network,
	TD:              new(big.Int), // unknown for post-merge tail=pruned networks
	Head:            head,
	Genesis:         genesis,
	ForkID:          forkID,
})
```

And we read the handshake status message he sends us,

```go
p.readStatus(network, &status, genesis, forkFilter)
```

And then we will also wait for them to actually provide the status back to us. This is `handshakeTimeout`. It is to be assured that if they do not manage to send their own handshake within 5 seconds, and we know that this is an invalid connection, and we will just *disconnect it* with a [disconnect reason](http://github.com/ethereum/devp2p/blob/master/rlpx.md#disconnect-0x01).

```go
return p2p.DiscReadTimeout
```

`readStatus` above reads the message received during the remote handshake. It takes care of all the checks that are to be checked:

1. `statusMsg == 0x00`
2. `msg.Size > maxMessageSize`; where $maxMessageSize =10 * 1024 * 1024$
3. successful handshake message decoding (RLP encoded message)
4. Check for the same `NetworkID`, `ProtocolVersion`, `Genesis`, `ForkID`

If any of the checks fail then the status returns with an `fmt.Error`.

#### `Snap Protocol`

Once, all these checks happen and the handshake is successful, we move forward in the `runEthPeer` function, if snap is enabled, we try to snap sync the protocol.

There are checks for if the node has reached max peers. If reached then disconnect with the peer for reason: too many peers. Trusted peers are an exception to this.

All the peers who gets connected (i.e. successful initial handshake) are registered locally (on the geth node) as well as with the downloader.

Hence starts the journey of synchronization of transactions with `syncTransactions` in `eth/sync.go`.

In `syncTransactions`, `AsyncSendPooledTransactionHashes` queues a list of transactions hashes to eventually announce to a remote peer to `txAnnounce` channel.

## Questions

*Ques.* With Verkle integration, will there be many changes to either eth protocol or snap protocol?

*Ans.* With Verkle integration, most likely the changes are going to be in the snap protocol because in the p2p client communication, there is no difference between the three trie (state trie, txn trie, receipts trie). The communication between the nodes are simple and straightforward. The snap protocol might need some changes as it has a distinction between storage trees and account trees but there is only one trie in Verkle for all the purposes.

>**Witness Protocol (wit)**
>
>Witness protocol was an early attempt for another synchronization strategy to run a synched chain and a stateless alternative. The initiative was called to be as beam sync.
>- More on this in the article: [Medium](https://medium.com/@jason.carver/intro-to-beam-sync-a0fd168be14a)

---

*Ques.* What could be the potential improvements to the discv5?

*Ans.* There are more changes in the upcoming update in [discv5: protocol v5.2](https://github.com/ethereum/devp2p/issues/226).

- [discv5: NAT hole punching wire protocol by emhane](https://github.com/ethereum/devp2p/pull/225): a restrictive Network environment that has a a net, then we still want other nodes to be able to connect to you, which can be achieved by hole punching.
- In order to help Portal network, try to explore some alternative mechanism with capabilities to help them transfer large amount of data (historical blocks).

---

*Ques.* Is there a chance where portal replaces devp2p?

*Ans.* Its a different system and an alternative to store historical data or could be considered as a long term storage for Ethereum. There are going to many other ways the data will be stored.
