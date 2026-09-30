'use client';

import { Tabs } from 'antd';

export type PagcorBrand = 'filbet' | 'filplay';

export const pagcorBrandLabels: Record<PagcorBrand, string> = {
  filbet: 'Filbet',
  filplay: 'Filplay',
};

interface PagcorBrandTabsProps {
  value: PagcorBrand;
  onChange: (brand: PagcorBrand) => void;
  e2ePrefix: string;
}

export default function PagcorBrandTabs({ value, onChange, e2ePrefix }: PagcorBrandTabsProps) {
  return (
    <Tabs
      data-e2e-id={`${e2ePrefix}-brand-tabs`}
      type="card"
      size="middle"
      activeKey={value}
      style={{ marginBottom: 0 }}
      tabBarStyle={{ marginBottom: 0 }}
      onChange={(key) => {
        if (key === 'filbet' || key === 'filplay') onChange(key);
      }}
      items={(['filbet', 'filplay'] as const).map((brand) => ({
        key: brand,
        label: <span data-e2e-id={`${e2ePrefix}-brand-tab-${brand}`}>{pagcorBrandLabels[brand]}</span>,
      }))}
    />
  );
}
