const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  async function deployVoting() {
    const [owner, voter, other] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();
    return { voting, owner, voter, other };
  }

  it("starts with three candidates and zero votes", async function () {
    const { voting } = await deployVoting();
    const candidates = await voting.getCandidates();
    expect(candidates).to.have.length(3);
    expect(candidates.map((c) => c.name)).to.deep.equal([
      "Aarav Sharma",
      "Diya Patel",
      "Kabir Deshmukh",
    ]);
    expect(candidates.every((c) => c.voteCount === 0n)).to.equal(true);
  });

  it("records a valid vote and emits VoteCast", async function () {
    const { voting, voter } = await deployVoting();
    await expect(voting.connect(voter).vote(2))
      .to.emit(voting, "VoteCast")
      .withArgs(voter.address, 2);

    const candidates = await voting.getCandidates();
    expect(candidates[1].voteCount).to.equal(1n);
    expect(await voting.hasVoted(voter.address)).to.equal(true);
  });

  it("rejects a second vote from the same wallet", async function () {
    const { voting, voter } = await deployVoting();
    await voting.connect(voter).vote(1);
    await expect(voting.connect(voter).vote(3))
      .to.be.revertedWithCustomError(voting, "AlreadyVoted")
      .withArgs(voter.address);
  });

  it("rejects candidate IDs outside the available range", async function () {
    const { voting, voter } = await deployVoting();
    for (const candidateId of [0, 4]) {
      await expect(voting.connect(voter).vote(candidateId))
        .to.be.revertedWithCustomError(voting, "InvalidCandidate")
        .withArgs(candidateId);
    }
    expect(await voting.hasVoted(voter.address)).to.equal(false);
  });
});
