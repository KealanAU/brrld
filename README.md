# BRRLD Visual - Beach & Swell Forecasting

<div align="center">
  <img src="/public/logo.svg" alt="BRRLD Logo" width="400" height="100" />
</div>

A modern, interactive beach and swell forecasting web application that provides real-time surf conditions, tidal data, and wind forecasts for surfers and beach enthusiasts.

## 🌊 Features

- **Interactive Beach Search**: Find and select beaches from an extensive database
- **Swell Visualization**: Real-time swell height, direction, and period data with interactive charts
- **Tidal Information**: High and low tide times with height predictions
- **Wind Mapping**: Current wind conditions and forecasts
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Interactive Maps**: Visual beach locations with Leaflet integration

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brrld-visual
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🎥 Demo

[demo.webm](https://github.com/user-attachments/assets/4286724a-89ff-41af-a386-9ba28e926f13)


## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: D3.js for data visualization
- **Maps**: Leaflet with React-Leaflet
- **UI Components**: Radix UI Themes
- **Data Parsing**: PapaParse for CSV handling
- **Package Manager**: pnpm

## 📊 Data Sources

The application uses comprehensive beach and weather data including:
- Beach details and characteristics
- Storm Glass API data for swell and wind conditions
- Tidal information and predictions
- Real-time weather updates

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── BeachSearch.tsx  # Beach selection interface
│   ├── Map.tsx         # Interactive map component
│   ├── SwellVisualization.tsx  # Swell data charts
│   ├── TidalVisualization.tsx  # Tide information
│   └── WindVisualization.tsx   # Wind data display
├── context/            # React context providers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🚀 Available Scripts

- `pnpm run dev` - Start development server with Turbopack
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint

## 🌐 Deployment

The easiest way to deploy this Next.js app is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

