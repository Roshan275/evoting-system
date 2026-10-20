// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    Candidate[] private candidates;
    mapping(address => bool) private voted;

    event VoteCast(address indexed voter, uint256 indexed candidateId);

    error InvalidCandidate(uint256 candidateId);
    error AlreadyVoted(address voter);

    constructor() {
        candidates.push(Candidate(1, "Aarav Sharma", 0));
        candidates.push(Candidate(2, "Diya Patel", 0));
        candidates.push(Candidate(3, "Kabir Deshmukh", 0));
    }

    function vote(uint256 candidateId) external {
        if (candidateId == 0 || candidateId > candidates.length) {
            revert InvalidCandidate(candidateId);
        }
        if (voted[msg.sender]) revert AlreadyVoted(msg.sender);

        voted[msg.sender] = true;
        candidates[candidateId - 1].voteCount += 1;
        emit VoteCast(msg.sender, candidateId);
    }

    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function hasVoted(address voter) external view returns (bool) {
        return voted[voter];
    }
}
