# Skill Connect Pro

Build a modern startup-quality web application called SkillConnect.

Project Vision

SkillConnect is an AI-powered local service marketplace platform that connects customers with nearby skilled workers.

The platform helps users quickly find trusted local professionals such as:

Mechanics

Plumbers

Electricians

Carpenters

Drivers

Painters

AC Technicians

Welders

House Cleaners

Cooks

The platform should be designed primarily for Indian users and support both English and Tamil.

The design should feel modern, premium, trustworthy, mobile-friendly, and suitable for real-world deployment.

Technology Requirements

Frontend:

React

TypeScript

Tailwind CSS

Responsive Design

Backend:

Supabase

Use:

Supabase Authentication

Supabase Database

Supabase Storage

Supabase Realtime

User Roles

Customer

Customers can:

Register/Login

Search workers

Browse categories

View worker profiles

Call workers

WhatsApp workers

Save favourites

Book services

Rate and review workers

Service Provider

Service providers can:

Register/Login

Create professional profile

Upload portfolio images

Add experience

Set service areas

Receive booking requests

Manage availability

View reviews

Landing Page

Create a premium landing page with:

Hero Section:

Large headline:
"Find Trusted Local Professionals Near You"

Search bar

Category icons

Call-to-action buttons

Sections:

Popular Categories

Top Rated Professionals

How It Works

Customer Reviews

Download App Section

Footer

Authentication

Support:

Phone OTP Login

Email Login

Google Login

Onboarding

Allow users to choose:

Continue as Customer

Continue as Service Provider

Customer Dashboard

Features:

Search Bar

Tamil and English support

Category Grid

Nearby Professionals

Top Rated Professionals

Recent Searches

Categories:

Mechanic

Plumber

Electrician

Carpenter

Driver

Cook

Painter

AC Technician

Welder

Cleaner

Search System

Allow searching by:

Profession

Location

Service Type

Filters:

Distance

Rating

Availability

Worker Profile Page

Display:

Profile Photo

Name

Profession

Experience

Service Areas

Portfolio Images

Ratings

Reviews

Buttons:

Call Now

WhatsApp

Book Service

Service Provider Dashboard

Display:

Profile Completion

Active Requests

Completed Jobs

Rating Summary

Portfolio Gallery

Actions:

Edit Profile

Upload Photos

Manage Availability

View Requests

Portfolio Module

Allow providers to:

Upload images

Upload work samples

Add project descriptions

Store files in Supabase Storage.

Booking Module

Customers can:

Select service

Choose date

Choose time

Add notes

Providers can:

Accept booking

Reject booking

Mark completed

Reviews & Ratings

Customers can:

Give star ratings

Write reviews

Upload completion photos

AI Features

AI Voice Search

User can speak naturally.

Examples:

"My bike won't start."

AI understands:

Mechanic

Show nearby mechanics.

Example:

"My water motor is leaking."

AI understands:

Plumber

Show nearby plumbers.

Support Tamil and English.

AI Profile Generator

When a provider uploads portfolio images, automatically generate:

Professional description

Skills summary

Experience summary

Database Design

Create Supabase tables:

users
providers
bookings
reviews
portfolio_images
favorites
notifications

Include proper relationships and Row Level Security policies.

Admin Dashboard

Create admin features:

User Management

Provider Verification

Review Moderation

Category Management

Analytics

UI Requirements

Design Style:

Premium

Startup Quality

Modern SaaS Design

Mobile First

Fully Responsive

Use:

Smooth animations

Rounded cards

Modern gradients

Dark mode support

Professional typography

Future Mobile App Compatibility

Structure the project so it can later be converted into:

Progressive Web App (PWA)

Android App

iOS App

without major redesign.

Generate the complete application architecture, pages, navigation, components, database schema, and Supabase integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bbe0ad60-9443-4767-9b2a-81070412877e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Connect Your Own Supabase Project

1. Create a new Supabase project at https://app.supabase.com.
2. Copy `.env.example` to `.env` in the repo root.
3. Update `.env` with your own Supabase values:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. In Supabase, enable Email/Password auth and/or Google auth if you want OAuth sign-in.
5. Create the database schema using the SQL found in `supabase/migrations/20260621051245_f4fc170a-0739-4814-96c1-5c046ced7932.sql`.
   - You can paste it into Supabase SQL editor, or use the Supabase CLI to apply it.
6. Restart the app after updating `.env`.

### Notes

- The app reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` on both client and server.
- `SUPABASE_SERVICE_ROLE_KEY` is required for server-side admin operations.
- The current Google sign-in button uses Lovable OAuth. If you want Google OAuth against your own Supabase, you will need to replace that flow with `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/mode' } })`.
