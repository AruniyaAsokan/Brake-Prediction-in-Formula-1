# 🏎️ **Brake Prediction in Formula 1 – Hybrid Digital Twin**

*A real-time brake system simulator combining Physics Models, Bi-LSTM Machine Learning, Telemetry Replay, and 3D Visualization.*

---

## 🚀 Overview

This project is a **Hybrid Digital Twin** of a Formula 1 brake system, implemented as an interactive web application using **React, TypeScript, Zustand, and Three.js**.

It integrates three major components:

1. **Physics-Based Brake Model**
   Simulates brake temperature, heat generation, cooling, wear, thermal stress, and remaining laps.

2. **Bi-LSTM Machine Learning Model**
   Predicts temperature, wear rate, and laps remaining using historical telemetry patterns.

3. **Hybrid Fusion Engine**
   Combines physics and ML outputs, computes confidence weights, and flags anomalies when the two diverge.

These are visualized through:

* A **3D brake assembly** rendered with react-three-fiber
* Live sensor dashboards and system controls
* A **comparison dashboard** for Physics vs LSTM vs GRU vs TCN vs Hybrid
* Telemetry replay using FastF1 or HuggingFace datasets
* Synthetic race simulations with a custom test data generator

This project demonstrates the complete digital twin pipeline—from inputs → physics → ML → hybrid inference → visualization.

---

## 🎯 Key Features

### **1. Real-Time Physics Model**

Simulates the core thermodynamic and wear behavior of an F1 brake system, computing:

* Brake disc temperature
* Heat generation during braking
* Convective cooling
* Pad wear and wear rate
* Thermal stress
* Predicted laps remaining

The physics model uses realistic motorsport constants and thresholds.

---

### **2. Bi-LSTM Machine Learning Model**

A browser-runnable sequence model that processes telemetry histories such as:

* Wheel speed (RPM)
* Brake pressure
* Ambient temperature
* Pad thickness

Outputs:

* Predicted brake temperature
* Wear rate
* Remaining laps

The predictions are scaled to realistic F1 ranges (e.g., 25–1200°C).

---

### **3. Hybrid Digital Twin**

A fusion engine that:

* Runs both the PhysicsModel and LSTMModel
* Computes weighted predictions
* Adapts weights based on operating conditions
* Detects anomalies by comparing physics vs ML divergence

This approach blends model-based understanding with data-driven adaptivity.

---

### **4. Race Simulation & Telemetry Integration**

Includes two data modes:

#### **Synthetic Lap Simulation**

* Generates multi-lap braking scenarios
* Feeds data to all five models (Physics / LSTM / GRU / TCN / Hybrid)
* Computes accuracy, RMSE, response time, and anomaly metrics

#### **FastF1 / HuggingFace Telemetry Replay**

* Load real F1 session telemetry (e.g., Verstappen Miami 2024)
* Convert to system format and run predictions in real time

---

### **5. 3D Visualization**

A react-three-fiber visualization of the brake system, featuring:

* Spinning brake disc linked to wheel speed
* Heat-based color glow
* Sensor labels with explanations
* Smooth animations and lighting

---

### **6. Fully Interactive UI**

Built using **shadcn/ui**, **Tailwind**, and **Zustand**, the app includes:

* Live sensor cards (temperature, pressure, wear, wheel speed)
* Sliders to adjust system inputs
* Simulation start/stop/reset controls
* Telemetry loading buttons
* Physics explanation panel
* Model comparison panel
* Accuracy and response time summaries

---

## 🧠 System Architecture

```
┌──────────────────────────────┐
│        User Inputs           │
│ (sensors, sliders, telemetry)│
└───────────────┬──────────────┘
                │
     ┌──────────▼─────────┐
     │   Zustand Store    │
     │  (Global State)    │
     └──────────┬─────────┘
                │
 ┌──────────────▼───────────────────┐
 │       Hybrid Digital Twin        │
 │  ┌──────────────┬─────────────┐ │
 │  │ PhysicsModel │  LSTMModel  │ │
 │  └──────────────┴─────────────┘ │
 │       Fusion + Anomaly Score     │
 └───────────────┬──────────────────┘
                 │
     ┌───────────▼───────────┐
     │  UI Visualization      │
     │ (3D model, charts, UI) │
     └────────────────────────┘
```

---

## 📂 Project Structure

```
src/
├── models/                 # Physics, LSTM, GRU, TCN, HybridTwin
├── store/                  # Zustand global state
├── components/             # 3D models, UI panels, dashboards
├── evaluation/             # Test data generator + evaluation tools
├── data/                   # FastF1 + HuggingFace parsers
├── pages/                  # Main application pages
├── hooks/                  # Custom React hooks
└── utils/                  # Helpers and utilities

api/                        # HuggingFace proxy (serverless)
public/                     # Assets
vite.config.ts              # Build configuration
```

---

## 🛠️ Tech Stack

### **Frontend**

* React
* TypeScript
* Vite
* Zustand
* Tailwind CSS + shadcn/ui
* React Router
* react-three-fiber + drei
* recharts

### **Modeling**

* Custom thermodynamic physics engine
* Bi-LSTM inference engine
* GRU and TCN comparative models
* Hybrid physics + ML fusion

### **Telemetry**

* FastF1 CSV ingestion
* HuggingFace dataset loader
* Serverless API proxy

---

## ▶️ Running the Project

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

## 📄 Acknowledgments

This project was developed manually with engineering effort, but certain parts of the implementation, debugging, and structuring were assisted using **Cursor AI** and **Lovable AI** to accelerate development and improve code quality.

---
