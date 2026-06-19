import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Send, Wrench } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { fireEvent } from '@/lib/events';
import { type NovaMessage, greeting, loadMessages, localRespond, saveMessages } from '@/lib/nova';
import { useGameStore } from '@/lib/store/gameStore';
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

function ToolRow({ summary }: { summary: string }) {
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
        NOVA used {summary}
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
      {message.tools?.map((t) => (
        <ToolRow key={t.name} summary={t.name} />
      ))}
    </View>
  );
}

export default function NovaScreen() {
  const persona = useGameStore((s) => s.persona);
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const listRef = useRef<FlashList<NovaMessage>>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    void loadMessages().then((loaded) => {
      if (loaded.length > 0) {
        setMessages(loaded);
      } else {
        setMessages([{ id: 'greet', role: 'nova', content: greeting(persona), ts: Date.now() }]);
      }
    });
    const pendingTimers = timers.current;
    return () => {
      for (const t of pendingTimers) clearTimeout(t);
    };
  }, [persona]);

  const persist = useCallback((next: NovaMessage[]) => {
    setMessages(next);
    void saveMessages(next);
  }, []);

  const streamReply = useCallback(
    (full: NovaMessage, base: NovaMessage[]) => {
      // Token-by-token reveal (local). Replace with server SSE stream when wired.
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
              const finalMsg: NovaMessage = { ...full, content: acc };
              persist([...base, finalMsg]);
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
      const reply = localRespond(trimmed, persona);
      if (reply.tools?.length) void fireEvent('nova.tool.suggest_quest');
      const t = setTimeout(() => streamReply(reply, withUser), 250);
      timers.current.push(t);
    },
    [messages, persona, streamingId, streamReply],
  );

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
              <Mono style={{ fontSize: 10, color: COLORS.lime }}>
                ● online · {persona.toLowerCase()}
              </Mono>
            </View>
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
