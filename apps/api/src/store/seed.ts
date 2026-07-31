import type { MenuItem, Restaurant } from '@foodstra/shared';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { getStore } from './index.js';

interface SeedItem {
  name: string;
  category: string;
  priceMinor: number;
  description: string;
}

interface SeedRestaurant {
  name: string;
  cuisines: string[];
  description: string;
  items: SeedItem[];
}

const SEED: SeedRestaurant[] = [
  {
    name: 'Nonna Black',
    cuisines: ['Italian', 'Pizza'],
    description: 'Wood-fired pizza and fresh pasta.',
    items: [
      { name: 'Margherita Pizza', category: 'Pizza', priceMinor: 1400, description: 'Tomato, mozzarella, basil.' },
      { name: 'Pepperoni Pizza', category: 'Pizza', priceMinor: 1650, description: 'Double pepperoni, mozzarella.' },
      { name: 'Spaghetti Carbonara', category: 'Pasta', priceMinor: 1550, description: 'Guanciale, egg, pecorino.' },
      { name: 'Tiramisu', category: 'Dessert', priceMinor: 800, description: 'Espresso-soaked ladyfingers.' },
    ],
  },
  {
    name: 'Sakura House',
    cuisines: ['Japanese', 'Sushi'],
    description: 'Fresh sushi and ramen.',
    items: [
      { name: 'Salmon Nigiri (2pc)', category: 'Sushi', priceMinor: 700, description: 'Fresh Atlantic salmon.' },
      { name: 'Spicy Tuna Roll', category: 'Sushi', priceMinor: 1200, description: 'Tuna, sriracha mayo, cucumber.' },
      { name: 'Tonkotsu Ramen', category: 'Ramen', priceMinor: 1600, description: 'Pork bone broth, chashu, egg.' },
      { name: 'Edamame', category: 'Sides', priceMinor: 500, description: 'Steamed, sea salt.' },
    ],
  },
  {
    name: 'Taco Libre',
    cuisines: ['Mexican', 'Tacos'],
    description: 'Street tacos and burritos.',
    items: [
      { name: 'Al Pastor Taco', category: 'Tacos', priceMinor: 450, description: 'Marinated pork, pineapple.' },
      { name: 'Carne Asada Burrito', category: 'Burritos', priceMinor: 1300, description: 'Grilled steak, rice, beans.' },
      { name: 'Chips & Guacamole', category: 'Sides', priceMinor: 750, description: 'House-made guacamole.' },
      { name: 'Horchata', category: 'Drinks', priceMinor: 400, description: 'Cinnamon rice milk.' },
    ],
  },
];

/** Populates the in-memory store with demo restaurants + menu items. */
export function seedStore(): void {
  const store = getStore();
  if (store.restaurants.size > 0) return;

  const ownerId = newId();
  const ts = nowIso();

  for (const r of SEED) {
    const restaurant: Restaurant = {
      id: newId(),
      ownerId,
      name: r.name,
      description: r.description,
      cuisines: r.cuisines,
      addressLine: '123 Market St',
      latitude: 37.7749,
      longitude: -122.4194,
      isOpen: true,
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: ts,
      updatedAt: ts,
    };
    store.restaurants.set(restaurant.id, restaurant);

    for (const i of r.items) {
      const item: MenuItem = {
        id: newId(),
        restaurantId: restaurant.id,
        name: i.name,
        description: i.description,
        category: i.category,
        priceMinor: i.priceMinor,
        currency: 'USD',
        isAvailable: true,
        createdAt: ts,
        updatedAt: ts,
      };
      store.menuItems.set(item.id, item);
    }
  }
}
