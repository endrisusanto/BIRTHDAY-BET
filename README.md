# Neon Obsidian - Birthday Gift Bet

A modern, neon-themed betting application for voting on birthday gifts. Built with React, Tailwind CSS, and TypeScript.

## Features

- **Neon Obsidian UI**: Dark theme with vibrant neon accents.
- **Betting System**: Pool-based betting on gift candidates.
- **Admin Dashboard**: Manage candidates, view all bets, and analytics.
- **User Profiles**: Track your betting history and contribution stats.
- **Responsive**: Works on mobile, tablet, and desktop.
- **Persistence**: Uses LocalStorage to simulate a database.

## Deployment

The application is containerized using Docker and configured to run on port **6969**.

### Prerequisites

- Docker installed on your machine.

### Build and Run

1.  **Build the Docker image:**
    ```bash
    docker build -t birthday-bet .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 6969:6969 birthday-bet
    ```

3.  **Access the app:**
    Open your browser and go to `http://localhost:6969`.

## Admin Access

- **Password**: `admin123`
- Use the Lock icon or the '+' button to access admin features.

## Technologies

- **Frontend**: React, TypeScript, Lucide React
- **Styling**: Tailwind CSS
- **Container**: Nginx, Docker
