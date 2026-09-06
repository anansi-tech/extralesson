import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WelcomeView, type WelcomeProps } from '@/app/welcome/welcome-view';
export { visibleText } from './card-states';

// The four states of Auth and Welcome.dc.html §04, as props.
const base: WelcomeProps = { state: { state: 'confirming', settled: false }, sessionId: 'cs_test_1', signedIn: false, lead: 'first', diagnosticOpen: true };

export const WELCOME: Record<'confirming' | 'settled' | 'payer' | 'unregistered' | 'other', WelcomeProps> = {
  confirming: base,
  settled: { ...base, state: { state: 'confirming', settled: true } },
  payer: { ...base, signedIn: true, state: { state: 'payer', email: 'kiara@example.com', sitting: 'May/June 2027', studentId: 'st1' } },
  unregistered: { ...base, state: { state: 'unregistered', email: 'kiara@example.com' } },
  other: { ...base, signedIn: true, state: { state: 'other', email: 'kiara@example.com', sitting: 'May/June 2027' } },
};

export const renderWelcome = (p: WelcomeProps): string => renderToStaticMarkup(createElement(WelcomeView, p));
