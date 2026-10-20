const fs = require("node:fs");
const path = require("node:path");
const { artifacts, ethers, network } = require("hardhat");

async function main() {
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  const artifact = await artifacts.readArtifact("Voting");
  const deployment = {
    address,
    chainId: Number(network.config.chainId),
    abi: artifact.abi,
  };
  const outputPath = path.join(__dirname, "..", "src", "contract-config.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(`Voting deployed to: ${address}`);
  console.log(`Chain ID: ${deployment.chainId}`);
  console.log(`Frontend contract config written to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
