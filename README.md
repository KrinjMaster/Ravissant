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
