# ⚡ TaskFlow — Real-Time Task Manager

A production-ready full-stack app built with **React + FastAPI + PostgreSQL**, deployable to **Kubernetes via ArgoCD (GitOps)**.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Minikube Cluster                   │
│                                                     │
│  ┌──────────────┐    ┌─────────────────────────┐   │
│  │   Frontend   │    │        Backend          │   │
│  │  React+nginx │───▶│       FastAPI           │   │
│  │  (2 replicas)│    │     (2 replicas)        │   │
│  └──────┬───────┘    └──────────┬──────────────┘   │
│         │                       │ WebSocket         │
│         │            ┌──────────▼──────────────┐   │
│         │            │       PostgreSQL         │   │
│         │            │    (PVC: 1Gi storage)    │   │
│         │            └─────────────────────────┘   │
│         │                                           │
│  ┌──────▼───────────────────────────────────────┐  │
│  │           Nginx Ingress Controller            │  │
│  │            taskflow.local → :80               │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         ↑
    ArgoCD watches GitHub repo and syncs automatically
```

## 📁 Project Structure

```
taskflow/
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx            # Main application
│   │   ├── api/tasks.js       # Axios API client
│   │   ├── hooks/
│   │   │   └── useWebSocket.js  # Real-time WS hook
│   │   └── components/
│   │       ├── TaskCard.jsx
│   │       ├── TaskModal.jsx
│   │       ├── StatsBar.jsx
│   │       └── LiveIndicator.jsx
│   ├── nginx.conf             # nginx + reverse proxy config
│   └── Dockerfile             # Multi-stage build
│
├── backend/                   # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py            # App entrypoint + CORS
│   │   ├── database.py        # SQLAlchemy engine
│   │   ├── schemas.py         # Pydantic models
│   │   ├── websocket_manager.py  # WS broadcast manager
│   │   ├── models/task.py     # DB model
│   │   └── routers/
│   │       ├── tasks.py       # CRUD endpoints
│   │       └── websocket.py   # WS endpoint
│   ├── requirements.txt
│   └── Dockerfile
│
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yaml
│   ├── ingress.yaml
│   ├── postgres/
│   │   ├── secret.yaml        # DB credentials
│   │   ├── pvc.yaml           # Persistent storage
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── frontend/
│       ├── deployment.yaml
│       └── service.yaml
│
├── argocd/
│   └── application.yaml       # ArgoCD app definition
│
└── docker-compose.yml         # Local dev (no K8s needed)
```

---

## 🚀 Deployment Guide

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker | 24+ | https://docs.docker.com/get-docker/ |
| Minikube | 1.32+ | https://minikube.sigs.k8s.io/docs/start/ |
| kubectl | 1.28+ | https://kubernetes.io/docs/tasks/tools/ |
| ArgoCD CLI | 2.9+ | https://argo-cd.readthedocs.io/en/stable/cli_installation/ |

---

### Step 1 — Start Minikube

```bash
# Start with enough resources
minikube start --cpus=4 --memory=4096 --driver=docker

# Enable the nginx ingress addon
minikube addons enable ingress

# Verify everything is running
minikube status
kubectl get nodes
```

---

### Step 2 — Build & Push Docker Images

```bash
# Option A: Use Minikube's internal Docker daemon (no registry needed)
eval $(minikube docker-env)

docker build -t taskflow-backend:latest ./backend
docker build -t taskflow-frontend:latest ./frontend

# IMPORTANT: When using minikube's docker-env, set imagePullPolicy: Never
# in k8s/backend/deployment.yaml and k8s/frontend/deployment.yaml
# Replace: imagePullPolicy: Always
# With:    imagePullPolicy: Never
# And update image name to: taskflow-backend:latest (no username prefix)
```

```bash
# Option B: Push to Docker Hub (recommended for ArgoCD)
docker build -t YOUR_USERNAME/taskflow-backend:latest ./backend
docker build -t YOUR_USERNAME/taskflow-frontend:latest ./frontend

docker push YOUR_USERNAME/taskflow-backend:latest
docker push YOUR_USERNAME/taskflow-frontend:latest

