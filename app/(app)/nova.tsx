import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ArrowUpRight, Compass, Send, Wrench } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES, sendProposalHref } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import {
  type NovaMessage,
  type NovaToolCall,
  type WalletContext,
  greeting,
  loadMessages,
  localRespond,
  persistRemote,
  saveMessages,
  streamReply,
} from '@/lib/nova';
import { useGameStore } from '@/lib/store/gameStore';
import { useSession } from '@/lib/auth/session';
import { getAddresses } from '@/lib/wallet/wallet';
import { readAllBalances } from '@/lib/wallet/balances';
import { Body, Display, Mono, NovaAvatar, RadialBloom } from '@/components/sticker';

const SUGGESTIONS = ['what quest should i do?', 'check my balance', 'send some crypto'];

function BlinkingCursor() {
  const op = useSharedValue(1);
  useEffect(() => {
    op.value = withRepeat(withTiming(0, { duration: 500, easing: Easing.linear }), -1, true);
  }, [op]);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View
      style={[{ width: 8, height: 16, backgroundColor: COLORS.lime, marginLeft: 2 }, style]}
    />
  );
}

function ToolRow({ tool }: { tool: NovaToolCall }) {
  // Actionable proposals (read + propose; user signs / confirms).
  if (tool.name === 'propose_send' && tool.input) {
    const chain = typeof tool.input.chain === 'string' ? tool.input.chain : undefined;
    const to = typeof tool.input.to === 'string' ? tool.input.to : undefined;
    const amount = typeof tool.input.amount === 'string' ? tool.input.amount : undefined;
    return (
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(sendProposalHref({ chain, to, amount }));
        }}
        style={{
          alignSelf: 'flex-start',
          marginTop: 8,
          backgroundColor: COLORS.magenta,
          borderWidth: 2,
          borderColor: COLORS.black,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ArrowUpRight color={COLORS.white} size={14} />
        <Mono style={{ fontSize: 11, color: COLORS.white, fontFamily: FONTS.monoBold }}>
          REVIEW & SIGN{amount ? ` · ${amount}` : ''}
        </Mono>
      </Pressable>
    );
  }
  if (tool.name === 'suggest_quest' || tool.name === 'generate_quest') {
    return (
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(ROUTES.quests);
        }}
        style={{
          alignSelf: 'flex-start',
          marginTop: 8,
          backgroundColor: COLORS.lime,
          borderWidth: 2,
          borderColor: COLORS.black,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Compass color={COLORS.black} size={14} />
        <Mono style={{ fontSize: 11, color: COLORS.black, fontFamily: FONTS.monoBold }}>
          OPEN QUESTS
        </Mono>
      </Pressable>
    );
  }
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 8,
        alignSelf: 'flex-start',
        marginTop: 8,
        backgroundColor: COLORS.inkSoft,
        borderWidth: 2,
        borderColor: COLORS.black,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Wrench color={COLORS.cyan} size={14} />
      <Mono style={{ fontSize: 11, color: COLORS.cyan, fontFamily: FONTS.monoBold }}>
        NOVA used {tool.summary}
      </Mono>
    </View>
  );
}

