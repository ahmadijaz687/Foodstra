import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  AddCartItemInput,
  Cart,
  CreateOrderInput,
  Order,
  Restaurant,
} from '@foodstra/shared';
import { cacheGet, cacheSet } from '../offline/cache';
import * as api from './client';

const RESTAURANTS_KEY = ['restaurants'];

export function useRestaurants(): UseQueryResult<Restaurant[]> {
  return useQuery({
    queryKey: RESTAURANTS_KEY,
    queryFn: async () => {
      try {
        const data = await api.fetchRestaurants();
        cacheSet('restaurants', data);
        return data;
      } catch (err) {
        // Offline fallback: serve last-known list if we have one.
        const cached = cacheGet<Restaurant[]>('restaurants');
        if (cached) return cached;
        throw err;
      }
    },
  });
}

export function useMenuSearch(q: string): UseQueryResult<Restaurant[]> {
  return useQuery({
    queryKey: ['menu-search', q],
    queryFn: async () => api.fetchRestaurants(),
    select: (data) =>
      q.trim()
        ? data.filter((r) =>
            `${r.name} ${r.cuisines.join(' ')}`
              .toLowerCase()
              .includes(q.trim().toLowerCase()),
          )
        : data,
  });
}

export function useCart(): UseQueryResult<Cart> {
  return useQuery({ queryKey: ['cart'], queryFn: api.fetchCart });
}

export function useAddToCart(): UseMutationResult<Cart, Error, AddCartItemInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCartItemInput) => api.addToCart(input),
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export function useClearCart(): UseMutationResult<Cart, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.clearServerCart(),
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });
}

export function useOrders(): UseQueryResult<Order[]> {
  return useQuery({ queryKey: ['orders'], queryFn: api.fetchOrders });
}

export function useOrder(id: string): UseQueryResult<Order> {
  return useQuery({ queryKey: ['order', id], queryFn: () => api.fetchOrder(id) });
}

export function usePlaceOrder(): UseMutationResult<
  { order: Order },
  Error,
  CreateOrderInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.placeOrder(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
