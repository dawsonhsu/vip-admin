'use client';

import React from 'react';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CrownOutlined,
  DollarOutlined,
  FireOutlined,
  GiftOutlined,
  HeartOutlined,
  RocketOutlined,
  StarOutlined,
  TagOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

export const SECTION_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'fire', label: '熱門' },
  { value: 'star', label: '星選' },
  { value: 'thunderbolt', label: '閃電' },
  { value: 'crown', label: '尊爵' },
  { value: 'gift', label: '禮包' },
  { value: 'trophy', label: '獎盃' },
  { value: 'rocket', label: '新品' },
  { value: 'heart', label: '最愛' },
  { value: 'dollar', label: '高賠率' },
  { value: 'appstore', label: '綜合' },
  { value: 'calendar', label: '活動' },
  { value: 'tag', label: '標籤' },
];

const sectionIcons = {
  fire: FireOutlined,
  star: StarOutlined,
  thunderbolt: ThunderboltOutlined,
  crown: CrownOutlined,
  gift: GiftOutlined,
  trophy: TrophyOutlined,
  rocket: RocketOutlined,
  heart: HeartOutlined,
  dollar: DollarOutlined,
  appstore: AppstoreOutlined,
  calendar: CalendarOutlined,
  tag: TagOutlined,
};

export const renderSectionIcon = (
  iconKey: string | undefined,
  style?: React.CSSProperties,
): React.ReactNode => {
  if (!iconKey) return null;
  if (iconKey.startsWith('data:') || iconKey.startsWith('http') || iconKey.startsWith('/')) {
    return (
      <img
        src={iconKey}
        alt=""
        style={{
          width: '1em',
          height: '1em',
          objectFit: 'cover',
          borderRadius: 3,
          verticalAlign: 'middle',
          ...style,
        }}
      />
    );
  }
  const Icon = sectionIcons[iconKey as keyof typeof sectionIcons];
  return Icon ? <Icon style={style} /> : null;
};