function MessageBubble({ message, streaming }: { message: NovaMessage; streaming?: boolean }) {
  const isUser = message.role === 'user';
  return (
    <View style={{ marginBottom: 16, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          maxWidth: '86%',
          backgroundColor: isUser ? COLORS.purple : COLORS.card,
          borderWidth: 2,
          borderColor: COLORS.black,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <View className="flex-row items-end">
          <Body style={{ fontSize: 14, color: COLORS.white }}>{message.content}</Body>
          {streaming && <BlinkingCursor />}
        </View>
      </View>
      {message.tools?.map((t, i) => (
        // tools for a given message are set once and never reordered; index key is stable
        // eslint-disable-next-line react/no-array-index-key -- immutable per-message array; index is stable
        <ToolRow key={`${t.name}-${i}`} tool={t} />
      ))}
    </View>
  );
}

export default function NovaScreen() {
  const persona = useGameStore((s) => s.persona);
  const { session } = useSession();
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const listRef = useRef<FlashList<NovaMessage>>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const walletRef = useRef<WalletContext>({});

  useEffect(() => {
    void loadMessages().then((loaded) => {
      if (loaded.length > 0) {
        setMessages(loaded);
      } else {
        setMessages([{ id: 'greet', role: 'nova', content: greeting(persona), ts: Date.now() }]);
      }
    });
    // Gather read-only wallet context for NOVA to reason over.
    void (async () => {
      const addrs = await getAddresses();
      const balances = await readAllBalances();
      walletRef.current = {
        addresses: addrs ? { evm: addrs.evm, solana: addrs.solana } : undefined,
        balances: balances.map((b) => ({ chain: b.chain, symbol: b.symbol, amount: b.amount })),
      };
    })();
    const pendingTimers = timers.current;
    return () => {
      for (const t of pendingTimers) clearTimeout(t);
    };
  }, [persona]);

  const persist = useCallback((next: NovaMessage[]) => {
    setMessages(next);
    void saveMessages(next);
  }, []);

  // Local token-by-token reveal for the offline fallback responder.
  const revealLocal = useCallback(
    (full: NovaMessage, base: NovaMessage[]) => {
      const words = full.content.split(' ');
      setStreamingId(full.id);
      let acc = '';
      words.forEach((w, i) => {
        const t = setTimeout(
          () => {
            acc = acc ? `${acc} ${w}` : w;
            const partial: NovaMessage = { ...full, content: acc, tools: undefined };
            setMessages([...base, partial]);
            if (i === words.length - 1) {
              persist([...base, full]);
              setStreamingId(null);
            }
          },
          40 * (i + 1),
        );
        timers.current.push(t);
      });
    },
    [persist],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streamingId) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void fireEvent('nova.message.sent', { len: trimmed.length });

      const userMsg: NovaMessage = {
        id: `${Date.now()}-user`,
        role: 'user',
        content: trimmed,
        ts: Date.now(),
      };
      const withUser = [...messages, userMsg];
      setMessages(withUser);
      setInput('');
      void persistRemote(userMsg);

      const replyId = `${Date.now()}-nova`;
      const reply: NovaMessage = { id: replyId, role: 'nova', content: '', ts: Date.now() };
      const tools: NovaToolCall[] = [];
      let acc = '';
      setStreamingId(replyId);
      setMessages([...withUser, reply]);

      void (async () => {
        const used = await streamReply(withUser, persona, walletRef.current, {
          onDelta: (delta) => {
            acc += delta;
            setMessages([...withUser, { ...reply, content: acc }]);
          },
          onTool: (tool) => {
            tools.push(tool);
            void fireEvent('nova.tool', { name: tool.name });
            setMessages([...withUser, { ...reply, content: acc, tools: [...tools] }]);
          },
          onError: (message) => {
            acc = acc || message;
          },
          onDone: () => {
            const finalMsg: NovaMessage = {
              ...reply,
              content: acc || '…',
              tools: tools.length ? tools : undefined,
            };
            persist([...withUser, finalMsg]);
            void persistRemote(finalMsg);
            setStreamingId(null);
          },
        });

        if (!used) {
          // Backend unavailable / signed out — fall back to the local responder.
          const local = localRespond(trimmed, persona);
          setStreamingId(null);
          const t = setTimeout(() => revealLocal({ ...local, id: replyId }, withUser), 120);
          timers.current.push(t);
        }
      })();
    },
    [messages, persona, streamingId, persist, revealLocal],
  );

  const online = Boolean(session);

  return (
    <RadialBloom>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="pt-safe-offset-2 flex-1 px-5">
          {/* Header */}
          <View className="flex-row items-center gap-12 py-3">
            <NovaAvatar size={44} glow={false} animated />
            <View style={{ flex: 1 }}>
              <Display style={{ fontSize: 20, color: COLORS.white }}>NOVA</Display>
              <Mono style={{ fontSize: 10, color: online ? COLORS.lime : COLORS.muted }}>
                {online ? '● live · ' : '○ local · '}
                {persona.toLowerCase()}
              </Mono>
            </View>
            {!online ? (
              <Pressable
                onPress={() => router.push(ROUTES.signIn)}
                style={{
                  backgroundColor: COLORS.card,
                  borderWidth: 2,
                  borderColor: COLORS.black,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Mono style={{ fontSize: 10, color: COLORS.cyan, fontFamily: FONTS.monoBold }}>
                  SIGN IN
                </Mono>
              </Pressable>
            ) : null}
          </View>

          <View style={{ flex: 1 }}>
            <FlashList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <MessageBubble message={item} streaming={item.id === streamingId} />
              )}
              contentContainerStyle={{ paddingVertical: 12 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
            />
          </View>

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <View className="flex-row flex-wrap" style={{ gap: 8, marginBottom: 10 }}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={{
                    backgroundColor: COLORS.inkSoft,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}
                >
                  <Mono style={{ fontSize: 11, color: COLORS.white }}>{s}</Mono>
                </Pressable>
              ))}
            </View>
          )}

          {/* Composer */}
          <View
            className="pb-safe-offset-3 flex-row items-center"
            style={{ gap: 10, paddingTop: 4 }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.card,
                borderWidth: 2,
                borderColor: COLORS.black,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="ask NOVA…"
                placeholderTextColor={COLORS.muted}
                style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.white, padding: 0 }}
                onSubmitEditing={() => send(input)}
                returnKeyType="send"
              />
            </View>
            <Pressable
              onPress={() => send(input)}
              disabled={streamingId !== null}
              style={{
                width: 46,
                height: 46,
                backgroundColor: COLORS.lime,
                borderWidth: 2,
                borderColor: COLORS.black,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: streamingId ? 0.5 : 1,
              }}
            >
              <Send color={COLORS.black} size={20} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </RadialBloom>
  );
}
