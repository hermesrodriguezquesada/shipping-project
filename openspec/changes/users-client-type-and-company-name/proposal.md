# Proposal: users client type and company name

## Problem statement
The users domain currently stores and exposes personal profile fields, but it does not model whether a user is a natural person or a company. The frontend now needs two business fields in user records:

- `clientType` with business values `PERSON | COMPANY`
- `companyName` for company clients

Current gaps:
- `User` in Prisma has no `clientType` and no `companyName`.
- GraphQL `UserType` does not expose those fields.
- `register`, `updateMyProfile`, `adminCreateUser`, and `adminUpdateUserProfile` do not accept or persist those fields.
- `me`, `myProfile`, and `adminUsers` cannot return those fields because they are absent from the user mapping model.

## Why `clientType` and `companyName` are needed
- Business logic and UI behavior depend on whether the account belongs to a person or a company.
- Company accounts need an explicit legal/business name.
- Inferring account type from optional fields is brittle and leads to inconsistent data.
- A first-class enum field improves validation, reporting, and downstream integrations.

## Scope boundaries
In scope:
- Add Prisma enum `ClientType` with `PERSON` and `COMPANY`.
- Add `User.clientType` and `User.companyName`.
- Expose both fields in GraphQL `UserType`.
- Extend user-related create/update flows:
  - `register`
  - `updateMyProfile`
  - `adminCreateUser`
  - `adminUpdateUserProfile`
- Ensure reads include new fields via existing flows:
  - `me`
  - `myProfile`
  - `adminUsers`

Out of scope:
- No auth or guard changes.
- No role handling changes (`role: String!` remains unchanged in GraphQL output).
- No unrelated filtering/sorting changes in `adminUsers`.
- No unrelated refactors across other modules.

## Backfill need for existing users
Existing rows must be migrated deterministically so the new required enum is safe:
- Existing users default to `clientType=PERSON`.
- Existing users keep `companyName=null`.

This avoids migration failures and keeps behavior backward-compatible for current accounts.

## Risk assessment
- Migration risk: introducing a required enum in a populated table requires ordered backfill before NOT NULL enforcement.
- Validation risk: inconsistent combinations (`COMPANY` without `companyName`) must be blocked by explicit application rules.
- Contract risk: adding new fields to existing inputs/outputs may require frontend query and mutation updates.
- Data consistency risk: silent acceptance of invalid combinations can pollute user records; normalization and validation should be explicit.
