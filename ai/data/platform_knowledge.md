# All In One Classified Marketplace - Official Knowledge Base

## Overview & Architecture
All In One Classified is a modern, high-performance Pakistani classifieds marketplace platform built with React, Vite, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Authentication, Realtime, Database RPCs), and Vercel Serverless Functions.

The platform connects buyers and sellers across Pakistan, allowing users to browse, search, post, manage, and promote classified advertisements across various categories such as Vehicles, Real Estate, Electronics, Fashion, Services, Jobs, Mobile Phones, and Home Appliances.

---

## Authentication & User Accounts
- **Registration**: Users can sign up with email and password or social auth via Supabase Authentication.
- **Roles**: The platform supports 4 primary user roles:
  1. **Buyer**: Can search, browse, view details, chat, send voice messages, place audio calls, and favorite listings.
  2. **Seller**: Can post ads, edit listings, upload images, manage listings in My Listings dashboard, and promote ads.
  3. **Moderator**: Can review reported listings, approve or reject pending ads, and monitor marketplace compliance.
  4. **Admin / Super Admin**: Has full access to global analytics, user management, admin/moderator assignment, category management, payment monitoring, system configuration, and database settings.
- **Account Verification**: Users can apply for verified seller status by submitting CNIC/identity details in the Account Verification section of their dashboard (`/dashboard/verification`). Once verified by Admin, a blue verification checkmark badge is displayed on their profile and listings.

---

## Categories & Listings
- **Hierarchy**: Support for main categories, subcategories, and sub-subcategories (e.g. Vehicles -> Cars -> Toyota -> Corolla).
- **Posting an Ad**: Users navigate to "Post Ad" (`/post-ad`), fill in title, description, category, subcategory, price (PKR), product condition (New, Used, Refurbished), location (City/Area in Pakistan), upload images, and submit.
- **Listing Filters**: Users can filter listings by search keywords, category, price range, city/location, product condition, and sorting order (Latest, Price Low-High, Price High-Low, Most Popular).
- **Favorites & Wishlist**: Users can click the heart icon on any listing to save it to their Saved Ads (`/dashboard/favorites`).

---

## Communication (Messaging, Voice & Calls)
- **Realtime Chat**: Buyers and sellers can communicate directly through the built-in real-time chat messaging system (`/chat` or `/dashboard/messages`).
- **Voice Messages**: Users can record, send, and play back voice notes directly within chat conversations using the built-in audio recorder and player.
- **Audio Calls**: WebRTC/AudioCallContext enables real-time peer-to-peer audio calls between buyer and seller directly within the marketplace browser window.

---

## Ad Promotions & Safepay Payments
- **Promotion Packages**: Sellers can promote their ads to get maximum visibility on the Home Page and search results:
  1. **Urgent Badge** (PKR 500 for 7 Days): Adds a bright red "URGENT" badge to the listing.
  2. **Featured Ad** (PKR 1,200 for 15 Days): Pins the ad to the top of the Home Page and search results with a gold ⭐ Featured Badge.
  3. **Premium VIP** (PKR 2,500 for 30 Days): Combines Urgent + Featured + VIP styling with maximum homepage placement.
- **Payment Gateway (Safepay)**:
  - Online payments are processed securely via **Safepay Hosted Checkout** (card, bank, mobile wallets).
  - **No sensitive card details (Card Number, CVV, PIN) are stored** on marketplace servers or database.
  - **Automated Webhook Fulfillment**: Upon successful payment, Safepay triggers serverless webhooks (`/api/safepay/webhook` and `/api/safepay/verify-tracker`) which call Supabase RPC `fulfill_safepay_promotion`, automatically setting `is_featured = true` and activating the promotion **instantly without requiring manual admin approval**.

---

## Admin & Super Admin Management
- **Dashboard Routes**:
  - Super Admin Dashboard (`/superadmin`): Overview, Admin Management, Moderator Management, User Management, Global Analytics, Categories, Payments, System Config, and Database Settings.
  - Admin Dashboard (`/admin`): Overview, Listings approval, User list, Verification Applications review, Categories, Analytics, and Settings.
  - User Dashboard (`/dashboard`): Overview, My Listings, Post Ad, Messages, Favorites, Analytics, Account Verification, and Settings.
- **Security & Access Control**: Protected routes (`ProtectedRoute`) enforce strict role-based access control (RBAC).

---

## Marketplace Rules & Policies
- Fraudulent, illegal, weapons, counterfeit goods, or deceptive listings are strictly prohibited and will be removed by moderators.
- Users should deal safely by communicating through the marketplace chat/call system.
- Always inspect items in person before finalizing transactions for physical goods.
