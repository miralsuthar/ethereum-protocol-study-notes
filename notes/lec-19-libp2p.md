# Lec-19: Libp2p by Dapplion

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day19)

## Overview

This lecture is all about libp2p: networking layer for beacon nodes. Only through libp2p, beacon nodes (consensus layer) can gossip beacon blocks (and much more). The overview includes:

- Lip2p overview
- MPLEX
- gossipsub
- Peer scoring
- IDONTWANT message

## Sections Timestamp


| Topic                        | Time    |
| ---------------------------- | ------- |
| Introduction                 | 0:00    |
| Libp2p Overview              | 1:55    |
| Questions                    | 11:50   |
| Connection Lifecycle         | 16:00   |
| MPLEX                        | 18:37   |
| Gossipsub                    | 20:51   |
| Questions                    | 26:35   |
| Gossipsub v1.0               | 35:14   |
| Questions                    | 43:25   |
| Gossipsub v1.1: peer scoring | 56:15   |
| Questions                    | 1:03:32 |
| Gossipsub v1.2               | 1:10:10 |
| Questions                    | 1:14:06 |
| Req/Resp Domain              | 1:16:30 |
| Questions                    | 1:19:08 |


## Table of contents

<!-- mtoc-start -->

* [libp2p v/s devp2p](#libp2p-vs-devp2p)
* [Overview of Libp2p](#overview-of-libp2p)
* [Questions: Part-1](#questions-part-1)
* [MPLEX](#mplex)
* [Gossipsub](#gossipsub)
* [Questions: Part-2](#questions-part-2)
* [Gossipsub v1.0](#gossipsub-v10)
  * [Ambient Peer Discovery](#ambient-peer-discovery)
  * [Parameters](#parameters)
  * [Topics](#topics)
  * [Questions](#questions)
* [Gossipsub v1.1](#gossipsub-v11)
  * [Per-Topic](#per-topic)
  * [Globally applicable](#globally-applicable)
* [Questions: Part-3](#questions-part-3)
* [Gossipsub v1.2](#gossipsub-v12)
* [Questions: Part-4](#questions-part-4)
* [Req/Resp Domain](#reqresp-domain)
* [Questions: Part-5](#questions-part-5)

<!-- mtoc-end -->

## libp2p v/s devp2p

Libp2p is like a competitor to Devp2p because both have relatively similar structure. Both are used because, *fulfil the same need of moving data from peers to others reliably that scales and is resilient to attacks*.

Both were started in the same hackathon in the same year, but they diverged slightly in their approach. Libp2p turned out to be more mature and comprehensive approach.

Due to this reason, it got adopted for the Ethereum beacon chain.

## Overview of Libp2p

![libp2p overview](/assets/lec-19/libp2p-overview.svg)

**Transport**: Basic host-to-host communication. In simple words, two peers moving data (bytes) from one side to another.

In order to transport data, we need a *Transport Protocol*.

***1️⃣ TCP***

In Ethereum, the block propagation (transport) is done using ==TCP==. But, the connection is not secure because the TCP channel is unencrypted (transfers plain text hence not ideal). To counter man-in-the-middle attacks, we require an **encrypted handshake** between the two peers to guarantee secure transfer of data.

>In this layer, we get to know about the IPs of a peer (to start the TCP connection).

***2️⃣ Noise***

For an encrypted transport, there are various protocols that libp2p supports.

In Ethereum, the choice is to use ==Noise==. Noise protocol responsible for the job of handshake between the peers.

>In this layer, we get to know the public key from cryptographic primitives (Diffie-Hellman key exchange) and hence upgrade the connection to a symmetric encryption channel.

***3️⃣ MPLEX / YAMUX***

In order to have the liberty to have multiple protocols work in tandem. There are various other protocols required to facilitate various functionalities: gossipsub, sync nodes, ping peers, etc.

For this, we need a *multi-stream protocol* on top of TCP and Noise, so that we have different streams of data in the same channel.

Because although, TCP connections are not expensive but using it for every protocol is quite costly as the handshake for every new connection needs a significant amount of overhead.

Hence, one TCP connection between each p2p and in order to propagate other protocol data streams, **MPLX / YAMUX** is used.

***4️⃣ GOSSIPSUB***

Now, the raw transport is encrypted and multiplexed. Hence, is now ready for user application streams.

For block propagation, we use ==gossipsub protocol==.

Gossipsub is pubsub (publish/subscribe) protocol that allows peers to propagate arbitrary messages.

The simple flow of message is:

1. The peer client will `gossip.publish` the message.
2. Reuse the existing TCP connection
3. Find the corresponding stream to gossipsub
4. Push the message and send it across to other peers connected through the TCP.

***5️⃣ BeaconBlocksByRangeV2***

We can also add a new sub-stream, different to gossipsub i.e. [`BeaconBlocksByRange`](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#beaconblocksbyrange-v1) to get blocks within a certain slot range provided in the request content.

```go
type Request {
  start_slot: Slot
  count: uint64
  step: uint64 // deprecated, defaults to 1
}
```

The above whole cycle from `TCP` to `BeaconBlockByRangeV2` is known as ***Connection Lifecycle***. For more detailed information, refer [Connections](https://github.com/libp2p/specs/tree/master/connections/README.md).

## Questions: Part-1

*Ques.* Why specifically are we using Noise over TLS 1.3 for Ethereum?

*Ans.* [Why are we using Noise?](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#why-are-we-using-noise)

---

*Ques.* Can Noise be replaced with discv5 for node discovery?

*Ans.* It's actually an almost independent protocol because, from the point of view of libp2p, peer discovery happens somewhere else.

![disv5-and-udp](/assets/lec-19/disv5-and-udp.png)


## MPLEX

Mplex is a stream multiplexer protocol. It's important for wrapping the messages (with whatever data we want to send) i.e. demultiplexing with some header that we can attach to a specific sub-stream at the other end i.e. multiplexing.

Following is the flow of a sub-stream message sent through a MPLEX:

1. Add an ID in the headers of the message you want to send.
2. create a new stream.
3. send the message.
4. close the stream (makes it one-direction i.e. only the sender can send, but the receiver cannot send anything back if the stream is closed).
5. reset the stream (close the stream from both the sides).

>The annoying part of implementing a mplex is that it is a minefield for memory bugs. Hence, the best practise is to copy as little as possible because a lot of data gets exchanged.

## Gossipsub

A lot of research is in the works related to peerDAS and this upgrade also improves gossipsub 2.0.

Gossipsub is a **pubsub** (Publish/Subscribe) protocol. It is a protocol where the relevant event data is pushed to peers who subscribed to that event.

Let's assume there are 6 peers in a network. $Peer_1$ is the original publisher of the message.

![gossipsub](/assets/lec-19/gossipsub.png)

Now the aim is to propagate the message to all the other peers in the network and the best possible way to do that fast is *spam*.

Imagine $Peer_1$ sending the message to $Peer_2$ and $Peer_3$. Then $Peer_2$ and $Peer_3$ sending the message to $Peer_4$ and $Peer_5$ respectively and so on.

Imagine the same for 100 nodes. The same message would propagate between 99 other nodes.

The message although reached to the all the peers but created chaos in the process. This is called **amplification factor**.

The network bandwidth required to such type of pubsub is astronomical. So if Ethereum targets an amplification factor of 100, then the massive $32 MB$ blocks would require massive amount of bandwidth, hence would be infeasible for home nodes.

>**Amplification factor:** one of the key things that gossip tries to *limit*.

*Solution:* Create a **mesh** of peers in a small subset. Now the message pushed by a peer will only propagate within this mesh exclusively.

>From the above example, we create a mesh of $Peer_1$ to $Peer_5$. Since, $Peer_1$ is the publisher and the message propagated eventually to all the peers except $Peer_6$ because it is not in the mesh.
>
>Now, if $Peer_6$ wants the message that $Peer_1$ shared then $Peer_6$ has to request for the message separately from either of the 5 peers.

The amplification factor (`D`) for ethereum is $8$. For more information regarding the parameters of gossipsub, refer:

- [ethereum/consensus-specs: ethereum gossipsub parameters](https://github.com/ethereum/consensus-specs/tree/master/specs/phase-0/p2p-interface.md#the-gossip-domain-gossipsub)
- [libp2p/specs: default gossipsub parameters](https://github.com/libp2p/specs/blob/master/pubsub/gossipsub/gossipsub-v1.0.md#parameters)

This means that a peer has a job to propagate $D=8$ no. of peers, and they will propagate to their list of 8 peers and so on. This is *exponential*. Within a few hops, everybody in the network gets the message and can gossip if they have it or not (if not then request it).

In security terms, this protocol is phenomenal and can still propagate the whole network within seconds even if $80-90\%$ of the nodes are adversarial.


## Questions: Part-2

*Ques.* How the discovery of nodes happen with the discv5? Does it happen at a layer to know about peers?

*Ans.* In practice, most consensus clients discover almost every peer they have through discv5, but some consensus clients have other modes to discovery.

Discv5 works with a Kademlia DHT. You query peers randomly and try to walk the table and discover as many peers as per need. So it's possible you could end up walking the whole table and discover all the peers; it's wasteful.

If you start from a [boot node](https://hackmd.io/@poma/bootnodes), you would query some random set of peers, and then if you need more, then you just keep going. Once, you reach 100 peers, usually you stop doing this discovery until you need more peers for some reason.

---

*Ques.* There are two multiplexing protocols, but like why have two? We can just have one so that we can also reduce one handshake asking which protocol to use, right?

*Ans.* MPLEX is a custom protocol developed by libp2p themselves, but it has a fundamental issue where it cannot handle back pressure.

Back pressure is when the peer just keeps sending messages but the receiving peer due to some reason does not receive the packets. The messages that are to be sent awaits for the peer TCP connection again, hence messages are added in a queue.

In the case of MPLEX, there is no way to communicate back pressure back to the sender. So it will just backlog the underlying transport itself. In the consequence, all other protocols will get blocked, which is bad.

YAMUX don't have the back pressure problem. The solution is through window updates. The sender sends the message and the receiver then give a further allowance to the sender to send extra data (assuming within 1 MB). Now, the sender can only send further data when is returned with a request for more data (in terms of allowance).

But, YAMUX is very complex, so during initial implementation, I think MPLEX was the preferred option because it's very simple to implement. Some clients do use YAMUX over MPLEX hence the need to support both protocols.

## Gossipsub v1.0

[gossipsub v1.0 spec](https://github.com/libp2p/spec/tree/master/pubsub/gossipsub/gossipsub-v1.0.md)

Like discussed above, gossipsub is pubsub protocol, it has a dual architecture:

1. every peer is connected to each other is some way. Peers are subdivided into meshes so that it's easier to propagate messages in a few hops with the help of amplification factor.
2. Eventually all the peers receive the message and then gossip; "I want" or "I have". "I want" peers can request a message they didn't receive with other peers (out of their mesh).

### Ambient Peer Discovery

Ethereum use discv5 to get ambient peers to know of each other's existence.

### Parameters

Out of all the parameters, the most important one is $D=8$ (in case of Beacon chain).

>For PeerDAS, gossipsub is heavily used for sampling. Hence to affirm the safety of the block, the amount of data that is to downloaded has to be multiplied by $D=8$.

### Topics

Gossipsub is a substream or one of the many protocols within Libp2p. Likewise, gossipsub has different topics. Various peers subscribe to get messages related to that topic.

More info regarding Ethereum gossipsub topics, read [global topics](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#global-topics).

There are two primary global topics which all the nodes must be subscribed to:

1. `beacon_block`
2. `beacon_aggregate_and_proof`

>*Each topic has its own **message type**, **validation rules** and **distinct mesh** (i.e. each topic will have different mesh of peers).*

A mesh link is bidirectional in nature.

There are **validation rules** per message that are to be followed for a message to be valid. Validation rules are to checked per message before forwarding it. There are three types of validation results:

1. `ACCEPT`: all validations pass, then accept the message and send it.
2. `REJECT`: we throw the message and penalize the peer for malicious or inappropriately sent message.
3. `IGNORE`: If validation rules broken that come under the category of `IGNORE` then we dump the message but do not penalize the peer ($P_4$, refer Gossipsub-v1.1).

### Questions

*Ques.* What happens when we lose a mesh peer? Does it like connect to a new one automatically?

*Ans.* A relatively simpler explanation is, you check your peer set, you see which peers in my peer set have good scores and are subscribed to the blocks topic. Then you would randomly choose one and send them a graft.

---

*Ques.* Is it optional to subscribe to some topics and some not, or is it compulsory to subscribe to every topic?

*Ans.* Refer [global topics](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#global-topics).

When you do bad things, you get a bad score. When you do useful things like giving us new messages or giving us valid messages, your mesh score goes up. So if you don't subscribe to anything at all, then your mesh score is zero.

There are some topics that are required by the protocol for the peers to subscribe and to be a useful peer as well. Nobody in the mesh of peers want a useless peer who have not subscribed to any topics. Hence, in order to keep a healthy score and a healthy node, subscribing to the necessary topics is a minimum requirement.

---

*Ques.* Is there a latency during the attestation propagation phase that is to be done within 4-12 sec of a slot i.e. 8 seconds? If there is, are there any plans to mitigate this in the future?

*Ans.* There is no one single attestation topic because that would be a lot of messages to be gossiped in a single channel. To mitigate this, we have 64 channels where attestations are gossiped. Hence, each slot has 3.125% of validators making attestations. Hence assuming a million validators, $$\begin{gathered}V_{slot1} = 31,250\\A_{per-slot-per-channel} = 31,250 / 64 ∼ 488\end{gathered}$$
These 488 attestations are then passed through a mesh in a given channel into a type of node that is called an **aggregator**. The aggregator aggregates the attestations (BLS signatures can be aggregated and still accomodate the property of each validator attestation, read [BLS signature aggregation](https://muens.io/bls-signature-aggregation/)) and aggregated attestation is the one that is actually propagated in a global topic i.e. [`beacon_aggregate_and_proof`](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#beacon_aggregate_and_proof).

So, with this method, there is 64 times less traffic than the $∑all\_attestation\_topics$. This scales really well and due to this attestations aren't the real bottleneck. The real issue is with the block propagation. The block should be gossiped within 1-4 sec of a slot time and should be reach to all the peers who are ready to attest a valid block. But due to MEV and other timing games, this problem is difficult to solve.

---

*Ques.* What if a peer is unable to propagate the message in a heartbeat? Do we assume that the peer dropped off and stop sending new messages?

*Ans.* The heartbeat function shouldn't be failable. A heartbeat is a loop on a thread where you just wait until the next tick of 0.7 seconds and then run the heartbeat function.

Suppose, on a heartbeat you decide to send an `IHAVE` message, that goes into a queue. It doesn't interfere with the heartbeat function itself. You just queue it for later because we do something that's called *piggybacking*. We don't want to waste one message just to send a control message (`IHAVE`, `IWANT`, `GRAFT`, `PRUNE`). So when we send an actual message with data to the peer, we attach the control messages to it as well (piggyback). The only thing that could fail is the delivery of the message itself because the queue is backed up.

Read more about [piggybacking](https://github.com/libp2p/spec/tree/master/pubsub/gossipsub/gossipsub-v1.0.md#control-message-piggybacking).

>Reason behind choosing heartbeat = 0.7 sec is in [Gossipsub-v1.1 Evaluation Report by Protocol Labs](https://ipfs.io/ipfs/QmRAFP5DBnvNjdYSbWhEhVRJJDFCLpPyvew5GwCCB4VxM4): Page 7 - Recommendations.


## Gossipsub v1.1

There has to be a metric to rate a peer based on the contributions made. So, we need a peer scoring system and v1.1 introduces it.

[Scoring system](https://github.com/lib2p/spec/tree/master/pubsub/gossipsub/gossipsub-v1.1.md#the-score-function) is *weighted mix of parameters $P_1, …, P_7$* where 4 are per topic and 3 are related to globally applicable.

### Per-Topic

→ $P_1$ *(Time in Mesh for a topic)*: How long the other peers in the mesh hasn't attempted to prune you? The more the merrier.

→ $P_2$ *(First message deliveries for a topic)*: Reward the peer who sends a particular message first among the others in the mesh. We want to reward people that create messages, not the ones that just forward them.

→ $P_3$ *(Mesh Message Delivery Rate)*: Penalize peers who are not able to deliver message above the threshold. The peers who are above the threshold have value 0. And the peers who are below the threshold have P3 value is square of the deficit. It is to penalize and incentivize peers to deliver message at a consistent above threshold rate.

→ $P_{3}b$ *(Mesh Message Delivery Failures)*: Sticky parameter that counts the number of mesh message delivery failures. Intended to keep history of prunes so that *a pruned peer doesn't get regrafted immediately*.

→ $P_4$ *(Invalid Messages)*: If a peer sends an invalid messages then would be penalize the same number of times the invalid messages were sent.

### Globally applicable

→ $P_5$ *(Application specific)*: Not used in ethereum.

→ $P_6$ *(IP Colocation Factor)*: Threshold for the number of peers using the same IP address. Intended to counter sybil attacks.

→ $P_7$ *(Behavioural Penalty)*: Penalty related to misbehaviour. Don't do after promised to fulfil something (For example, you tell other peers in the mesh `IHAVE`, then a peer in the mesh requests with `IWANT`, and you don't send the message within 5 seconds then its $P_7$ penalty).

## Questions: Part-3

*Ques.* Where is the score stored?

*Ans.* Clients store the score locally in a hashmap. Basically, everyone is keeping a view of everyone else

---

*Ques.* Are there any provisions for those clients like who are offline or who are timed out of the network (unable to fulfil the `IWANT` requests?

*Ans.* It is okay to get down scored if a peer is honest for majority time then the peer will still be able to graft with other peers.

So it doesn't matter if the peer is not doing the duties that you expect from it; you have to kick it out.

---

*Ques.* If the score is stored locally, how can we kick off the mesh just from the local?

*Ans.* When you kickstart the mesh, you just basically select a random peer and then it will eventually converge into the most stable reliable peers eventually.

## Gossipsub v1.2

The *message size of attestations* is relatively *very small* ($<1KB$) than other messages.

`BeaconBlock` size before the merge was $30KB$. But post merge, with inclusion of transactions, now $∼100KB$.

For min-max size of different SSZ containers: [Eth2 Annotated Spec](https://benjaminion.xyz/eth2-annotated-spec/phase0/beacon-chain/) and [Eth2 type bounds v0.12 · GitHub](https://gist.github.com/protolambda/db75c7faa1e94f2464787a480e5d613e). It might be outdated.

So there are scenarios when downloading 100KB messages takes time. A problem this might cause is:

>Suppose, there exists 3 peers in a mesh, $P_1$ (publisher), $P_2$ and $P_3$ (target). $P_1$ and $P_3$ are home nodes while $P_2$ is hosted at a datacenter.
>
>Now, the goal is to send the message to $P_3$ only once by either $P_1$ or $P_2$.
>
>$P_1$ sends the message to both $P_2$ and $P_3$. $P_2$ being a datacenter node, downloads the message at an instant $<100ms$ but the target has a bad bandwidth speed so it takes time ($∼0.5s$) for the message to reach from $P_1 → P_3$.
>
>As the message have not reached the target yet. So $P_2 → P_3$ the same message. Now $P_3$ receives the message first by $P_1$ and then $P_2$, hence downloading the same redundant message twice.

Solution: [`IDONTWANT` Message](https://github.com/libp2p/spec/tree/master/pubsub/gossipsub/gossipsub-v1.2.md#idontwant-message)

Whenever a peer receives the first message, then it can tell everyone else with a very short message that it no more want the message request with `IDONTWANT`.

The results are bit disappointing and are not much affective in terms of saving bandwidth and storage.

## Questions: Part-4

*Ques.* How clients coordinate among different gossipsub versions? How do they upgrade? And is 1.2 already in use?

*Ans.* Gossipsub is essential to all clients. So, as soon as the the MPLEX startups, the client tries to open a gossipsub connection.

With `multi-stream select` protocol. The client has a choice to select the version of gossipsub they are compatible with. For example, if two clients are compatible with both v1.2 and v1.1, then they use v1.2. And if a client is compatible with v1.1 and another is with both v1.2 and v1.1, then v1.1 is used. *Highest common version is used*.


## Req/Resp Domain

Reference link: [The Req/Request Domain](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#the-reqresp-domain)

Req/Resp Domain like the name suggests, a peer requests data in the form of packets and receives response data.

Along with gossipsub being a sub-stream level protocol. There are other custom Ethereum protocols, that uses Req/Res Domain.

The [messages](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#messages) list are as follows:

- `/eth2/beacon_chain/req/status/1/`
- `/eth2/beacon_chain/req/goodbye/1/`
- `/eth2/beacon_chain/req/beacon_blocks_by_range/1/`
- `/eth2/beacon_chain/req/beacon_blocks_by_root/1/`
- `/eth2/beacon_chain/req/ping/1/`
- `/eth2/beacon_chain/req/metadata/1/`

## Questions: Part-5

*Ques.* What are the topics that are not covered in this lecture?

*Ans.* Following are the topics worth exploring that were not covered:
- [Discv5 protocol in libp2p](https://github.com/ethereum/consensus-specs/tree/master/specs/phase0/p2p-interface.md#the-discovery-domain-discv5)
- [Gossipsub-v1.1 Evaluation Report by Protocol Labs](https://ipfs.io/ipfs/QmRAFP5DBnvNjdYSbWhEhVRJJDFCLpPyvew5GwCCB4VxM4)

---

*Ques.* When using Req/Resp, does the peer send requests to all the mesh peers or maybe the high-score peer or how it works?

*Ans.* It's up to the implementation. In lighthouse, we first try to figure out who has the blocks that we want depending on the type of sync, like lookup sync or any other sync, and then we prefer peers that have the least connections possible to load balance, and then it's random. High score peer req/resp could be gamed and could be prone to malicious activity.

>You don't want to always ask the same peers. You want to have more random distribution of who gives you information.

---

*Ques.* Is the subnet created for each block or there are multiple subnets for each block?

*Ans.* The attestation subnets are long-lasting. Building a mesh of peers takes a lot of time (order of minutes). Hence, the focus is towards building a long-lasting mesh of peers.

Messages in the mesh are usually forwarded. There are two strategies:

1. Flood published ([floodsub](https://github.com/libp2p/spec/tree/master/pubsub/gossipsub/gossipsub-v1.0.md#in-the-beginning-was-floodsub)): pre-protodanksharding i.e. introduction of blobs
2. Publish to selected peers in mesh or topic peers.

---

*Ques.* Why are publishing to blobs more expensive than blocks in terms of topic messages?

*Ans.* One blob consumes $∼131KB$. And now at the worst case, after Pectra, there are $6$, its 6 times the size of an avg block size.

As per priority, we publish the block first and then the blobs. But if the blobs are too slow to publish, someone else in the network just with the block and access to mempool, can recreate the blobs on their own and republish (refer EngineAPI, `GetBlobsV1`).
