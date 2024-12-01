import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { CrowdFund } from "../target/types/crowd_fund";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { assert } from "chai";

const { SystemProgram } = anchor.web3;
const CAMPAIGN_SEED = "campaign";
const PROGRAM_ID = new PublicKey("3Por2Tkg1cv11vBYz58Kxq56H6RAuAX6HJznscZrp2ih");


describe("crowd_fund", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.CrowdFund as Program<CrowdFund>;

  const updateAuthority = anchor.web3.Keypair.generate();
  const randomUser = anchor.web3.Keypair.generate();
  const [campaignPDA, bump] = generateCampaignPDA(updateAuthority.publicKey);

  console.log("+++++++++++++++++++++++++++++++++++++");
  console.info(`💁🏾‍♀️ Update Authority's Address = ${updateAuthority.publicKey}`);
  console.info(`👨🏾 Random User's Address = ${randomUser.publicKey}`);
  console.info(`🏢 Campaign Address = ${campaignPDA} bump = ${bump}`);
  console.log("+++++++++++++++++++++++++++++++++++++++");

  it("Is Campaign Created!", async () => {
    await airdrop(program.provider.connection, updateAuthority.publicKey, 100);

    const tx = await program.methods.createCampaign("Test Campaign", "Test Description", new BN(0.005))
      .accounts({
        campaignPda: campaignPDA,
        updateAuthority: updateAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([updateAuthority])
      .rpc();

    console.log("Your transaction signature", tx);
  
  });
  
  it("Is Campaign Creation Failed Due to Long Campaign Name!", async () => {
    const updateAuthority2 = anchor.web3.Keypair.generate();
    const [campaignPDA2, bump2] = generateCampaignPDA(updateAuthority2.publicKey);

    await airdrop(program.provider.connection, updateAuthority2.publicKey, 100);

    try {
      const tx = await program.methods.createCampaign(
        "Very very very long and elaborate campaign name that exceeds the expectation of the instruction", 
        "Test Description", 
        new BN(0.005))
        .accounts({
          campaignPda: campaignPDA2,
          updateAuthority: updateAuthority2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([updateAuthority2])
        .rpc();

      assert(false, "This should never be reached");

    } catch (error) {
      const errorMessage = error.error.errorMessage;
      assert(errorMessage == "Campaign name may only hold characters below 50 of Length", "Incorrect Error Message");
    }
  
  });
  
  it("Is Campaign Creation Failed Due to Long Campaign Description!", async () => {
    const updateAuthority3 = anchor.web3.Keypair.generate();
    const [campaignPDA3, bump3] = generateCampaignPDA(updateAuthority3.publicKey);

    await airdrop(program.provider.connection, updateAuthority3.publicKey, 100);

    try {
      const tx = await program.methods.createCampaign(
        "Test Campaign", 
        "Very very very long and elaborate campaign name that exceeds the expectation of the instructio" +
        "Very very very long and elaborate campaign name that exceeds the expectation of the instruction" +
        "Very very very long and elaborate campaign name that exceeds the expectation of the instruction", 
        new BN(0.005))
        .accounts({
          campaignPda: campaignPDA3,
          updateAuthority: updateAuthority3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([updateAuthority3])
        .rpc();

      assert(false, "This should never be reached");

    } catch (error) {
      const errorMessage = error.error.errorMessage;
      assert(errorMessage == "Campaign description may only hold characters below 250 of Length", "Incorrect Error Message");
    }
  
  });
  
  it("Is Donated to Campaign!", async () => {
    await airdrop(program.provider.connection, randomUser.publicKey, 100);
    
    const tx = await program.methods.donateToCampaign(new BN(10))
      .accounts({
        campaignPda: campaignPDA,
        signer: randomUser.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([randomUser])
      .rpc();

    console.log("Your transaction signature", tx);
    
  });
  
  it("Is Donated to Campaign Fails for 0 Donation amount!", async () => {
    await airdrop(program.provider.connection, randomUser.publicKey, 100);
    
    try {
      const tx = await program.methods.donateToCampaign(new BN(0))
        .accounts({
          campaignPda: campaignPDA,
          signer: randomUser.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([randomUser])
        .rpc();

      assert(false, "This should never be reached");

    } catch(error) {
      const errorMessage = error.error.errorMessage;
      assert(errorMessage == "Amount must be greater than zero", "Incorrect Error Message");
    } 
    
  });

  it("Is Withdrawn from Campaign!", async () => {
    
    const tx = await program.methods.withdrawFromCampaign(new BN(10))
      .accounts({
        campaignPda: campaignPDA,
        updateAuthority: updateAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([updateAuthority])
      .rpc();

    console.log("Your transaction signature", tx);

  });
  
  it("Is Withdrawn from Campaign fails for 0 as Amount!", async () => {
    
    try {
        const tx = await program.methods.withdrawFromCampaign(new BN(0))
        .accounts({
          campaignPda: campaignPDA,
          updateAuthority: updateAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([updateAuthority])
        .rpc();

      assert(false, "This should never be reached");

    } catch(error) {
      const errorMessage = error.error.errorMessage;
      assert(errorMessage == "Amount must be greater than zero", "Incorrect Error Message");
    }
  });

  it("Is Campaign Closed!", async () => {
    
    const tx = await program.methods.closeCampaign()
      .accounts({
        campaignPda: campaignPDA,
        updateAuthority: updateAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([updateAuthority])
      .rpc();

    console.log("Your transaction signature", tx);

  });
});


async function airdrop(connection: Connection, recipient: PublicKey, amount: number): Promise<string> {
  try {
    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const lamports = amount * LAMPORTS_PER_SOL;

    // Request airdrop
    console.log(`🪂 Requesting ${amount} SOL airdrop to ${recipient.toBase58()}...`);
    const signature = await connection.requestAirdrop(recipient, lamports);

    // Confirm the transaction using the new strategy object
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed'
    );

    console.log(`✅ Airdrop successful! Transaction signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Airdrop failed:', error);
    throw error;
  }
}

function generatePDA(userPublicKey: PublicKey, seeds: [Buffer, Buffer]): [PublicKey, number] {
  const [generatedPDA, bump] = PublicKey.findProgramAddressSync(
      seeds,
      PROGRAM_ID
  );

  console.log("Generated PDA:", generatedPDA.toBase58());
  console.log("Bump:", bump);

  return [generatedPDA, bump];
}

function generateCampaignPDA(userPublicKey: PublicKey): [PublicKey, number] {
    const [campaignPDA, bump] = generatePDA(userPublicKey, [Buffer.from(CAMPAIGN_SEED), userPublicKey.toBuffer()]);

    return [campaignPDA, bump];
}