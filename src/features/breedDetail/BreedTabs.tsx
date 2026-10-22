import { useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  TabBar,
  TabView,
  type NavigationState,
  type SceneRendererProps,
} from 'react-native-tab-view';

import { BoundaryFallback } from '@/components';
import type { Breed } from '@/domain/types';
import { useTheme } from '@/theme';

import { GalleryTab } from './GalleryTab';
import { OverviewTab } from './OverviewTab';
import { TraitsTab } from './TraitsTab';

type TabKey = 'overview' | 'traits' | 'gallery';
type TabRoute = { key: TabKey; title: string };

type Props = { breed: Breed };

export function BreedTabs({ breed }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const routes = useMemo<TabRoute[]>(
    () => [
      { key: 'overview', title: 'Overview' },
      { key: 'traits', title: 'Traits' },
      { key: 'gallery', title: `Gallery (${breed.images.length})` },
    ],
    [breed.images.length],
  );

  // Each tab has its own boundary, so a broken gallery can't take down the overview.
  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      let scene;
      if (route.key === 'overview') scene = <OverviewTab breed={breed} />;
      else if (route.key === 'traits') scene = <TraitsTab breed={breed} />;
      else scene = <GalleryTab breed={breed} />;
      return <ErrorBoundary FallbackComponent={BoundaryFallback}>{scene}</ErrorBoundary>;
    },
    [breed],
  );

  const renderTabBar = useCallback(
    (props: SceneRendererProps & { navigationState: NavigationState<TabRoute> }) => (
      <TabBar
        {...props}
        activeColor={colors.primary}
        inactiveColor={colors.textMuted}
        indicatorStyle={{ backgroundColor: colors.primary }}
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      />
    ),
    [colors],
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setIndex}
      initialLayout={{ width }}
      // The gallery's photos only start loading once someone opens that tab.
      lazy={({ route }) => route.key === 'gallery'}
      style={{ backgroundColor: colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  tabBar: { elevation: 0, shadowOpacity: 0, borderBottomWidth: StyleSheet.hairlineWidth },
});
