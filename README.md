# Visitor Management System (VMS)

A modern, secure, and responsive web-based Visitor Management System designed to streamline visitor registration, check-ins/check-outs, and appointment scheduling for offices and corporate buildings. Built with a React frontend (using Tailwind CSS v4) and a Node.js/Express backend (using SQLite).

## Key Features

- 👤 **Visitor Registration**: Clean onboarding interface for visitors to register their details.
- 🔑 **Role-Based Authentication**: Secure access control with separate dashboards for **Visitors**, **Hosts (Employees)**, and **Administrators**.
- 📅 **Appointment Management**: Booking and approval workflows where hosts can approve or decline visitor requests.
- 📱 **QR Code-Based Check-in/Check-out**: Generate custom QR codes for registered visitors to enable quick scans for check-in and check-out.
- 🔔 **Host Notification System**: Simulated real-time notifications for hosts when their visitor check-in occurs.
- 📊 **Admin Dashboard & Analytics**: Visual insights showing check-in volumes, pending requests, active visitors, and visit logs.
- 🔒 **Secure Authentication**: JWT-based secure sessions with hashed passwords.

## Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS v4, Lucide React (Icons)
- **Backend**: Node.js, Express.js
- **Database**: SQLite (Zero-setup file-based database)
- **Authentication**: JWT (JSON Web Tokens), BcryptJS (Password hashing)

## Project Structure

```text
├── backend/            # Express.js Server & SQLite Database
│   ├── database.sqlite # SQLite database file (generated automatically)
│   ├── package.json    # Backend dependencies & scripts
│   └── server.js       # Main server and API endpoints
├── frontend/           # React App
│   ├── src/            # React source code (components, pages, styles)
│   ├── index.html      # Frontend HTML layout
│   ├── package.json    # Frontend dependencies & scripts
│   └── vite.config.js  # Vite configuration with Tailwind CSS v4
├── README.md           # Documentation
└── package.json        # Root scripts for running the app
```

## Setup and Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### Quick Start

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/surajsonwane1207/vms.git
   cd vms
   ```

2. Install dependencies for the backend and frontend:
   ```bash
   # From the project root, you can install packages inside directories:
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Run both the backend and frontend servers:
   - Run Backend (starts at `http://localhost:5000`):
     ```bash
     cd backend
     npm run dev
     ```
   - Run Frontend (starts at `http://localhost:5173`):
     ```bash
     cd frontend
     npm run dev
     ```

## License

This project is licensed under the MIT License.
