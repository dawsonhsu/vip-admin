'use client';

import React from 'react';
import { Cascader } from 'antd';
import { freeSpinRestrictionCatalog } from '@/data/mockData';
import type { GameType } from '@/data/memberStatsData';

type RestrictionCatalogEntry = [GameType, (typeof freeSpinRestrictionCatalog)[GameType]];

export const ALL_RESTRICTION_PATHS: [GameType, string][] = (
  Object.entries(freeSpinRestrictionCatalog) as RestrictionCatalogEntry[]
).flatMap(([gameType, restrictionProviders]) =>
  restrictionProviders.map((provider) => [gameType, provider.code] as [GameType, string])
);

export const gameRestrictionOptions = [
  { value: '__all__', label: '所有遊戲' },
  ...(Object.entries(freeSpinRestrictionCatalog) as RestrictionCatalogEntry[]).map(
    ([gameType, restrictionProviders]) => ({
      value: gameType,
      label: gameType,
      children: restrictionProviders.map((p) => ({
        value: p.code,
        label: p.name,
      })),
    })
  ),
];

export function GameRestrictionCascader({
  value,
  onChange,
  placeholder = '選擇遊戲類型 → 廠商',
  'data-e2e-id': dataEId,
}: {
  value?: (string[])[];
  onChange?: (value: (string[])[]) => void;
  placeholder?: string;
  'data-e2e-id'?: string;
}) {
  const isAllSelected = !!(
    value?.length &&
    ALL_RESTRICTION_PATHS.every((path) =>
      (value || []).some((v) => v[0] === path[0] && v[1] === path[1])
    )
  );

  const effectiveValue: (string[])[] = isAllSelected
    ? [['__all__'], ...ALL_RESTRICTION_PATHS]
    : value || [];

  const handleChange = (newPaths: (string[])[]) => {
    const prevHasAll = effectiveValue.some((p) => p[0] === '__all__');
    const nextHasAll = newPaths.some((p) => p[0] === '__all__');
    const realNewPaths = newPaths.filter((p) => p[0] !== '__all__');

    if (!prevHasAll && nextHasAll) {
      onChange?.(ALL_RESTRICTION_PATHS);
    } else if (prevHasAll && nextHasAll) {
      onChange?.(realNewPaths);
    } else if (prevHasAll && !nextHasAll) {
      onChange?.([]);
    } else {
      onChange?.(realNewPaths);
    }
  };

  return (
    <Cascader
      multiple
      options={gameRestrictionOptions}
      value={effectiveValue}
      onChange={(v) => handleChange(v as (string[])[])}
      placeholder={placeholder}
      showCheckedStrategy={Cascader.SHOW_PARENT}
      showSearch={{
        filter: (inputValue, path) =>
          path.some((option) =>
            String(option.label).toLowerCase().includes(inputValue.toLowerCase())
          ),
      }}
      data-e2e-id={dataEId}
    />
  );
}
