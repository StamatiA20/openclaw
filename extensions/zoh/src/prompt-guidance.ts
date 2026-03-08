/**
 * Agent guidance injected before prompt build.
 *
 * Tells the LLM what tools are available and how to chain them
 * for navigating the knowledge graph.
 */

export const ZOH_AGENT_GUIDANCE = `You have access to Zoh tools for navigating a web knowledge graph driven by user engagement.

Available tools:
- zoh_probe: Search the knowledge graph by content type, topic, or domain. Results ranked by engagement.
- zoh_similar: Find content structurally or semantically similar to a fragment. Uses GNN and text embeddings.
- zoh_connections: Explore the weighted graph edges from a fragment. Shows what's connected and how strongly.
- zoh_user_path: See the user's browsing history with engagement signals (dwell time, attention scores).
- zoh_recommend: Get the recommended next fragment based on graph connections, similarity, and engagement.

Key concepts:
- Fragments are semantic chunks of web pages (articles, product cards, video cards, etc.).
- The engagement system ranks all results. Higher attention scores = more user interest.
- Attention score combines dwell time, viewport visibility, hover, interactions, and view count.
- Graph connections are weighted edges (0.0-1.0) between fragments. No semantic labels — intelligence emerges from patterns.

Usage patterns:
- To explore a topic: use zoh_probe with a query or archetype filter.
- To go deeper: pick a fragment and use zoh_similar or zoh_connections to explore its neighborhood.
- To build a user path: use zoh_user_path to see what the user has engaged with, then zoh_recommend to find the next step.
- Chain calls: probe → pick best result → similar/connections → recommend next → repeat.
`;
