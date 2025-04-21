# Discord Feed - Project Structure Plan

```
discordfeed/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── webhook/        # Discord webhook endpoints
│   │   └── messages/       # Message endpoints
│   ├── feed/               # Feed page components
│   ├── auth/               # Authentication pages
│   └── settings/           # User settings pages
├── components/             # Reusable components
│   ├── ui/                 # UI components (buttons, inputs, etc.)
│   ├── feed/               # Feed-specific components
│   ├── auth/               # Authentication components
│   └── layout/             # Layout components
├── lib/                    # Utility functions
│   ├── api/                # API client functions
│   ├── auth/               # Authentication utilities
│   ├── discord/            # Discord-specific utilities
│   └── db/                 # Database utilities
├── types/                  # TypeScript type definitions
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma schema
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```
