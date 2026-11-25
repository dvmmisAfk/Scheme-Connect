import type { Attribute, Scheme } from '@/engine/types';
import schemesJson from './schemes.json';
import attributesJson from './attributes.json';

export const SCHEMES = schemesJson as unknown as Scheme[];
export const ATTRIBUTES = attributesJson as unknown as Attribute[];

export const SCHEME_BY_ID: Record<string, Scheme> = Object.fromEntries(SCHEMES.map((s) => [s.id, s]));
export const ATTR_BY_ID: Record<string, Attribute> = Object.fromEntries(ATTRIBUTES.map((a) => [a.id, a]));
