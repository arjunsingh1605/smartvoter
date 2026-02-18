
// JavaScript + CryptoJS (SHA-256)

/*
  BLOCK CLASS
  Represents a single block in the blockchain.
  Each block stores:
  - index: position in the chain
  - timestamp: when the vote was cast
  - voterId: the unique Voter ID
  - vote: chosen candidate
  - previousHash: hash of the previous block
  - hash: SHA-256 hash of this block's content
*/
class Block {
  constructor(index, timestamp, voterId, vote, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.voterId = voterId;
    this.vote = vote;
    this.previousHash = previousHash;
    this.hash = this.calculateHash(); // calculate hash on creation
  }

  // Uses CryptoJS to compute a SHA-256 hash of the block's data
  calculateHash() {
    return CryptoJS.SHA256(
      this.index +
        this.timestamp +
        this.voterId +
        this.vote +
        this.previousHash
    ).toString();
  }
}

/*
  BLOCKCHAIN CLASS
  Maintains the chain of blocks and ensures integrity.
  Main responsibilities:
  - createGenesisBlock(): first block in chain
  - getLatestBlock(): helper to get the last block
  - addBlock(newBlock): add a block with correct links & hash
  - isChainValid(): verify the entire chain has not been tampered
*/
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  // First block with fixed values (no previous hash)
  createGenesisBlock() {
    return new Block(
      0,
      new Date().toISOString(),
      "GENESIS",
      "No Vote",
      "0"
    );
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    // Link to previous block
    newBlock.previousHash = this.getLatestBlock().hash;
    // Recalculate hash now that previousHash has been set
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  /*
    Validity rules:
    1. Each block's stored hash must match a recalculation of its contents.
    2. Each block's previousHash must match the hash of the previous block.
  */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      // Recalculate hash and compare with stored hash
      const recalculatedHash = currentBlock.calculateHash();
      if (currentBlock.hash !== recalculatedHash) {
        return false;
      }

      // Check linkage
      if (currentBlock.previousHash !== prevBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

// ========================
// APPLICATION STATE
// ========================

// Single blockchain instance for the app
const votingBlockchain = new Blockchain();

// To prevent duplicate voting, we track which IDs have already voted
const votedVoterIds = new Set();

// Simple tally of votes per candidate
const voteCounts = {
  Arjun: 0,
  Arav: 0,
  Rahini: 0,
  Hrishi: 0,
};

// ========================
// DOM ELEMENT REFERENCES
// ========================
const voterIdInput = document.getElementById("voterId");
const candidateSelect = document.getElementById("candidateSelect");
const voteButton = document.getElementById("voteButton");
const messageEl = document.getElementById("message");

const votesArjunEl = document.getElementById("votesArjun");
const votesAravEl = document.getElementById("votesArav");
const votesRahiniEl = document.getElementById("votesRahini");
const votesHrishiEl = document.getElementById("votesHrishi");

const chainContainer = document.getElementById("chainContainer");
const chainStatusEl = document.getElementById("chainStatus");
const tamperButton = document.getElementById("tamperButton");

// ========================
// UI HELPER FUNCTIONS
// ========================

/**
 * Updates the message text displayed below the Vote button.
 * @param {string} text - The message to display
 * @param {"success" | "error" | ""} type - Message type for color styling
 */
function setMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.classList.remove("success", "error");
  if (type) {
    messageEl.classList.add(type);
  }
}

/**
 * Re-renders blockchain blocks on the page as cards.
 * Also optionally marks invalid blocks if the chain is currently invalid.
 */
function renderBlockchain() {
  chainContainer.innerHTML = "";

  const isValidChain = votingBlockchain.isChainValid();

  votingBlockchain.chain.forEach((block, index) => {
    const blockCard = document.createElement("div");
    blockCard.className = "block-card";

    // Mark blocks visually if the chain is invalid and this block contributes
    if (!isValidChain && index >= 1) {
      // Any block from index 1 onward might be tampered, so highlight
      blockCard.classList.add("invalid");
    }

    const header = document.createElement("div");
    header.className = "block-header";

    const title = document.createElement("div");
    title.className = "block-title";
    title.textContent = `Block #${block.index}`;

    const tag = document.createElement("span");
    tag.className = "block-tag";
    if (index === 0) {
      tag.textContent = "GENESIS";
      tag.classList.add("genesis");
    } else {
      tag.textContent = "VOTE";
    }

    header.appendChild(title);
    header.appendChild(tag);

    const body = document.createElement("div");
    body.className = "block-body";

    // Helper to append labeled field to body
    function addField(label, value) {
      const field = document.createElement("div");
      field.className = "block-field";

      const labelSpan = document.createElement("span");
      labelSpan.className = "block-label";
      labelSpan.textContent = `${label}:`;

      const valueSpan = document.createElement("span");
      valueSpan.className = "block-value";
      valueSpan.textContent = value;

      field.appendChild(labelSpan);
      field.appendChild(valueSpan);
      body.appendChild(field);
    }

    addField("Voter ID", block.voterId);
    addField("Vote", block.vote);
    addField("Timestamp", block.timestamp);
    addField("Prev Hash", block.previousHash);
    addField("Hash", block.hash);

    blockCard.appendChild(header);
    blockCard.appendChild(body);

    chainContainer.appendChild(blockCard);
  });
}

/**
 * Updates the numeric vote counts shown in the Results card.
 */
function renderResults() {
  votesArjunEl.textContent = voteCounts.Arjun;
  votesAravEl.textContent = voteCounts.Arav;
  votesRahiniEl.textContent = voteCounts.Rahini;
  votesHrishiEl.textContent = voteCounts.Hrishi;
}

/**
 * Checks the blockchain validity and updates the status text + styling.
 */
function renderChainStatus() {
  const isValid = votingBlockchain.isChainValid();
  chainStatusEl.textContent = isValid
    ? "Blockchain Valid"
    : "Blockchain Invalid (Tampered)";
  chainStatusEl.classList.toggle("valid", isValid);
  chainStatusEl.classList.toggle("invalid", !isValid);
}

/**
 * Convenient function to refresh all parts of the UI that depend on blockchain state.
 */
function refreshUI() {
  renderBlockchain();
  renderResults();
  renderChainStatus();
}

// ========================
// VOTING LOGIC
// ========================

/**
 * Validates input, checks for duplicate voting, and then adds a new block.
 */
function handleVote() {
  const voterId = voterIdInput.value.trim();
  const selectedCandidate = candidateSelect.value;

  // Basic validation
  if (!voterId) {
    setMessage("Please enter a Voter ID.", "error");
    return;
  }
  if (!selectedCandidate) {
    setMessage("Please choose a candidate.", "error");
    return;
  }

  // Duplicate voting check
  if (votedVoterIds.has(voterId)) {
    setMessage("This Voter ID has already voted. Duplicate voting is not allowed.", "error");
    return;
  }

  // Mark this Voter ID as having voted
  votedVoterIds.add(voterId);

  // Create a new block for this vote
  const newIndex = votingBlockchain.chain.length; // next index
  const timestamp = new Date().toISOString();

  const newBlock = new Block(
    newIndex,
    timestamp,
    voterId,
    selectedCandidate
  );

  // Add to blockchain
  votingBlockchain.addBlock(newBlock);

  // Increment candidate's vote count
  voteCounts[selectedCandidate] += 1;

  // Update UI
  setMessage("Vote successfully recorded on the blockchain.", "success");
  refreshUI();

  // Clear inputs to make next vote easier to enter
  voterIdInput.value = "";
  candidateSelect.value = "";
}

// ========================
// TAMPER DEMONSTRATION
// ========================

/*
  Intentionally modify Block 1 (index 1) to simulate tampering.
  Note: we do NOT recalculate the hash after changing data.
  This guarantees that isChainValid() will fail.
*/
function tamperFirstVoteBlock() {
  if (votingBlockchain.chain.length <= 1) {
    alert("No vote blocks to tamper with yet. Cast at least one vote first.");
    return;
  }

  const firstVoteBlock = votingBlockchain.chain[1];
  // Change the stored data
  firstVoteBlock.vote = "Tampered Candidate";
  firstVoteBlock.voterId = "TAMPERED_ID";
  // We intentionally DO NOT call firstVoteBlock.calculateHash()
  // so its stored hash no longer matches its data.

  // Re-render to show changed block & status
  refreshUI();
  setMessage(
    "Block 1 has been tampered. The blockchain is now invalid.",
    "error"
  );
}

// ========================
// EVENT LISTENERS
// ========================

// Attach listeners once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  voteButton.addEventListener("click", handleVote);
  tamperButton.addEventListener("click", tamperFirstVoteBlock);

  // Optionally handle pressing Enter in the Voter ID field as "submit"
  voterIdInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      handleVote();
    }
  });

  // Initial render
  refreshUI();
});


