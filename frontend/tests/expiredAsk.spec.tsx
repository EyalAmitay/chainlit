import {
  MessageContext,
  defaultMessageContext
} from '@/contexts/MessageContext';
import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { IImageElement, IStep } from '@chainlit/react-client';

import { Message } from '@/components/chat/Messages/Message';

vi.mock('hooks/useLayoutMaxWidth', () => ({ useLayoutMaxWidth: () => 800 }));
vi.mock('@/components/chat/Messages/Message/Avatar', () => ({
  MessageAvatar: () => null
}));
vi.mock('@/components/chat/Messages/Message/Buttons', () => ({
  MessageButtons: () => null
}));
vi.mock('@/components/chat/Messages/Message/AskFileButton', () => ({
  AskFileButton: () => null
}));
vi.mock('@/components/chat/Messages/Message/AskActionButtons', () => ({
  AskActionButtons: () => null
}));

const askMessage: IStep = {
  threadId: 'test',
  type: 'assistant_message',
  output: 'Approve?',
  id: 'ask1',
  name: 'Assistant',
  createdAt: 0,
  waitForAnswer: true
};
const askWidget = {
  id: 'el1',
  name: 'form',
  type: 'image',
  display: 'inline',
  forId: 'ask1',
  url: 'x'
} as IImageElement;

const renderAsk = (pendingStepId?: string) =>
  render(
    <MessageContext.Provider
      value={{
        ...defaultMessageContext,
        askUser: pendingStepId
          ? {
              callback: () => undefined,
              spec: { type: 'element', step_id: pendingStepId, timeout: 90 }
            }
          : undefined
      }}
    >
      <Message
        message={askMessage}
        elements={[askWidget]}
        actions={[]}
        indent={0}
      />
    </MessageContext.Provider>
  );

it('disables the widget of an ask the session no longer holds', () => {
  const { container, getByText } = renderAsk();
  expect(container.querySelector('fieldset')).toBeDisabled();
  expect(getByText('This request is no longer active.')).toBeInTheDocument();
});

it('disables the widget when the session moved on to another ask', () => {
  const { container } = renderAsk('ask2');
  expect(container.querySelector('fieldset')).toBeDisabled();
});

it('keeps the widget of the pending ask enabled', () => {
  const { container, queryByText } = renderAsk('ask1');
  expect(container.querySelector('fieldset')).not.toBeDisabled();
  expect(queryByText('This request is no longer active.')).toBeNull();
});
