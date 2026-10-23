import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import env from './env';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EventBook API — Enterprise Event Booking Platform',
    version: '1.0.0',
    description: `
**EventBook** is a production-grade backend engineered with **Layered Clean Architecture**, decoupling HTTP controllers, business domain services, and repository data-access layers.

### Key Capabilities:
- **JWT & Role-based Access Control (RBAC)**: User & Admin permission tiers with OTP email verification.
- **Atomic Concurrency Protection**: Race-condition prevention on booking slots with atomic database reservations.
- **Stripe Payment Gateway**: PaymentIntent generation, webhook signature verification, and automated refund management.
- **Asynchronous Event Architecture**: Non-blocking email notifications and state change broadcasts.
    `,
    contact: {
      name: 'EventBook Engineering Team',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Server (Auto-detected — works on Localhost, Render, AWS, etc.)',
    },
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT Bearer token obtained from /api/auth/login or /api/auth/verify-otp',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          phone: { type: 'string', example: '+919876543210' },
        },
      },
      Service: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d2' },
          title: { type: 'string', example: 'Grand Palace Banquet Hall' },
          category: {
            type: 'string',
            enum: ['venue', 'hotel', 'caterer', 'cameraman', 'dj', 'decorator', 'other'],
            example: 'venue',
          },
          description: { type: 'string', example: 'Luxurious AC banquet hall for up to 500 guests' },
          pricePerDay: { type: 'number', example: 45000 },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string', example: 'Kochi' },
              state: { type: 'string', example: 'Kerala' },
              address: { type: 'string', example: 'MG Road, Marine Drive' },
            },
          },
          images: {
            type: 'array',
            items: { type: 'string' },
            example: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
          },
          isFree: { type: 'boolean', example: false },
          bookingMode: { type: 'string', enum: ['date_range', 'single_day', 'time_slot'], example: 'date_range' },
          rating: { type: 'number', example: 4.8 },
          totalReviews: { type: 'number', example: 24 },
          isActive: { type: 'boolean', example: true },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d3' },
          user: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
          service: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d2' },
          startDate: { type: 'string', format: 'date-time', example: '2026-11-15T00:00:00.000Z' },
          endDate: { type: 'string', format: 'date-time', example: '2026-11-16T00:00:00.000Z' },
          totalDays: { type: 'number', example: 2 },
          totalPrice: { type: 'number', example: 90000 },
          status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'], example: 'confirmed' },
          paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'refunded', 'partially_refunded'], example: 'paid' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health Check Endpoint',
        description: 'Returns the current server status and environment timestamp.',
        responses: {
          200: {
            description: 'API is running properly',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'EventBook API is running' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Initiate User Registration',
        description: 'Submits user registration details and dispatches a 6-digit verification OTP to the provided email address.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                  phone: { type: 'string', example: '+919876543210' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OTP sent to email',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'OTP sent to your email. Please verify to complete registration.' },
                    email: { type: 'string', example: 'john@example.com' },
                  },
                },
              },
            },
          },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify OTP and Complete Registration',
        description: 'Validates the OTP sent to email and returns the authenticated user session with a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  otp: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User successfully registered and authenticated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with credentials',
        description: 'Authenticates a user via email and password, returning a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get Authenticated User Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Authenticated user profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized — missing or invalid JWT' },
        },
      },
    },
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'Browse & Search Services',
        description: 'Get paginated list of active services with filtering by category, search keywords, price, and city.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'rating'] } },
        ],
        responses: {
          200: {
            description: 'List of matching services with pagination',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Service' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 45 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 12 },
                        totalPages: { type: 'integer', example: 4 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Services'],
        summary: 'Create New Service (Admin)',
        security: [{ BearerAuth: [] }],
        description: 'Creates a new event service. Supports multi-image upload via multipart/form-data to Cloudinary.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'category', 'description', 'pricePerDay'],
                properties: {
                  title: { type: 'string' },
                  category: { type: 'string', enum: ['venue', 'hotel', 'caterer', 'cameraman', 'dj', 'decorator', 'other'] },
                  description: { type: 'string' },
                  pricePerDay: { type: 'number' },
                  location: { type: 'string', description: 'JSON string: { city, state, address }' },
                  contact: { type: 'string', description: 'JSON string: { phone, email, website }' },
                  images: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Service created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Service' },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden — requires Admin role' },
        },
      },
    },
    '/api/services/{id}': {
      get: {
        tags: ['Services'],
        summary: 'Get Service Details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Service details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Service' },
                  },
                },
              },
            },
          },
          404: { description: 'Service not found' },
        },
      },
      delete: {
        tags: ['Services'],
        summary: 'Soft Delete Service (Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Service removed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Service removed successfully' },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden — requires Admin role' },
          404: { description: 'Service not found' },
        },
      },
    },
    '/api/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create a Booking',
        security: [{ BearerAuth: [] }],
        description: 'Creates a booking with atomic concurrency reservation. Returns a Stripe clientSecret for paid bookings or immediate confirmation for free services.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['serviceId', 'startDate', 'endDate'],
                properties: {
                  serviceId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d2' },
                  startDate: { type: 'string', format: 'date', example: '2026-11-20' },
                  endDate: { type: 'string', format: 'date', example: '2026-11-22' },
                  notes: { type: 'string', example: 'Wedding reception for 200 guests' },
                  guestCount: { type: 'integer', example: 200 },
                  timeSlotId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Booking initiated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Booking' },
                    clientSecret: { type: 'string', nullable: true, example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJWeWMfqSamkztpWipMotio' },
                    message: { type: 'string', example: 'Proceeding to payment...' },
                  },
                },
              },
            },
          },
          409: { description: 'Conflict — Dates already booked or duplicate pending booking exists' },
        },
      },
      get: {
        tags: ['Bookings'],
        summary: 'Get All Bookings (Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 15 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] } },
        ],
        responses: {
          200: {
            description: 'List of all system bookings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                    pagination: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/bookings/my': {
      get: {
        tags: ['Bookings'],
        summary: "Get Current User's Bookings",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'User booking history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/bookings/{id}/cancel': {
      patch: {
        tags: ['Bookings'],
        summary: 'Cancel Booking',
        security: [{ BearerAuth: [] }],
        description: 'Cancels an active booking, rolls back date reservations, and issues automatic Stripe refunds in accordance with the service cancellation policy.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: 'Event rescheduled' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Booking cancelled and refund processed if eligible',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    refundIssued: { type: 'boolean', example: true },
                    refundAmount: { type: 'number', example: 45000 },
                    message: { type: 'string', example: 'Booking cancelled. Full refund of ₹45,000 has been issued.' },
                  },
                },
              },
            },
          },
          400: { description: 'Booking already cancelled or completed' },
        },
      },
    },
    '/api/payments/summary': {
      get: {
        tags: ['Payments'],
        summary: 'Get Revenue & Analytics Summary (Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month', 'year', 'all'], default: 'month' } },
        ],
        responses: {
          200: {
            description: 'Financial dashboard statistics and metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalRevenue: { type: 'number', example: 345000 },
                        totalBookings: { type: 'integer', example: 12 },
                        totalRefunds: { type: 'number', example: 15000 },
                        netRevenue: { type: 'number', example: 330000 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  // Mount Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'EventBook API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  }));

  // Expose raw JSON spec for external tooling (Postman, Insomnia)
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
