import {
  FunctionDeclaration,
  GenerateContentStreamResult,
  GoogleGenerativeAI,
  Tool as GeminiToolFromSDK,
  SchemaType,
  Part,
  FunctionCallPart,
} from '@google/generative-ai';
import {
  AIMessage,
  BaseMessage,
  FunctionMessage,
  HumanMessage,
} from '@langchain/core/messages';
import {
  BaseCallbackHandler,
  NewTokenIndices,
} from '@langchain/core/callbacks/base';
import { Serialized } from '@langchain/core/load/serializable';
import { ChatGeneration, LLMResult } from '@langchain/core/outputs';
import { ToolCall } from '@langchain/core/messages/tool';

import { availableTools } from '../tools';
import { SYSTEM_PROMPT } from '../prompt/system';

import { Provider } from './provider';

//  TODO: change to choose model
const MODEL_NAME = 'gemini-1.5-flash';
const PROVIDER_NAME = 'google';

export class GeminiProvider implements Provider {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set.');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const geminiFunctionDeclarations: FunctionDeclaration[] =
      availableTools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties: tool.schema.properties || {},
          required: tool.schema.required || [],
        },
      })) || [];

    const geminiToolsForModel: GeminiToolFromSDK[] =
      geminiFunctionDeclarations.length > 0
        ? [{ functionDeclarations: geminiFunctionDeclarations }]
        : [];

    this.model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
      tools: geminiToolsForModel,
    });
  }

  getModelName(): string {
    return MODEL_NAME;
  }

  getProviderName(): string {
    return PROVIDER_NAME;
  }

  supportsPreviousResponseId(): boolean {
    return false;
  }

  async generate(options: StreamOptions) {
    try {
      const geminiContents: { role: string; parts: Part[] }[] = [];

      geminiContents.push({
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT.template }],
      });

      for (const msg of messages) {
        if (msg.content === SYSTEM_PROMPT.template && msg._getType() === 'ai') {
          continue;
        }

        if (
          msg instanceof AIMessage &&
          msg.content === SYSTEM_PROMPT.template
        ) {
          continue;
        }

        if (msg instanceof HumanMessage) {
          geminiContents.push({
            role: 'user',
            parts: [{ text: msg.content as string }],
          });
        } else if (msg instanceof AIMessage) {
          const aiMessage = msg as AIMessage;
          const parts: Part[] = [];

          if (
            typeof aiMessage.content === 'string' &&
            aiMessage.content.length > 0
          ) {
            parts.push({ text: aiMessage.content });
          }

          if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            aiMessage.tool_calls.forEach((tc) => {
              parts.push({
                functionCall: {
                  name: tc.name,
                  args: tc.args as Record<string, any>,
                },
              });
            });
          }
          if (parts.length === 0) {
            parts.push({ text: '' });
          }
          geminiContents.push({ role: 'model', parts: parts });
        } else if (msg instanceof FunctionMessage) {
          const functionMessage = msg as FunctionMessage;
          geminiContents.push({
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: functionMessage.name,
                  response: {
                    content: functionMessage.content,
                  },
                },
              },
            ],
          });
        }
      }

      const promptStrings: string[] = [
        geminiContents
          .map((content) => {
            const partsString = content.parts
              .map((part) =>
                'text' in part
                  ? part.text
                  : JSON.stringify(part.functionCall || part.functionResponse),
              )
              .join('\n');
            return `${content.role}: ${partsString}`;
          })
          .join('\n\n'),
      ];

      for (const handler of callbacks) {
        const serializedLLM = {
          lc: 1,
          type: 'not_implemented',
          id: ['langchain', 'llms', PROVIDER_NAME, MODEL_NAME],
          lc_kwargs: {
            model_name: MODEL_NAME,
            provider_name: PROVIDER_NAME,
          },
          name: MODEL_NAME,
        };

        await handler.handleLLMStart(
          serializedLLM as unknown as Serialized,
          promptStrings,
          runId,
          parentRunId,
          undefined, // extraParams?: Record<string, unknown>
          [], // tags?: string[]
          {}, // metadata?: Record<string, unknown>
          undefined, // runName?: string
        );
      }

      const result = await this.model.generateContentStream({
        contents: geminiContents,
      });

      return this.transformGeminiStream(result, callbacks, runId, parentRunId);
    } catch (error) {
      console.error('Error calling Gemini LLM:', error);

      for (const handler of callbacks) {
        await handler.handleLLMError(
          error,
          runId,
          parentRunId,
          [], // tags
          undefined, // extraParams?: Record<string, unknown>
        );
      }
      throw new Error(`Failed to generate response from Gemini: ${error}`);
    }
  }

  private async *transformGeminiStream(
    geminiStream: GenerateContentStreamResult,
    callbacks: BaseCallbackHandler[],
    runId: string,
    parentRunId: string | undefined,
  ): AsyncIterableIterator<AIMessage> {
    let combinedText = '';
    const combinedToolCalls: ToolCall[] = [];
    let finalUsageMetadata:
      | {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        }
      | undefined;

    const dummyNewTokenIndices: NewTokenIndices = { prompt: 0, completion: 0 };

    for await (const chunk of geminiStream.stream) {
      const text = chunk.text();
      combinedText += text;

      for (const handler of callbacks) {
        await handler.handleLLMNewToken(
          text,
          dummyNewTokenIndices,
          runId,
          parentRunId,
          undefined,
          undefined,
        );
      }

      const toolCallsInChunk: ToolCall[] = [];
      if (chunk.candidates && chunk.candidates.length > 0) {
        const functionCallParts = chunk.candidates[0].content?.parts?.filter(
          (part): part is FunctionCallPart => 'functionCall' in part,
        );
        if (functionCallParts && functionCallParts.length > 0) {
          for (const fc of functionCallParts) {
            const newToolCall: ToolCall = {
              id: '',
              name: fc.functionCall.name,
              args: fc.functionCall.args as Record<string, any>,
            };
            toolCallsInChunk.push(newToolCall);
            if (
              !combinedToolCalls.some(
                (tc) =>
                  tc.name === newToolCall.name &&
                  JSON.stringify(tc.args) === JSON.stringify(newToolCall.args),
              )
            ) {
              combinedToolCalls.push(newToolCall);
            }
          }
        }
      }
      yield new AIMessage({ content: text, tool_calls: toolCallsInChunk });

      if (chunk.usageMetadata) {
        finalUsageMetadata = chunk.usageMetadata;
      }
    }

    const finalAIMessage = new AIMessage({
      content: combinedText,
      tool_calls: combinedToolCalls,
      response_metadata: {
        usage_metadata: {
          input_tokens: finalUsageMetadata?.promptTokenCount || 0,
          output_tokens: finalUsageMetadata?.candidatesTokenCount || 0,
          total_tokens: finalUsageMetadata?.totalTokenCount || 0,
        },
      },
    });
    const llmResult: LLMResult = {
      generations: [
        [
          {
            text: finalAIMessage.content,
            message: finalAIMessage,
            generationInfo: {
              token_usage: {
                prompt_tokens:
                  finalAIMessage.response_metadata?.usage_metadata
                    ?.input_tokens,
                completion_tokens:
                  finalAIMessage.response_metadata?.usage_metadata
                    ?.output_tokens,
                total_tokens:
                  finalAIMessage.response_metadata?.usage_metadata
                    ?.total_tokens,
              },
            },
          } as ChatGeneration,
        ],
      ],
      llmOutput: {
        finalUsageMetadata: finalUsageMetadata,
        model_name: MODEL_NAME,
        provider_name: PROVIDER_NAME,
        tokenUsage: finalAIMessage.response_metadata?.usage_metadata,
      },
    };

    for (const handler of callbacks) {
      await handler.handleLLMEnd(
        llmResult,
        runId,
        parentRunId,
        [], // tags?: string[]
        undefined, // extraParams?: Record<string, unknown>
      );
    }
  }
}
