import { factories } from '@strapi/strapi';
import OpenAI from 'openai';

export default factories.createCoreController('api::trip.trip', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be authenticated to view trips');
    }

    const trips = await strapi.entityService.findMany('api::trip.trip', {
      filters: {
        owner: user.id,
      },
      populate: ['destination', 'owner'],
    });

    return {
      data: trips.map((trip: any) => ({
        id: trip.id,
        attributes: trip,
      })),
      meta: {
        pagination: {
          page: 1,
          pageSize: trips.length || 25,
          pageCount: 1,
          total: trips.length,
        },
      },
    };
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be authenticated to view trips');
    }

    const response = await super.findOne(ctx);
    if ((response as any)?.data?.attributes?.owner?.data?.id !== user.id) {
      return ctx.forbidden('You can only access your own trips');
    }

    return response;
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be authenticated to create trips');
    }

    ctx.request.body = {
      data: {
        ...(ctx.request.body?.data || ctx.request.body),
        owner: user.id,
      },
    };

    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be authenticated to update trips');
    }

    // Ensure only owner can update
    const existing: any = await strapi.entityService.findOne('api::trip.trip', ctx.params.id, {
      populate: ['owner'],
    });

    if (!existing || existing.owner?.id !== user.id) {
      return ctx.forbidden('You can only update your own trips');
    }

    ctx.request.body = {
      data: {
        ...(ctx.request.body?.data || ctx.request.body),
        owner: user.id,
      },
    };

    return await super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be authenticated to delete trips');
    }

    const existing: any = await strapi.entityService.findOne('api::trip.trip', ctx.params.id, {
      populate: ['owner'],
    });

    if (!existing || existing.owner?.id !== user.id) {
      return ctx.forbidden('You can only delete your own trips');
    }

    return await super.delete(ctx);
  },

  /**
   * POST /api/trips/plan
   * Body: { destinationId, budget, durationDays, interests: string[], saveTrip?: boolean, title?: string, startDate?: string, endDate?: string }
   * Note: Public endpoint - authentication only required when saveTrip is true
   */
  async plan(ctx) {
    const user = ctx.state.user;
    const { destinationId, budget, durationDays, interests, saveTrip, title, startDate, endDate } =
      ctx.request.body || {};

    // Only require authentication if user wants to save the trip
    if (saveTrip && !user) {
      return ctx.unauthorized('You must be authenticated to save trips');
    }

    if (!destinationId || !budget || !durationDays) {
      return ctx.badRequest('destinationId, budget and durationDays are required');
    }

    const destination = await strapi.entityService.findOne(
      'api::destination.destination',
      destinationId,
      {
        populate: ['attractions', 'hotels', 'restaurants'],
      }
    );

    if (!destination) {
      return ctx.notFound('Destination not found');
    }

    if (!process.env.OPENAI_API_KEY) {
      return ctx.internalServerError('OPENAI_API_KEY is not configured on the server');
    }

    const interestsList =
      Array.isArray(interests) && interests.length > 0
        ? interests.join(', ')
        : 'general sightseeing, food, and popular attractions';

    const prompt = `
You are a smart travel planner API. Given a destination and constraints, return a detailed JSON itinerary and budget.

Return strict JSON (no markdown, no explanation) with this shape:
{
  "itinerary": [
    {
      "day": 1,
      "title": "string",
      "summary": "string",
      "activities": [
        {
          "timeOfDay": "morning|afternoon|evening",
          "name": "string",
          "type": "sightseeing|food|nature|adventure|culture|shopping|other",
          "approxCost": number,
          "notes": "string",
          "latitude": number (optional, approximate latitude of the activity location),
          "longitude": number (optional, approximate longitude of the activity location)
        }
      ]
    }
  ],
  "budgetBreakdown": {
    "currency": "USD",
    "total": number,
    "accommodationPerNight": number,
    "foodPerDay": number,
    "transportPerDay": number,
    "activitiesPerDay": number,
    "notes": "string"
  }
}

Destination: ${destination.name}, ${destination.country}${destination.latitude && destination.longitude ? ` (Coordinates: ${destination.latitude}, ${destination.longitude})` : ''}
Trip duration: ${durationDays} days
Total budget: ${budget}
User interests: ${interestsList}

IMPORTANT: For each activity, if you know the approximate location, include latitude and longitude coordinates. These will be used to display the activities on a map. If you're unsure of exact coordinates, you can estimate based on the destination's location or omit them.
`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a travel planning assistant that outputs only valid JSON objects suitable for an API response.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return ctx.internalServerError('Failed to generate itinerary from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // If the model wrapped JSON in backticks or text, try to extract JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return ctx.internalServerError('AI response was not valid JSON');
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch (err) {
        return ctx.internalServerError('Failed to parse AI JSON response');
      }
    }

    const responseData: any = {
      destination: {
        id: destination.id,
        name: destination.name,
        country: destination.country,
        latitude: destination.latitude || undefined,
        longitude: destination.longitude || undefined,
      },
      durationDays,
      budget,
      interests,
      itinerary: parsed.itinerary,
      budgetBreakdown: parsed.budgetBreakdown,
    };

    if (saveTrip) {
      if (!startDate || !endDate) {
        return ctx.badRequest('startDate and endDate are required when saveTrip is true');
      }

      const tripTitle =
        title || `Trip to ${destination.name} (${durationDays} days, budget ${budget})`;

      const createdTrip = await strapi.entityService.create('api::trip.trip', {
        data: {
          title: tripTitle,
          destination: destination.id,
          startDate,
          endDate,
          durationDays,
          totalBudget: budget,
          interests,
          itinerary: parsed.itinerary,
          budgetBreakdown: parsed.budgetBreakdown,
          owner: user.id,
        },
      });

      responseData.trip = createdTrip;
    }

    ctx.body = responseData;
  },
}));

