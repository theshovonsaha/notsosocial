# NotSoSocial Media

<div align="center">
  <img src="public/logo.png" alt="NotSoSocial Logo" width="200"/>
  <h3><i>Schedule real hangouts, not endless scrolling</i></h3>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#installation">Installation</a> •
    <a href="#demo">Demo</a> •
    <a href="#roadmap">Roadmap</a>
  </p>
</div>

## About The Project

NotSoSocial Media is a platform designed to counter the typical social media experience. Instead of encouraging passive content consumption, we help people connect in real life by matching availability and facilitating in-person meetups.

<div align="center">
  <img src="public/screenshot.png" alt="Application Screenshot" width="600"/>
</div>

## Features

- **Availability Matching**: Users set their free time slots, and the app finds overlaps with friends
- **Hangout Scheduling**: Create and manage hangout requests with multiple participants
- **Real-time Chat**: Group conversations that activate once all participants accept a hangout
- **User Profiles**: Clean, minimalist profiles focused on availability rather than content
- **Authentication**: Secure user authentication with email/password
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **State Management**: Zustand for lightweight, simple state management
- **Styling**: Tailwind CSS for utility-first styling
- **Routing**: React Router v6
- **Backend-as-a-Service**: Supabase (PostgreSQL, Authentication, Storage)
- **Realtime**: Supabase Realtime for chat functionality
- **Icons**: Lucide React for consistent, clean icons
- **Date Management**: date-fns for date manipulation

## Architecture

### Frontend Architecture

The application follows a modern React component architecture with Zustand for state management:

```
src/
├── components/        # Reusable UI components
├── pages/             # Full page components
├── stores/            # Zustand stores for state management
├── lib/               # Utility functions and services
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
├── assets/            # Static assets
└── App.tsx            # Main application component
```

### Database Schema

The Supabase PostgreSQL database includes the following main tables:

- `users`: User profiles and authentication data
- `availability`: User time slot availability
- `hangout_requests`: Scheduled hangout events
- `hangout_participants`: Participants for each hangout
- `group_chats`: Chat groups for accepted hangouts
- `messages`: Individual chat messages

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/notsosocial.git
   cd notsosocial
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Demo

Check out the live demo at [notsosocial.app](https://notsosocial.app)

To try the demo with a test account:

- Email: demo@example.com
- Password: demo123

## Key Implementation Details

### Availability Matching Algorithm

The availability matching system finds overlapping free time slots between users:

```typescript
export const findOverlappingTimeSlots = async (user1Id, user2Id) => {
  // Fetch both users' time slots
  const [user1Slots, user2Slots] = await Promise.all([
    fetchTimeSlots(user1Id),
    fetchTimeSlots(user2Id),
  ]);

  // Find overlapping slots with O(n²) algorithm
  return user1Slots.filter((slot1) =>
    user2Slots.some(
      (slot2) =>
        slot1.day_of_week === slot2.day_of_week &&
        isTimeOverlapping(slot1, slot2)
    )
  );
};
```

### Real-time Chat Implementation

Real-time chat is implemented using Supabase's Realtime feature:

```typescript
// Subscribe to new messages
supabase
  .channel(`chat-${chatId}`)
  .on(
    'INSERT',
    { event: 'message', schema: 'public', table: 'messages' },
    (payload) => {
      // Handle new message
      addMessage(payload.new);
    }
  )
  .subscribe();
```

## Development Practices

- **TypeScript**: Strongly typed codebase with interfaces for all data structures
- **Component Reusability**: Components designed for reusability and composition
- **Performance Optimization**: Memoization and optimized renders
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Mobile-first approach with Tailwind
- **Testing**: Unit and integration tests with React Testing Library

## Roadmap

- [ ] Activity suggestions based on location and preferences
- [ ] Calendar integration with Google Calendar/Apple Calendar
- [ ] Location-based availability matching
- [ ] Notification system (email, push)
- [ ] Mobile apps (React Native)

## Contact

Shovon Saha - [theshovonsaha@gmail.com](mailto:theshovonsaha@gmail.com)

Project Link: [https://github.com/theshovon/notsosocial](https://github.com/theshovon/notsosocial)

---

<div align="center">
  <p>Built with ❤️ to encourage real human connection</p>
</div>
