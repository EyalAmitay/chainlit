import { prepareContent } from '@/lib/message';
import { isEqual } from 'lodash';
import { forwardRef, memo, useMemo } from 'react';

import type { IMessageElement, IStep } from '@chainlit/react-client';

import { CURSOR_PLACEHOLDER } from '@/components/BlinkingCursor';
import { Markdown } from '@/components/Markdown';

import { InlinedElements } from './InlinedElements';

type ContentSection = 'input' | 'output';

export interface Props {
  elements: IMessageElement[];
  message: IStep;
  allowHtml?: boolean;
  latex?: boolean;
  renderMarkdown?: boolean;
  sections?: ContentSection[];
  isExpiredAsk?: boolean;
}

const getMessageRenderProps = (message: IStep) => ({
  id: message.id,
  output: message.output,
  input: message.input,
  language: message.language,
  streaming: message.streaming,
  showInput: message.showInput,
  type: message.type
});

const MessageContent = memo(
  forwardRef<HTMLDivElement, Props>(
    (
      {
        message,
        elements,
        allowHtml,
        latex,
        renderMarkdown,
        sections,
        isExpiredAsk
      },
      ref
    ) => {
      const outputContent =
        message.streaming && message.output
          ? message.output + CURSOR_PLACEHOLDER
          : message.output;

      const {
        preparedContent: output,
        inlinedElements: outputInlinedElements,
        refElements: outputRefElements
      } = prepareContent({
        elements,
        id: message.id,
        content: outputContent,
        language: message.language
      });

      const selectedSections = sections ?? ['input', 'output'];
      const sectionsSet = useMemo(
        () => new Set(selectedSections),
        [selectedSections]
      );

      const displayInput =
        sectionsSet.has('input') && message.input && message.showInput;
      const displayOutput = sectionsSet.has('output');

      const isMessage = message.type.includes('message');

      const outputMarkdown = displayOutput ? (
        <>
          {!isMessage && displayInput && message.output ? (
            <div className="font-medium">Output</div>
          ) : null}
          <Markdown
            allowHtml={allowHtml}
            latex={latex}
            renderMarkdown={renderMarkdown}
            refElements={outputRefElements}
          >
            {output}
          </Markdown>
        </>
      ) : null;

      let inputMarkdown;

      if (displayInput) {
        const inputContent =
          message.streaming && message.input
            ? message.input + CURSOR_PLACEHOLDER
            : message.input;
        const { preparedContent: input, refElements: inputRefElements } =
          prepareContent({
            elements,
            id: message.id,
            content: inputContent,
            language:
              typeof message.showInput === 'string'
                ? message.showInput
                : undefined
          });

        inputMarkdown = (
          <>
            <Markdown
              allowHtml={allowHtml}
              latex={latex}
              renderMarkdown={renderMarkdown}
              refElements={inputRefElements}
            >
              {input}
            </Markdown>
          </>
        );
      }

      const markdownContent = (
        <div className="flex flex-col gap-4">
          {inputMarkdown}
          {outputMarkdown}
        </div>
      );

      const hasExpiredWidget =
        !!isExpiredAsk && outputInlinedElements.length > 0;

      return (
        <div ref={ref} className="message-content w-full flex flex-col gap-2">
          {displayInput || (displayOutput && output) ? markdownContent : null}
          {displayOutput ? (
            <fieldset
              disabled={hasExpiredWidget}
              className={
                hasExpiredWidget
                  ? 'min-w-0 opacity-50 pointer-events-none'
                  : 'contents'
              }
            >
              <InlinedElements elements={outputInlinedElements} />
            </fieldset>
          ) : null}
          {/* An answered ask is cleared a moment before the server removes
              its widget; the delay keeps the notice out of that gap. */}
          {displayOutput && hasExpiredWidget ? (
            <div className="expired-ask text-sm text-muted-foreground animate-in fade-in delay-1000 fill-mode-backwards">
              This request is no longer active.
            </div>
          ) : null}
        </div>
      );
    }
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.allowHtml === nextProps.allowHtml &&
      prevProps.latex === nextProps.latex &&
      prevProps.renderMarkdown === nextProps.renderMarkdown &&
      prevProps.elements === nextProps.elements &&
      prevProps.isExpiredAsk === nextProps.isExpiredAsk &&
      isEqual(
        prevProps.sections ?? ['input', 'output'],
        nextProps.sections ?? ['input', 'output']
      ) &&
      isEqual(
        getMessageRenderProps(prevProps.message),
        getMessageRenderProps(nextProps.message)
      )
    );
  }
);

export { MessageContent };
