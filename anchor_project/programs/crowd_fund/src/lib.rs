use anchor_lang::prelude::*;

const MAX_CAMPAIGN_NAME: usize = 50;
const MAX_CAMPAIGN_DESCR: usize = 250;
const LAMPORT_PER_SOL: u64 = 1_000_000_000;
const ANCHOR_ACCOUNT_DESCRIMINATOR: usize = 8;

declare_id!("3Por2Tkg1cv11vBYz58Kxq56H6RAuAX6HJznscZrp2ih");


#[program]
mod crowd_fund {
    use super::*;

    pub fn create_campaign(ctx: Context<CreateCampaign>, name: String, description: String, target_amount: u64) -> Result<()> {
        require!(
            name.as_bytes().len() <= MAX_CAMPAIGN_NAME,
            CrowdFundError::CampaignNameTooLong
        );
        
        require!(
            description.as_bytes().len() <= MAX_CAMPAIGN_DESCR,
            CrowdFundError::CampaignDescrTooLong
        );

        ctx.accounts.campaign_pda.set_inner(Campaign { 
            name, 
            description, 
            target_amount, 
            amount_donated: 0, 
            amount_withdrawn: 0,
            update_authority: ctx.accounts.update_authority.key(),
        });
        msg!("New Campaign Created : {:?}!", ctx.accounts.campaign_pda);
        Ok(())
    }

    pub fn donate_to_campaign(ctx: Context<DonateToCampaign>, amount: u64) -> Result<()> {
        require!(amount > 0, CrowdFundError::InvalidAmount);

        // move the amount from the signer wallet to the campaign_pda
        msg!("About to Donate {:?} to {:?}", amount, ctx.accounts.campaign_pda);

        // Create the transfer instruction
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.signer.key(), 
            &ctx.accounts.campaign_pda.key(), 
            amount * LAMPORT_PER_SOL
        );
        msg!("Created a transfer instruction: {:?}", transfer_instruction);

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.signer.to_account_info(),
                ctx.accounts.campaign_pda.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // increment the amount donated on the campaign account
        ctx.accounts.campaign_pda.amount_donated += amount;
        msg!("{} SOL has been Donated to the {:?}", amount, ctx.accounts.campaign_pda);

        Ok(())
    }

    pub fn withdraw_from_campaign(ctx: Context<WithdrawFromCampaign>, amount: u64) -> Result<()> {
        require!(amount > 0, CrowdFundError::InvalidAmount);

        let campaign_lamports = ctx.accounts.campaign_pda.get_lamports();
        require!(
            campaign_lamports > amount * LAMPORT_PER_SOL,
            CrowdFundError::InsufficientCampaignBalance
        );

        msg!("About to Withdraw {} from Campaign", amount);

        ctx.accounts.campaign_pda.sub_lamports(amount * LAMPORT_PER_SOL)?;
        ctx.accounts.update_authority.add_lamports(amount * LAMPORT_PER_SOL)?;

        ctx.accounts.campaign_pda.amount_withdrawn += amount;
        msg!("✅ Withdrawal of {} from Campaign Successful", amount);
        
        Ok(())
    }

    pub fn close_campaign(_ctx: Context<CloseCampaign>) -> Result<()> {
        msg!("Closing campaign PDA and transferring remaining lamports to signer...");
        Ok(())
    }
}



#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(
        init, 
        payer = update_authority, 
        seeds = [b"campaign", update_authority.key().as_ref()],
        space = ANCHOR_ACCOUNT_DESCRIMINATOR + Campaign::INIT_SPACE,
        bump
    )]
    pub campaign_pda: Account<'info, Campaign>,
    #[account(mut)]
    pub update_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct DonateToCampaign<'info> {
    #[account(mut)]
    pub campaign_pda: Account<'info, Campaign>,
    #[account(mut)]
    pub signer: Signer<'info>, // donor
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct WithdrawFromCampaign<'info> {
    #[account(
        mut,
        seeds = [b"campaign", update_authority.key().as_ref()],
        bump
    )]
    pub campaign_pda: Account<'info, Campaign>,
    #[account(mut)]
    pub update_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct CloseCampaign<'info> {
    #[account(
        mut,
        close = update_authority,
        seeds = [b"campaign", update_authority.key().as_ref()],
        bump
    )]
    pub campaign_pda: Account<'info, Campaign>,
    #[account(mut)]
    pub update_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[account]
#[derive(Debug)]
#[derive(InitSpace)]
pub struct Campaign {
    update_authority: Pubkey,
    #[max_len(MAX_CAMPAIGN_NAME)]
    name: String,
    #[max_len(MAX_CAMPAIGN_DESCR)]
    description: String,
    target_amount: u64,
    amount_donated: u64,
    amount_withdrawn: u64,
}


#[error_code]
pub enum CrowdFundError {
    #[msg("Campaign name may only hold characters below 50 of Length")]
    CampaignNameTooLong,
    #[msg("Campaign description may only hold characters below 250 of Length")]
    CampaignDescrTooLong,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("User already has an active campaign.")]
    CampaignAlreadyExists,
    #[msg("PDA is owned by an invalid owner")]
    InvalidOwner,
    #[msg("insufficient balance in the campaign account")]
    InsufficientCampaignBalance,
}