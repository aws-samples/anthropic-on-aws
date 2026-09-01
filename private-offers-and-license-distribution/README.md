# Private Offer & License Distribution Guide

How AWS Marketplace Private Offers (MPPOs) are accepted and how negotiated pricing reaches your accounts, across the three ways Claude is purchased on AWS.

**[Read the guide (PDF)](./private-offer-and-license-distribution-guide.pdf)** · Revision: August 2026

## What this covers

For all three products the path is the same: agree terms with Anthropic, sign an Order Form, complete the Customer ID Certification form to confirm the Payer Account ID(s), accept the MPPOs in those accounts, and usage bills through your AWS invoice at the negotiated rate.

What differs is what happens after acceptance. Claude Enterprise and Claude Platform apply your pricing automatically. Bedrock needs one additional step from an AWS Admin: distributing the discount to every account that calls Bedrock.

| | Claude Enterprise in AWS Marketplace | Claude Platform on AWS | Claude on Amazon Bedrock |
|---|---|---|---|
| MPPOs to accept | 1 | 1 | 1 per model and model version |
| License Manager distribution required | No | No | Yes |
| User access managed by | Claude Admin Console | AWS IAM | AWS IAM + License Manager |
| Billing | AWS Marketplace | AWS Marketplace | AWS Marketplace |

## Contents

1. **Claude Enterprise in AWS Marketplace** — accepting the offer, setting up a Claude Organization, and the two post-acceptance paths depending on whether you already run one.
2. **Claude Platform on AWS** — signing up in the AWS Console, IAM-federated access, one subscription per AWS account, and planning a cutover if you already have an Anthropic organization.
3. **Claude on Amazon Bedrock** — accepting an offer per model and version, distributing discounts through managed entitlements or per-account offers, and verifying that grants are active.
4. **Frequently asked questions** — multiple AWS Organizations, delegated administrators, new model versions, new accounts joining after grants were distributed, and retroactive discounts.

## Who this is for

Written for the AWS Procurement, AWS Admin, and Claude or Anthropic organization owner roles on a customer's team, and usable by AWS and Anthropic field teams walking a customer through onboarding.

## Getting help

For MPPO acceptance and license distribution support, contact your AWS account team. For commercial terms, a reissued offer, or a new Customer ID Certification form, contact your Anthropic representative.
