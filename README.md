# Global AI Tool Popularity & Trends Dashboard

Visualize country-wise AI tool popularity, track emerging AI tools, and manage data via a secure admin panel.

## Features
- **Global Dashboard**: Interactive map/graphs showing AI tool usage by country.
- **Tool Catalog**: Browse top AI tools with details.
- **Admin Panel**: Secure area to add/update tools and country data.
- **REST API**: Backend API serving data.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Auth**: JWT, bcrypt

## Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd ai-tools-dashboard
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Environment Variables**
    Create `backend/.env` with:
    ```env
    NODE_ENV=development
    PORT=5000
    MONGO_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=admin123
    ```

### Data Seeding
1.  Place Kaggle CSV files in `datasets/raw/` (see `backend/scripts/processDatasets.js` for filenames).
2.  Run seeding script:
    ```bash
    cd backend
    npm run data:import
    ```

### Running the App

1.  **Start Backend**
    ```bash
    cd backend
    npm run dev
    ```

2.  **Start Frontend**
    ```bash
    cd frontend
    npm run dev
    ```

## API Endpoints
- `GET /api/countries`: List countries
- `GET /api/tools`: List AI tools
- `POST /api/admin/login`: Admin login
