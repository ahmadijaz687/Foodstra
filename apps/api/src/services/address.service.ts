import {
  type Address,
  type CreateAddressInput,
  type UpdateAddressInput,
} from '@foodstra/shared';
import { NotFound } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { getStore } from '../store/index.js';

export function listAddresses(userId: string): Address[] {
  return [...getStore().addresses.values()].filter((a) => a.userId === userId);
}

export function getAddress(userId: string, id: string): Address {
  const a = getStore().addresses.get(id);
  if (!a || a.userId !== userId) throw NotFound('Address not found');
  return a;
}

function clearOtherDefaults(userId: string, keepId: string): void {
  for (const a of getStore().addresses.values()) {
    if (a.userId === userId && a.id !== keepId && a.isDefault) {
      a.isDefault = false;
    }
  }
}

export function createAddress(
  userId: string,
  input: CreateAddressInput,
): Address {
  const store = getStore();
  const ts = nowIso();
  const isFirst = listAddresses(userId).length === 0;
  const address: Address = {
    id: newId(),
    userId,
    label: input.label,
    line1: input.line1,
    city: input.city,
    region: input.region,
    postalCode: input.postalCode,
    country: input.country,
    latitude: input.latitude,
    longitude: input.longitude,
    isDefault: input.isDefault || isFirst,
    ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
    ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
    createdAt: ts,
    updatedAt: ts,
  };
  store.addresses.set(address.id, address);
  if (address.isDefault) clearOtherDefaults(userId, address.id);
  return address;
}

export function updateAddress(
  userId: string,
  id: string,
  input: UpdateAddressInput,
): Address {
  const address = getAddress(userId, id);
  const updated: Address = {
    ...address,
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
    ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.region !== undefined ? { region: input.region } : {}),
    ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
    ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    updatedAt: nowIso(),
  };
  getStore().addresses.set(id, updated);
  if (updated.isDefault) clearOtherDefaults(userId, id);
  return updated;
}

export function deleteAddress(userId: string, id: string): void {
  getAddress(userId, id); // throws if not owner/missing
  getStore().addresses.delete(id);
}
