# 🚀 ControlaPAG - Payment Management API

![NestJS](https://img.shields.io/badge/NestJS-API-red?style=for-the-badge&logo=nestjs)
![AWS](https://img.shields.io/badge/AWS-Cloud-orange?style=for-the-badge&logo=amazon-aws)
![TypeScript](https://img.shields.io/badge/TypeScript-Backend-blue?style=for-the-badge&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Containerization-blue?style=for-the-badge&logo=docker)

---

## 🎯 Project Objective

**ControlaPAG** is a backend API for a web platform designed to centralize and
automate service and billing management for service providers, with a special
focus on individual micro-entrepreneurs (MEIs) in Brazil.

> **Key benefits:**
>
> - Replaces manual controls (notebooks, spreadsheets)
> - Reduces payment delinquency through automation
> - Professionalizes financial management for small businesses

The solution connects providers and clients, offering a digital environment to
manage the entire service cycle:  
**Register services and clients → Automatically generate recurring and one-time
charges.**

---

## 🏗️ Technical Structure

### ⚙️ API (Backend)

- **Framework:** [NestJS](https://nestjs.com/) (Node.js/TypeScript)
- **Modular Architecture:**
  - **Auth:** User authentication and registration
  - **User, Provider, Client:** Profile management
  - **Service, Enrollment:** Service registration and client linking
  - **Charge, ChargeSchedule, ChargeException:** Core logic for scheduling and
    creating charges

### ☁️ Infrastructure as Code (IaC)

- **Folder:** `iac/`
- **AWS Provisioning via Terraform:**
  - Networking (VPC, Subnets)
  - PostgreSQL Database (RDS)
  - Container Orchestration (ECS Fargate)
  - Docker Image Repository (ECR)
  - Serverless Functions (Lambda) and scheduling (EventBridge)

### 🐳 Containerization

- **Dockerfile:** Packages the API for consistent deployment on ECS.

### 🔄 CI/CD Automation

- **GitHub Actions:**
  - Automated build, test, and deployment
  - Manual deployment with validation (`plan`) and execution (`apply`)

### ⚡ Serverless Function (Lambda)

- **Folder:** `lambda/`
- **Purpose:** Triggers daily charge creation, keeping this logic decoupled from
  the main API.

---

## 📂 Project Structure

```
api-controlapag/
│
├── src/                # API source code (NestJS)
├── iac/                # Terraform scripts for AWS
├── lambda/             # Serverless function for daily charges
├── Dockerfile          # API containerization
├── .github/workflows/  # CI/CD workflows (GitHub Actions)
└── README.md           # This file
```

---

## 🧑‍💻 About the Author

Developed by **Douglas R. J.**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/dg-junior/)

---

> **ControlaPAG** — Simplifying financial management for those who make it
> happen! 🚀
