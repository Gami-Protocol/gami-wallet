declare module '*.css';

declare module '@shopify/flash-list' {
  import type { Ref } from 'react';
  import type { ViewStyle, StyleProp, ScrollViewProps } from 'react-native';

  export interface FlashListProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
    keyExtractor?: (item: T, index: number) => string;
    estimatedItemSize?: number;
    contentContainerStyle?: StyleProp<ViewStyle>;
    showsVerticalScrollIndicator?: boolean;
    onContentSizeChange?: ScrollViewProps['onContentSizeChange'];
    ref?: Ref<FlashList<T>>;
  }

  export class FlashList<T> extends React.Component<FlashListProps<T>> {
    scrollToEnd(params?: { animated?: boolean }): void;
    scrollToIndex(params: { index: number; animated?: boolean }): void;
    scrollToOffset(params: { offset: number; animated?: boolean }): void;
  }
}