# Update image names in:
# - k8s/backend/deployment.yaml
# - k8s/frontend/deployment.yaml
```

---

### Step 3 — Push Code to GitHub

```bash
# Initialize git repo
git init
git add .
git commit -m "feat: initial TaskFlow app"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git branch -M main
git push -u origin main
```

---

### Step 4 — Install ArgoCD on Minikube

```bash
# Create argocd namespace and install
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD pods to be ready (takes ~2 minutes)
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=120s

# Access the ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Open: https://localhost:8080
# Username: admin
# Password: (output from above command)
```

---

### Step 5 — Update ArgoCD Application YAML

Edit `argocd/application.yaml`:
```yaml
source:
  repoURL: https://github.com/YOUR_GITHUB_USERNAME/taskflow  # 👈 your repo
```

---

### Step 6 — Deploy TaskFlow via ArgoCD

```bash
# Apply the ArgoCD application
kubectl apply -f argocd/application.yaml

# Watch the sync happen!
kubectl get application taskflow -n argocd -w

# Or use the CLI:
argocd login localhost:8080 --username admin --insecure
argocd app get taskflow
argocd app sync taskflow
```

ArgoCD will now automatically apply everything in the `k8s/` folder to your cluster.

---

### Step 7 — Access the App

```bash
# Add local DNS entry for taskflow.local
echo "$(minikube ip) taskflow.local" | sudo tee -a /etc/hosts

# Open in browser
open http://taskflow.local
```

---

## 🔄 GitOps Workflow (The Magic!)

This is how ArgoCD's GitOps flow works for day-to-day changes:

```
You push code to GitHub
        ↓
ArgoCD detects the change (polls every 3 minutes, or webhook instantly)
        ↓
ArgoCD compares desired state (Git) vs actual state (cluster)
        ↓
ArgoCD applies the diff automatically
        ↓
Your cluster is updated! ✅
```

**Try it yourself:**

```bash
# Scale the backend to 3 replicas:
# 1. Edit k8s/backend/deployment.yaml: replicas: 3
# 2. git add . && git commit -m "scale: backend to 3 replicas" && git push
# 3. Watch ArgoCD sync it automatically!

kubectl get pods -n taskflow -w
```

---

## 💻 Local Development (Docker Compose)

No Kubernetes needed for development:

```bash
docker compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | List all tasks (filter by completed, priority) |
| POST | `/api/tasks/` | Create a new task |
| GET | `/api/tasks/{id}` | Get a task |
| PATCH | `/api/tasks/{id}` | Update a task |
| DELETE | `/api/tasks/{id}` | Delete a task |
| WS | `/ws/tasks` | WebSocket for real-time events |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |

---

## 🧪 Useful kubectl Commands

```bash
# See all resources in taskflow namespace
kubectl get all -n taskflow

# Check pod logs
kubectl logs -f deployment/taskflow-backend -n taskflow
kubectl logs -f deployment/taskflow-frontend -n taskflow

# Describe a deployment (useful for debugging)
kubectl describe deployment taskflow-backend -n taskflow

# Shell into a pod
kubectl exec -it deployment/taskflow-backend -n taskflow -- /bin/bash

# Check postgres data
kubectl exec -it deployment/postgres -n taskflow -- psql -U taskflow -d taskflow -c "\dt"

# Check ArgoCD app status
kubectl get application taskflow -n argocd -o yaml
```

---

## 🧠 What You're Learning

| Concept | Where it's used |
|---------|----------------|
| **K8s Deployments** | All 3 services (frontend, backend, postgres) |
| **K8s Services** | ClusterIP for internal communication |
| **Ingress** | Single entry point, routing to services |
| **Secrets** | Postgres credentials |
| **PVC** | Postgres persistent storage |
| **Health Probes** | readinessProbe + livenessProbe on backend |
| **Resource Limits** | requests/limits on all containers |
| **ArgoCD GitOps** | Auto-sync from GitHub |
| **WebSockets on K8s** | WS upgrade headers in ingress |
| **Multi-stage Docker** | Frontend: node build → nginx serve |
