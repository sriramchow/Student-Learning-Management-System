# Questor — Student Learning Management System

A full-stack web-based Learning Management System (LMS) that gives students and administrators a centralized place to manage courses, track progress, and interact with an AI-powered learning assistant. Built as a four-person team project for CSCE 3444 / 5430 Software Engineering at the University of North Texas (Spring 2025).

🚀 **Live Demo:** [sriram-lms.vercel.app](https://sriram-lms.vercel.app)

> **Note:** The deployed demo uses a free Firebase tier and the AI chatbot integration requires an Anthropic API key that is no longer active in this deployment — all other features (authentication, dashboards, navigation, course browsing) are fully functional. The complete chatbot implementation is in the source code.

---

## What it does

The platform supports two user roles — **Student** and **Admin** — each with their own dashboard. Core workflows:

- **For students:** register/login, browse and enroll in courses, save courses to a wishlist, access course materials and videos, track progress through modules, participate in discussion forums, submit feedback, receive notifications, get a completion certificate, and ask questions to an AI-powered chatbot for instant academic support.
- **For admins:** centralized dashboard with system-wide statistics, user management (create, update, deactivate, manage roles), course management (create, modify, archive), discussion forum moderation, and feedback review.

---

## Tech stack

- **Frontend:** React 18, JavaScript, Tailwind CSS, Vite
- **Backend / Database:** Firebase Firestore (NoSQL cloud database)
- **Authentication:** Firebase Auth
- **AI Chatbot:** Anthropic Claude API
- **Deployment:** Vercel
- **Version Control:** Git, GitHub

---

## Features

- Login & Registration with role-based access (Student / Admin)
- Personalized User Dashboard
- AI Learning Assistant chatbot ("Questor Bot") powered by Anthropic Claude
- Course browsing, enrollment, and structured content access with sections and embedded video lessons
- Wishlist for saving courses for later enrollment
- User profile management (edit info, change picture, manage privacy)
- Content search across courses and study materials
- Real-time notification system
- User feedback submission for courses and instructors
- Progress tracking with completion percentages
- Discussion forum for student-instructor interaction
- Certificate system on course completion
- Admin dashboard with platform statistics
- User and course management for admins

---

## Architecture

A single-page React application served from Vercel, with all data persisted in Firebase Firestore (NoSQL document database). Authentication and user sessions are handled by Firebase Auth. The AI chatbot makes client-side requests to the Anthropic Claude API. Tailwind CSS handles styling, and Vite is used for fast development builds.

```
React (Vite) UI
      |
      v
Firebase Auth ----> Firebase Firestore (users, courses, progress, feedback, discussions)
      |
      v
Anthropic Claude API (for the AI chatbot)
```

---

## Data model

Key Firestore collections:

- `users` — authenticated users with `isAdmin`, `bio`, `interests`, `joinDate`, `profileImage`
- `courses` — course documents with `description`, `sections` (array of sections, each containing `title` and `videos` with YouTube embed links)
- `certificates` — generated on course completion
- `discussionGroups` & `discussionPosts` — forum content
- `feedback` — user feedback submissions
- `notifications` — per-user notifications

---

## My contribution

As part of the four-person team, my primary contribution was the **product requirements specification** — the foundational document that defined what the system should do.

Specifically, I authored:

- **15 functional requirements:** Login & Registration, User Dashboard, AI Assistant Chatbot, Course Accessing, User Wishlist Management, User Profile Management, Content Search, Notification System, User Feedback System, Progress Tracking, Discussion Forum, Certificate System, Admin Dashboard, User Management (Admin), and Course Management (Admin) — each with clear descriptions, user stories, and release tagging.

- **Non-functional requirements** across four pillars:
  - **Usability:** UI consistency, accessibility (alt text, screen-reader friendliness)
  - **Reliability & Availability:** automated backups, target uptime, peak-load handling
  - **Performance:** response-time goals across devices
  - **Security:** session timeouts, role-based access, password encryption, database access control

I also collaborated with the team on implementing core features including authentication, role-based dashboards, and chatbot integration.

---

## Repo structure

```
.
├── src/
│   ├── components/      # Reusable React components (chatbot widget, nav, cards)
│   ├── pages/           # Page-level views (Home, Courses, Wishlist, Dashboard, Admin)
│   ├── services/        # Firebase + Anthropic Claude service modules
│   └── App.jsx
├── public/              # Static assets
├── docs/
│   └── requirements_specification.pdf  # Original SRS document
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## Try the demo

1. Visit **[sriram-lms.vercel.app](https://sriram-lms.vercel.app)**
2. Register a new account (use any email like `test@example.com`) or browse as a guest
3. Explore the navigation: Home, Courses, Wishlist, Notifications, Discussions
4. Click the chatbot icon in the bottom-right to see the "Questor Bot" UI (note: API integration currently disabled)

---

## Team

Four-person team — Sriram Chowdary Vundavalli, Nikhil Kommireddi, Baladitya Madaraboyna, Sri Durga Viswa Venkata Sai Varma Challagali.

Each team member's individual contribution is documented in the product requirements specification (`docs/`).
