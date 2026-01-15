# Sponsor Listing Payment System - Task Breakdown

## Phase 1: Analysis & Planning ✅ COMPLETE
- [x] Analyze existing CarMarketplace infrastructure
- [x] Review current wallet system implementation
- [x] Identify gaps in existing sponsor_payment_system.md plan
- [x] Review database schema for car_listings and wallet tables
- [x] Create comprehensive phased implementation plan
- [x] **DISCOVERED:** Wallet system fully functional for car providers!
- [x] Create final detailed implementation plan with all code

## Phase 2: Database & Models (3 hours)
- [ ] Create car_listing_sponsorship_histories migration
- [ ] Create CarListingSponsorshipHistory model
- [ ] Seed sponsor settings in system_settings
- [ ] Add relationships to CarListing model
- [ ] Test database migrations

## Phase 3: Backend API Development (5 hours)
- [ ] Add calculateSponsorPrice endpoint
- [ ] Add sponsorListing endpoint (provider)
- [ ] Add unsponsorListing endpoint with refund
- [ ] Add admin sponsor settings endpoints (get/update)
- [ ] Add admin sponsor listing endpoint (free)
- [ ] Add sponsorship revenue analytics endpoint
- [ ] Add API routes
- [ ] Test all endpoints with Postman

## Phase 4: Frontend - Dashboard Integration (6 hours)
- [ ] Create SponsorListingModal component
- [ ] Add sponsor button to ListingsView
- [ ] Add unsponsor functionality
- [ ] Integrate wallet balance check
- [ ] Test provider sponsor flow

## Phase 5: Frontend - Marketplace Display (3 hours)
- [ ] Add sponsored badge to CarListingCard
- [ ] Add sponsored badge to RentListingCard
- [ ] Add badge to CarListingDetail
- [ ] Add badge to RentCarListingDetail
- [ ] Update marketplace sorting to prioritize sponsored
- [ ] Test marketplace display

## Phase 6: Admin Dashboard (4 hours)
- [ ] Enhance CarListingsSponsorView with settings
- [ ] Add revenue analytics display
- [ ] Add sponsorship history tab
- [ ] Add pricing settings form
- [ ] Test admin sponsor functionality

## Phase 7: Scheduled Jobs (1 hour)
- [ ] Create ExpireSponsorships command
- [ ] Schedule daily job in Kernel
- [ ] Test expiry command manually

## Phase 8: Testing & Deployment (3 hours)
- [ ] Test complete sponsor flow (provider)
- [ ] Test admin sponsor (free)
- [ ] Test refund calculation
- [ ] Test expiry automation
- [ ] Deploy to production
- [ ] Monitor first sponsorships
