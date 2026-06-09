# Ravissant

A comprehensive calorie counting application that just works. Ravissant provides a seamless experience across mobile and web platforms for tracking your nutritional intake.

## Project Overview

Ravissant is built as a full-stack application with a modern tech stack:

- **Backend**: Rust-based API and web scraping services
- **Frontend**: React Native Expo application for cross-platform mobile and web support
- **Database**: SQLite for local data persistence with support for Products and Supermarkets

## Project Structure

```
├── /backend          # Backend services and web scrapers (Rust)
└── /mobile           # Mobile application built with Expo (React Native)
```

## Mobile Application

The mobile app is built with **Expo** and **React Native**, providing a native-like experience on iOS, Android, and web platforms.

### Tech Stack

- **Framework**: Expo with React Native
- **Routing**: Expo Router for file-based routing
- **Styling**: Tailwind CSS via NativeWind, Gluestack UI for component library
- **Type Safety**: TypeScript
- **Storage**: Expo SQLite for local data, AsyncStorage for preferences
- **Icons**: Lucide React Native, Expo Vector Icons
- **Animation**: Legend Motion for smooth animations
- **Navigation**: React Navigation with bottom tab navigation

### Mobile Folder Structure

```
mobile/
├── /app                    # Expo Router pages (file-based routing)
│   ├── (app)/              # Main app routes
│   ├── _layout.tsx         # Root layout and navigation setup
│   ├── onboarding.tsx      # Onboarding flow
│   └── +not-found.tsx      # 404 fallback page
├── /components             # Reusable UI components
│   └── /ui                 # Gluestack UI component wrappers
├── /features               # Feature-specific modules
│   └── /onboard            # Onboarding feature logic and components
├── /hooks                  # Custom React hooks
│   └── useOnboard.ts       # Onboarding state management hook
├── /types                  # TypeScript type definitions
├── /utils                  # Utility functions and helpers
├── /constants              # App constants and configuration
├── /assets                 # Images, icons, and fonts
├── app.json                # Expo configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── global.css              # Global styles
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

### Folder Purposes

- **/app** - Expo Router file-based routing; contains all navigable screens and layouts
- **/components/ui** - Reusable UI components built with Gluestack and styled with NativeWind
- **/features** - Feature-specific modules grouping related screens, hooks, and logic
- **/hooks** - Custom React hooks for state management and business logic
- **/types** - Centralized TypeScript type definitions for type safety across the app
- **/utils** - Helper functions and utility modules for common operations
- **/constants** - App-wide constants, configuration values, and magic strings
- **/assets** - Static resources including images, icons, and custom fonts

### Getting Started

```bash
# Install dependencies
cd mobile
npm install

# Start development server
npm run start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### Available Commands

- `npm run start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run web version
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run reset-project` - Reset project to initial state

## Database Structure

### Core Entities

- **Products** - Nutritional product information including calories, macronutrients, and metadata
- **Supermarkets** - Supermarket locations and store information

## Supermarket Integration

Currently integrated supermarkets:

- Metro

## Backend

The backend service is built in Rust and provides:

- API endpoints for product and supermarket data
- Web scraping services for supermarket product availability
- Data aggregation and caching

---

Built with modern tooling for reliability and performance.
