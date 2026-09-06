import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Door } from '@/app/door';
import LoginForm, { type Door as FormDoor } from '@/app/study/login/login-form';
import ResetForm from '@/app/study/reset/reset-form';
import type { AuthState } from '@/app/study/login/actions';
import { TOO_MANY } from '@/lib/auth/rate-limit';
export { visibleText } from './card-states';

// The states of Auth and Welcome.dc.html §03 with the repo's words: the page's
// heading and lede as app/study/login/page.tsx writes them, then the form.
const h1 = (text: string, mark = '.') =>
  createElement('h1', { className: 'mb-1.5 text-2xl font-black tracking-[-0.015em]' }, text, createElement('span', { className: 'text-red-pen' }, mark));
const lede = (text: ReactNode) => createElement('p', { className: 'mb-5 text-[13px] leading-normal text-dim' }, text);

const SIGN_IN_LEDE = 'Your email and a password. We keep you signed in for 30 days, so on your own phone this is usually the last time you type it.';
const CREATE_LEDE = 'Your first question is waiting: one Paper 2 question, marked the way an examiner marks it, free. Make an account and it is the first thing you see.';

const form = (door: FormDoor, props: { lockedEmail?: string; sender?: string; resetMinutes?: number; initial?: AuthState } = {}) =>
  createElement(LoginForm, { door, ...props });

export const AUTH: Record<string, () => ReactNode[]> = {
  'sign-in': () => [h1('Sign in'), lede(SIGN_IN_LEDE), form('signin')],
  create: () => [h1('Create your account'), lede(CREATE_LEDE), form('create')],
  'create-locked': () => [
    h1('Create your account'),
    lede(['The access is waiting on ', createElement('b', { key: 'e', className: 'text-ink' }, 'k···@example.com'), '. Create the account on that address and it is applied.']),
    form('create', { lockedEmail: 'kiara@example.com' }),
  ],
  error: () => [h1('Sign in'), lede(SIGN_IN_LEDE), form('signin', { initial: { error: 'That email and password do not match.', email: 'kiara@exampl.com' } })],
  'rate-limited': () => [h1('Sign in'), lede(SIGN_IN_LEDE), form('signin', { initial: { error: TOO_MANY, email: 'kiara@example.com' } })],
  reset: () => [form('reset', { sender: 'ExtraLesson <hello@extralesson.app>', resetMinutes: 30 })],
  'reset-limited': () => [form('reset', { sender: 'ExtraLesson <hello@extralesson.app>', resetMinutes: 30, initial: { error: TOO_MANY, email: 'kiara@example.com' } })],
  'reset-sent': () => [form('reset', { sender: 'ExtraLesson <hello@extralesson.app>', resetMinutes: 30, initial: { resetRequested: true, email: 'kiara@example.com' } })],
  'new-password': () => [h1('Set a new password'), createElement(ResetForm, { token: 't' })],
  'new-password-error': () => [h1('Set a new password'), createElement(ResetForm, { token: 't', initial: { error: 'That link has expired. Ask for a new one.' } })],
};

export const renderAuth = (name: keyof typeof AUTH): string =>
  renderToStaticMarkup(createElement(Door, { signedIn: false, children: AUTH[name]().map((n, i) => createElement('div', { key: i, className: 'contents' }, n)) }));
