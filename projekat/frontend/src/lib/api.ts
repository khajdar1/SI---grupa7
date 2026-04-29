import axios from 'axios';
import { NETWORK } from '@/constants';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? NETWORK.API_BASE_URL_FALLBACK,
  withCredentials: true,
});
